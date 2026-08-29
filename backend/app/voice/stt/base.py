from abc import ABC, abstractmethod
from typing import Dict, Any


class BaseSTTProvider(ABC):
    @abstractmethod
    async def transcribe(self, audio_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Transcribe audio bytes to text.
        Must return dict:
        {
            "text": str,
            "language": str,  # 'te', 'en', or 'mixed'
            "confidence": Optional[float]
        }
        """
        pass
