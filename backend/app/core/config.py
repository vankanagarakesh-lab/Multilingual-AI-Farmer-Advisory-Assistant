from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "KRISHI AI"
    DEBUG: bool = True
    
    DATABASE_URL: str = "sqlite:///./krishi_ai.db"
    
    SECRET_KEY: str = "CHANGE_THIS_TO_A_LONG_RANDOM_SECRET_KEY_FOR_KRISHI_AI_JWT_TOKENS_12345"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    AI_PROVIDER: str = "huggingface"
    OLLAMA_BASE_URL: str = "http://localhost:11434"
    OLLAMA_MODEL: str = "llama3.2"
    OLLAMA_TIMEOUT: float = 180.0

    # Hugging Face + PEFT LoRA Adapter Settings
    HF_BASE_MODEL: str = "Qwen/Qwen2.5-1.5B-Instruct"
    KRISHI_ADAPTER_PATH: str = "./models/krishi-ai-adapter"
    USE_LORA: bool = True
    DEVICE: str = "auto"
    FAST_RESPONSE_MODE: bool = True
    MAX_NEW_TOKENS: int = 220
    MAX_TOTAL_NEW_TOKENS: int = 350
    DO_SAMPLE: bool = False
    TEMPERATURE: float = 0.0
    TOP_P: float = 0.9
    REPETITION_PENALTY: float = 1.12
    NO_REPEAT_NGRAM_SIZE: int = 0
    
    MAX_CHAT_HISTORY: int = 2
    
    FRONTEND_URL: str = "http://localhost:5173"

    # Phase 2 Voice & RAG Settings
    STT_PROVIDER: str = "local"
    TTS_PROVIDER: str = "local"
    MAX_AUDIO_FILE_SIZE_MB: int = 25
    MAX_AUDIO_DURATION_SECONDS: int = 120
    RAG_TOP_K: int = 2
    RAG_MAX_CONTEXT_CHARS: int = 350
    RAG_SCORE_THRESHOLD: float = 0.45

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

    def get_resolved_adapter_path(self) -> str:
        """Robustly resolve the LoRA adapter folder path regardless of backend working directory."""
        import os
        raw_path = self.KRISHI_ADAPTER_PATH
        if not raw_path:
            raw_path = "models/krishi-ai-adapter"

        if os.path.isabs(raw_path) and os.path.exists(raw_path):
            return os.path.abspath(raw_path)

        current_file = os.path.abspath(__file__)
        core_dir = os.path.dirname(current_file)
        app_dir = os.path.dirname(core_dir)
        backend_dir = os.path.dirname(app_dir)
        project_root = os.path.dirname(backend_dir)
        cwd = os.getcwd()

        normalized_subpath = raw_path.replace("\\", "/").lstrip("./")

        candidates = [
            os.path.abspath(raw_path),
            os.path.join(cwd, raw_path),
            os.path.join(cwd, normalized_subpath),
            os.path.join(project_root, normalized_subpath),
            os.path.join(backend_dir, normalized_subpath),
            os.path.join(project_root, "models", "krishi-ai-adapter"),
            os.path.join(backend_dir, "models", "krishi-ai-adapter"),
        ]

        for candidate in candidates:
            if os.path.exists(candidate) and os.path.isdir(candidate):
                if os.path.exists(os.path.join(candidate, "adapter_config.json")):
                    return os.path.abspath(candidate)

        for candidate in candidates:
            if os.path.exists(candidate):
                return os.path.abspath(candidate)

        return os.path.abspath(os.path.join(project_root, normalized_subpath))



settings = Settings()
