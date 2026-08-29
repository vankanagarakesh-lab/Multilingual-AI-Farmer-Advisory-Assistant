import os
import re
import time
import logging
import asyncio
from typing import List, Dict, Any, Optional
from app.core.config import settings
from app.utils.errors import AIServiceException

logger = logging.getLogger(__name__)


def clean_ai_response(text: str) -> str:
    """
    Cleans generated AI response:
    - Removes any residual special tags (<|im_start|>, <|im_end|>, etc.)
    - Removes prompt role prefixes if any
    """
    if not text or not text.strip():
        return ""

    for tag in ["<|im_start|>", "<|im_end|>", "<|endoftext|>", "assistant\n", "assistant:", "system\n", "system:"]:
        text = text.replace(tag, "")

    return text.strip()


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
            torch.set_num_threads(min(num_cpus, 8))
            try:
                torch.set_num_interop_threads(2)
            except Exception:
                pass
            logger.info("Configured PyTorch CPU thread count to: %d", min(num_cpus, 8))

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
            logger.info("Verified valid LoRA adapter files (adapter_config.json, weights) in %s", self.adapter_path)
        else:
            logger.info("USE_LORA is disabled (false). Skipping LoRA adapter loading; using pure base model.")

        try:
            # 1. Tokenizer loading
            tokenizer_source = self.adapter_path if (should_use_lora and adapter_exists and os.path.exists(os.path.join(self.adapter_path, "tokenizer_config.json"))) else self.base_model_name
            logger.info("Loading tokenizer from: %s", tokenizer_source)
            self.tokenizer = AutoTokenizer.from_pretrained(
                tokenizer_source,
                trust_remote_code=True,
                padding_side="left"
            )
            if self.tokenizer.pad_token_id is None:
                self.tokenizer.pad_token_id = self.tokenizer.eos_token_id

            # 2. Base Model loading
            logger.info("Loading base causal LM model: %s on device: %s", self.base_model_name, self.device)
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
                logger.info("Loading KRISHI AI LoRA adapter...")
                self.model = PeftModel.from_pretrained(
                    base_model,
                    self.adapter_path,
                    torch_dtype=torch_dtype
                )
                self.has_adapter = True
                self.loaded_with_lora = True
                logger.info("KRISHI AI LoRA adapter loaded successfully.")
                logger.info("has_adapter=True")
            else:
                self.model = base_model
                self.has_adapter = False
                self.loaded_with_lora = False
                logger.info("Base model %s running without LoRA adapter.", self.base_model_name)
                logger.info("has_adapter=False")

            if self.device != "cuda":
                self.model = self.model.to(self.device)

            self.model.eval()
            self.is_loaded = True
            logger.info("HuggingFace model loaded and ready for generation (has_adapter=%s).", self.has_adapter)

        except Exception as e:
            logger.error("Failed to load Hugging Face model/adapter: %s", e, exc_info=True)
            self.is_loaded = False
            self.loaded_with_lora = None
            raise AIServiceException(
                detail=f"Failed to load Krishi AI Hugging Face model: {str(e)}"
            )

    def _sync_generate(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        max_new_tokens: Optional[int] = None
    ) -> str:
        """Synchronous PyTorch generation executed inside thread pool using inference_mode and KV caching."""
        should_use_lora = getattr(settings, "USE_LORA", True)
        if not self.is_loaded or (self.loaded_with_lora != should_use_lora):
            logger.info("Loading/Reloading model (current loaded_with_lora=%s, requested USE_LORA=%s)...", self.loaded_with_lora, should_use_lora)
            self.load_model(force_reload=True)

        import torch

        full_messages = [{"role": "system", "content": system_prompt}]
        for m in messages:
            full_messages.append({"role": m["role"], "content": m["content"]})

        try:
            # 1. Apply Qwen chat template properly
            if hasattr(self.tokenizer, "apply_chat_template"):
                prompt_text = self.tokenizer.apply_chat_template(
                    full_messages,
                    tokenize=False,
                    add_generation_prompt=True
                )
            else:
                prompt_text = f"<|im_start|>system\n{system_prompt}<|im_end|>\n"
                for msg in messages:
                    prompt_text += f"<|im_start|>{msg['role']}\n{msg['content']}<|im_end|>\n"
                prompt_text += "<|im_start|>assistant\n"

            inputs = self.tokenizer(prompt_text, return_tensors="pt").to(self.device)
            input_length = inputs["input_ids"].shape[1]

            # DEBUG LOG: Exact final prompt before tokenization and input length
            logger.info("\n" + "="*80)
            logger.info("[DEBUG LOG] EXACT FINAL PROMPT (Before Tokenization):\n%s", prompt_text)
            logger.info("[DEBUG LOG] INPUT TOKEN LENGTH: %d", input_length)
            logger.info("="*80)

            tokens_limit = max_new_tokens or settings.MAX_NEW_TOKENS

            # Configure clean generation settings
            eos_id = self.tokenizer.eos_token_id
            pad_id = self.tokenizer.eos_token_id if self.tokenizer.eos_token_id is not None else self.tokenizer.pad_token_id

            generation_config = {
                "max_new_tokens": tokens_limit,
                "use_cache": True,
                "pad_token_id": pad_id,
                "eos_token_id": eos_id,
                "do_sample": False,
                "repetition_penalty": settings.REPETITION_PENALTY if settings.REPETITION_PENALTY > 1.0 else 1.15,
            }

            # Measure model generation time
            gen_start_time = time.perf_counter()

            with torch.inference_mode():
                outputs = self.model.generate(
                    **inputs,
                    **generation_config
                )

            gen_duration = time.perf_counter() - gen_start_time

            # 2. Decode ONLY newly generated tokens (slice past input prompt)
            generated_tokens = outputs[0][input_length:]
            raw_response_text = self.tokenizer.decode(generated_tokens, skip_special_tokens=True).strip()

            num_tokens = len(generated_tokens)
            speed_toks = (num_tokens / gen_duration) if gen_duration > 0 else 0

            # 3. Clean output from any trailing prompt remnants
            response_text = clean_ai_response(raw_response_text)

            # DEBUG LOG: Raw and final output comparison
            logger.info("\n" + "="*80)
            logger.info("[DEBUG LOG] RAW GENERATED OUTPUT:\n%s", raw_response_text)
            logger.info("-" * 80)
            logger.info("[DEBUG LOG] FINAL CLEANED OUTPUT:\n%s", response_text)
            logger.info("-" * 80)
            logger.info(
                "[DEBUG LOG] MODEL PERFORMANCE: Time=%.3f s | Tokens=%d (%.1f tok/s) | Active LoRA=%s (USE_LORA=%s)",
                gen_duration, num_tokens, speed_toks, self.has_adapter, should_use_lora
            )
            logger.info("="*80 + "\n")

            if not response_text:
                raise AIServiceException(detail="Generated AI response was empty.")

            return response_text

        except Exception as e:
            logger.error("Error during model generation: %s", e, exc_info=True)
            raise AIServiceException(
                detail=f"Model generation error: {str(e)}"
            )

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        max_new_tokens: Optional[int] = None
    ) -> str:
        """Asynchronously calls model generation offloaded to thread pool."""
        return await asyncio.to_thread(self._sync_generate, messages, system_prompt, max_new_tokens)

