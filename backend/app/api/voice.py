from fastapi import APIRouter, Depends, File, UploadFile, Response
from pydantic import BaseModel
from typing import Optional

from app.services.auth_service import get_current_user
from app.models.user import User
from app.voice.voice_service import process_voice_transcription, process_voice_synthesis

router = APIRouter(prefix="/api/voice", tags=["Voice Intelligence"])


class SynthesizeRequest(BaseModel):
    text: str
    language: Optional[str] = "en"


@router.post("/transcribe")
async def transcribe_audio_endpoint(
    file: UploadFile = File(...)
):
    """
    Transcribes audio file to text and detects language.
    """
    return await process_voice_transcription(file)


@router.post("/synthesize")
async def synthesize_speech_endpoint(
    payload: SynthesizeRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Synthesizes text to speech audio. Requires authentication.
    """
    audio_bytes, media_type = await process_voice_synthesis(payload.text, payload.language)
    return Response(content=audio_bytes, media_type=media_type)
