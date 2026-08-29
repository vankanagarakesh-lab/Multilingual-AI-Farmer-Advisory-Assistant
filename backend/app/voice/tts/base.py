from abc import ABC, abstractmethod
from typing import Tuple


class BaseTTSProvider(ABC):
    @abstractmethod
    async def synthesize(self, text: str, language: str = "en") -> Tuple[bytes, str]:
        """
        Synthesizes text to speech audio.
        Returns:
            - audio_bytes: Raw audio byte stream
            - media_type: e.g. 'audio/mpeg' or 'audio/wav'
        """
        pass
