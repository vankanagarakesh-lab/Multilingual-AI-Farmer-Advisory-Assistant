from typing import Tuple
from app.voice.tts import get_tts_provider


async def synthesize_speech(text: str, language: str = "en") -> Tuple[bytes, str]:
    tts_provider = get_tts_provider()
    return await tts_provider.synthesize(text, language)
