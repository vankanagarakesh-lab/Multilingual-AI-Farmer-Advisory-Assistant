import os
import re
import time
import logging
import asyncio
import threading
from typing import List, Dict, Any, Optional, Set, AsyncGenerator
from app.core.config import settings
from app.utils.errors import AIServiceException

logger = logging.getLogger(__name__)

# Punctuation markers signifying a complete sentence across English, Telugu, Hindi, etc.
SENTENCE_ENDINGS = {'.', '!', '?', '|', '।', '॥', ':', '\n'}


def clean_ai_response(text: str) -> str:
    """
    Cleans generated AI response:
    - Removes residual special tags (<|im_start|>, <|im_end|>, etc.)
    - Removes prompt role prefixes if any
    - Preserves all numbered lists, farming steps, and complete formatting
    """
    if not text or not text.strip():
        return ""

    for tag in ["<|im_start|>", "<|im_end|>", "<|endoftext|>", "assistant\n", "assistant:", "system\n", "system:"]:
        text = text.replace(tag, "")

    text = text.replace("\ufffd", "")
    return text.strip()


def is_response_complete(text: str) -> bool:
    """
    Checks if the generated text ends cleanly on a sentence or paragraph boundary.
    """
    cleaned = text.rstrip()
    if not cleaned:
        return False

    last_char = cleaned[-1]
    if last_char in {'.', '!', '?', '।', '॥', ':', ')'}:
        return True

    if cleaned.endswith('\n') or '\n\n' in cleaned[-5:]:
        return True

    return False


def ensure_complete_sentences(text: str) -> str:
    """
    Guarantees the AI response does not terminate in the middle of a sentence.
    If the text was cut off at the hard maximum limit, trims back to the last complete sentence.
    """
    if not text or not text.strip():
        return ""

    cleaned = text.strip()
    if is_response_complete(cleaned):
        return cleaned

    last_punct_idx = -1
    for i in range(len(cleaned) - 1, -1, -1):
        if cleaned[i] in {'.', '!', '?', '।', '॥', '\n'}:
            last_punct_idx = i
            break

    if last_punct_idx > int(len(cleaned) * 0.4):
        return cleaned[:last_punct_idx + 1].strip()

    return cleaned + "."


class HFModelManager:
    _instance: Optional['HFModelManager'] = None

    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.device = "cpu"
        self.is_loaded = False
        self.has_adapter = False
        self.loaded_with_lora: Optional[bool] = None
        self.base_model_name = settings.HF_BASE_MODEL
        self.adapter_path = settings.get_resolved_adapter_path()

    @classmethod
    def get_instance(cls) -> 'HFModelManager':
        if cls._instance is None:
            cls._instance = HFModelManager()
        return cls._instance

    def _determine_device(self) -> str:
        req_device = settings.DEVICE.lower()
        if req_device == "cuda" or (req_device == "auto"):
            try:
                import torch
                if torch.cuda.is_available():
                    logger.info("CUDA GPU detected. Using GPU execution for HuggingFace model.")
                    return "cuda"
            except Exception as e:
                logger.warning("Could not check CUDA status: %s", e)
        
        logger.info("Using optimized CPU execution mode for HuggingFace model.")
        return "cpu"

    def load_model(self, force_reload: bool = False) -> None:
        """Loads base model and optionally PEFT LoRA adapter into memory based on USE_LORA setting."""
        should_use_lora = getattr(settings, "USE_LORA", True)
        if self.is_loaded and not force_reload and (self.loaded_with_lora == should_use_lora):
            logger.info("HuggingFace model is already loaded in memory (USE_LORA=%s).", self.loaded_with_lora)
            return

        try:
            import torch
            from transformers import AutoModelForCausalLM, AutoTokenizer
            from peft import PeftModel
        except ImportError as e:
            logger.error("Required ML packages (torch, transformers, peft) not available: %s", e)
            raise AIServiceException(
                detail="Hugging Face dependencies (torch, transformers, peft) are missing in python environment."
            )

        self.device = self._determine_device()
        self.adapter_path = settings.get_resolved_adapter_path()

        if self.device == "cpu":
            num_cpus = os.cpu_count() or 4
            torch.set_num_threads(num_cpus)
            try:
                torch.set_num_interop_threads(2)
            except Exception:
                pass
            logger.info("Configured PyTorch CPU threads to maximum capacity: %d", num_cpus)

        logger.info("Loading base model: %s", self.base_model_name)
        logger.info("LoRA enabled: %s", should_use_lora)
        logger.info("LoRA adapter path: %s", self.adapter_path)

        adapter_exists = False
        if should_use_lora:
            if not os.path.exists(self.adapter_path) or not os.path.isdir(self.adapter_path):
                raise AIServiceException(
                    detail=f"LoRA adapter directory not found at: {self.adapter_path}"
                )
            
            existing_files = os.listdir(self.adapter_path)
            if "adapter_config.json" not in existing_files:
                raise AIServiceException(
                    detail=f"Missing adapter_config.json in LoRA adapter directory: {self.adapter_path}"
                )
            if not any(f.startswith("adapter_model") for f in existing_files):
                raise AIServiceException(
                    detail=f"Missing adapter_model weights (.safetensors or .bin) in LoRA adapter directory: {self.adapter_path}"
                )
            
            adapter_exists = True
            logger.info("Verified valid LoRA adapter files in %s", self.adapter_path)
        else:
            logger.info("USE_LORA is disabled (false). Skipping LoRA adapter loading; using pure base model.")

        try:
            # 1. Tokenizer loading
            tokenizer_source = self.adapter_path if (should_use_lora and adapter_exists and os.path.exists(os.path.join(self.adapter_path, "tokenizer_config.json"))) else self.base_model_name
            self.tokenizer = AutoTokenizer.from_pretrained(
                tokenizer_source,
                trust_remote_code=True,
                padding_side="left"
            )
            if self.tokenizer.pad_token_id is None:
                self.tokenizer.pad_token_id = self.tokenizer.eos_token_id

            # 2. Base Model loading with low_cpu_mem_usage
            torch_dtype = torch.float16 if self.device == "cuda" else torch.float32
            base_model = AutoModelForCausalLM.from_pretrained(
                self.base_model_name,
                torch_dtype=torch_dtype,
                device_map="auto" if self.device == "cuda" else None,
                trust_remote_code=True,
                low_cpu_mem_usage=True
            )

            # 3. PEFT LoRA Adapter loading
            if should_use_lora and adapter_exists:
                self.model = PeftModel.from_pretrained(
                    base_model,
                    self.adapter_path,
                    torch_dtype=torch_dtype
                )
                self.has_adapter = True
                self.loaded_with_lora = True
            else:
                self.model = base_model
                self.has_adapter = False
                self.loaded_with_lora = False

            if self.device != "cuda":
                self.model = self.model.to(self.device)

            self.model.eval()
            self.is_loaded = True
            logger.info("HuggingFace model loaded and optimized (has_adapter=%s).", self.has_adapter)

        except Exception as e:
            logger.error("Failed to load Hugging Face model/adapter: %s", e, exc_info=True)
            self.is_loaded = False
            self.loaded_with_lora = None
            raise AIServiceException(
                detail=f"Failed to load Krishi AI Hugging Face model: {str(e)}"
            )

    def _build_prompt_text(self, messages: List[Dict[str, str]], system_prompt: str) -> str:
        """Constructs Qwen formatted prompt string."""
        full_messages = [{"role": "system", "content": system_prompt}]
        for m in messages:
            full_messages.append({"role": m["role"], "content": m["content"]})

        if hasattr(self.tokenizer, "apply_chat_template"):
            return self.tokenizer.apply_chat_template(
                full_messages,
                tokenize=False,
                add_generation_prompt=True
            )
        else:
            prompt_text = f"<|im_start|>system\n{system_prompt}<|im_end|>\n"
            for msg in messages:
                prompt_text += f"<|im_start|>{msg['role']}\n{msg['content']}<|im_end|>\n"
            prompt_text += "<|im_start|>assistant\n"
            return prompt_text

    def _sync_generate(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        max_new_tokens: Optional[int] = None
    ) -> str:
        """
        Fast, optimized synchronous generation using torch.inference_mode() and dynamic continuation.
        """
        should_use_lora = getattr(settings, "USE_LORA", True)
        if not self.is_loaded or (self.loaded_with_lora != should_use_lora):
            self.load_model(force_reload=True)

        import torch

        try:
            prompt_text = self._build_prompt_text(messages, system_prompt)
            inputs = self.tokenizer(prompt_text, return_tensors="pt").to(self.device)
            prompt_input_ids = inputs["input_ids"]
            initial_prompt_length = prompt_input_ids.shape[1]

            chunk_size = max_new_tokens or settings.MAX_NEW_TOKENS
            max_total_limit = max(chunk_size, getattr(settings, "MAX_TOTAL_NEW_TOKENS", 700))

            eos_ids: Set[int] = set()
            if self.tokenizer.eos_token_id is not None:
                if isinstance(self.tokenizer.eos_token_id, list):
                    eos_ids.update(self.tokenizer.eos_token_id)
                else:
                    eos_ids.add(self.tokenizer.eos_token_id)

            pad_id = self.tokenizer.pad_token_id or (list(eos_ids)[0] if eos_ids else 0)

            all_generated_tokens: List[int] = []
            current_input_ids = prompt_input_ids
            current_attention_mask = inputs.get("attention_mask", None)

            gen_start_time = time.perf_counter()
            pass_count = 0
            max_passes = 2  # Keep passes small for lightning speed

            while len(all_generated_tokens) < max_total_limit and pass_count < max_passes:
                pass_count += 1
                remaining_tokens = max_total_limit - len(all_generated_tokens)
                tokens_to_gen = min(chunk_size, remaining_tokens)
                if tokens_to_gen <= 0:
                    break

                gen_config = {
                    "max_new_tokens": tokens_to_gen,
                    "use_cache": True,
                    "pad_token_id": pad_id,
                    "eos_token_id": list(eos_ids) if len(eos_ids) > 1 else (list(eos_ids)[0] if eos_ids else None),
                    "do_sample": False,
                    "repetition_penalty": settings.REPETITION_PENALTY if settings.REPETITION_PENALTY > 1.0 else 1.12,
                }

                with torch.inference_mode():
                    outputs = self.model.generate(
                        input_ids=current_input_ids,
                        attention_mask=current_attention_mask,
                        **gen_config
                    )

                pass_new_tokens = outputs[0][current_input_ids.shape[1]:].tolist()
                if not pass_new_tokens:
                    break

                all_generated_tokens.extend(pass_new_tokens)
                current_input_ids = outputs
                if current_attention_mask is not None:
                    ones = torch.ones((1, len(pass_new_tokens)), dtype=current_attention_mask.dtype, device=current_attention_mask.device)
                    current_attention_mask = torch.cat([current_attention_mask, ones], dim=1)

                last_tok = pass_new_tokens[-1]
                hit_eos = (last_tok in eos_ids) or (len(pass_new_tokens) < tokens_to_gen)
                text_so_far = self.tokenizer.decode(all_generated_tokens, skip_special_tokens=True).strip()

                if hit_eos or is_response_complete(text_so_far):
                    break

            gen_duration = time.perf_counter() - gen_start_time
            raw_response_text = self.tokenizer.decode(all_generated_tokens, skip_special_tokens=True).strip()
            response_text = clean_ai_response(raw_response_text)
            response_text = ensure_complete_sentences(response_text)

            logger.info(
                "[DEBUG LOG] GENERATION FINISHED: Passes=%d | Time=%.3f s | Tokens=%d (%.1f tok/s)",
                pass_count, gen_duration, len(all_generated_tokens), (len(all_generated_tokens)/gen_duration) if gen_duration > 0 else 0
            )

            if not response_text:
                raise AIServiceException(detail="Generated AI response was empty.")

            return response_text

        except Exception as e:
            logger.error("Error during model generation: %s", e, exc_info=True)
            raise AIServiceException(detail=f"Model generation error: {str(e)}")

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        max_new_tokens: Optional[int] = None
    ) -> str:
        """Asynchronously calls model generation offloaded to thread pool."""
        return await asyncio.to_thread(self._sync_generate, messages, system_prompt, max_new_tokens)

    async def generate_response_stream(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        max_new_tokens: Optional[int] = None
    ) -> AsyncGenerator[str, None]:
        """
        Streams generated tokens token-by-token using TextIteratorStreamer.
        Allows instant time-to-first-token in the frontend.
        """
        should_use_lora = getattr(settings, "USE_LORA", True)
        if not self.is_loaded or (self.loaded_with_lora != should_use_lora):
            self.load_model(force_reload=True)

        import torch
        from transformers import TextIteratorStreamer

        prompt_text = self._build_prompt_text(messages, system_prompt)
        inputs = self.tokenizer(prompt_text, return_tensors="pt").to(self.device)

        chunk_size = max_new_tokens or settings.MAX_NEW_TOKENS
        eos_id = self.tokenizer.eos_token_id
        pad_id = self.tokenizer.pad_token_id or eos_id

        streamer = TextIteratorStreamer(
            self.tokenizer,
            skip_prompt=True,
            skip_special_tokens=True,
            timeout=30.0
        )

        gen_kwargs = {
            **inputs,
            "streamer": streamer,
            "max_new_tokens": chunk_size,
            "use_cache": True,
            "pad_token_id": pad_id,
            "eos_token_id": eos_id,
            "do_sample": False,
            "repetition_penalty": settings.REPETITION_PENALTY if settings.REPETITION_PENALTY > 1.0 else 1.12,
        }

        # Run model generation in background thread
        thread = threading.Thread(target=self._run_model_stream, args=(gen_kwargs,))
        thread.start()

        # Yield tokens from iterator as they are produced
        loop = asyncio.get_event_loop()
        while True:
            try:
                token = await loop.run_in_executor(None, next, streamer, None)
                if token is None:
                    break
                if token:
                    # Clean out special token remnants
                    token_clean = token.replace("<|im_end|>", "").replace("<|endoftext|>", "")
                    if token_clean:
                        yield token_clean
            except StopIteration:
                break
            except Exception as e:
                logger.warning("Streaming iteration exception: %s", e)
                break

        thread.join(timeout=2.0)

    def _run_model_stream(self, gen_kwargs: Dict[str, Any]):
        """Helper executed in background thread for streaming generation."""
        import torch
        try:
            with torch.inference_mode():
                self.model.generate(**gen_kwargs)
        except Exception as e:
            logger.error("Background streaming generation error: %s", e)
