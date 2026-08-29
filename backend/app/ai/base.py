from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class AIBaseProvider(ABC):
    @abstractmethod
    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        max_new_tokens: Optional[int] = None
    ) -> str:
        """Generate a response from the AI model asynchronously."""
        pass
