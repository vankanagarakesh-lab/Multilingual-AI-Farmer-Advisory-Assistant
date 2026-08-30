import logging
from typing import List, Dict, Any, Optional
from app.ai.base import AIBaseProvider
from app.ai.model_manager import HFModelManager

logger = logging.getLogger(__name__)


class HuggingFaceProvider(AIBaseProvider):
    def __init__(self):
        self.manager = HFModelManager.get_instance()

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        max_new_tokens: Optional[int] = None
    ) -> str:
        return await self.manager.generate_response(messages, system_prompt, max_new_tokens)

    async def generate_response_stream(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        max_new_tokens: Optional[int] = None
    ):
        async for chunk in self.manager.generate_response_stream(messages, system_prompt, max_new_tokens):
            yield chunk
