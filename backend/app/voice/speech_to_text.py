from typing import Dict, Any
from app.voice.stt import get_stt_provider


async def transcribe_audio(audio_bytes: bytes, filename: str) -> Dict[str, Any]:
    stt_provider = get_stt_provider()
    return await stt_provider.transcribe(audio_bytes, filename)
