from typing import Dict, Any, Tuple
from fastapi import UploadFile
from app.voice.audio_validation import validate_audio_file
from app.voice.speech_to_text import transcribe_audio
from app.voice.text_to_speech import synthesize_speech


async def process_voice_transcription(file: UploadFile) -> Dict[str, Any]:
    audio_bytes = await file.read()
    validate_audio_file(file, audio_bytes)
    filename = file.filename or "recording.wav"
    return await transcribe_audio(audio_bytes, filename)


async def process_voice_synthesis(text: str, language: str = "en") -> Tuple[bytes, str]:
    return await synthesize_speech(text, language)
