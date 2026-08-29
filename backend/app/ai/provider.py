import logging
from app.ai.base import AIBaseProvider
from app.ai.huggingface_provider import HuggingFaceProvider
from app.ai.ollama_provider import OllamaProvider
from app.core.config import settings

logger = logging.getLogger(__name__)


def get_ai_provider() -> AIBaseProvider:
    provider_type = settings.AI_PROVIDER.lower()
    if provider_type == "huggingface":
        return HuggingFaceProvider()
    elif provider_type == "ollama":
        return OllamaProvider()
    else:
        logger.warning("Unknown AI_PROVIDER '%s'. Falling back to HuggingFaceProvider.", provider_type)
        return HuggingFaceProvider()
