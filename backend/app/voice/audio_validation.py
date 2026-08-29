import logging
from fastapi import UploadFile, HTTPException, status
from app.voice.voice_config import voice_settings

logger = logging.getLogger(__name__)

ALLOWED_MIME_TYPES = [
    "audio/wav", "audio/x-wav", "audio/mp3", "audio/mpeg",
    "audio/webm", "audio/ogg", "audio/m4a", "audio/mp4",
    "audio/x-m4a", "application/octet-stream"
]

ALLOWED_EXTENSIONS = [".wav", ".mp3", ".webm", ".ogg", ".m4a", ".mp4"]


def validate_audio_file(file: UploadFile, file_bytes: bytes) -> None:
    """
    Validates audio file existence, size, mime-type/extension.
    Raises HTTPException(400) with detailed error if invalid.
    """
    if not file or not file_bytes:
        logger.warning("Audio validation failed: File is missing or empty.")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio file is empty or invalid."
        )

    file_size_mb = len(file_bytes) / (1024 * 1024)
    if file_size_mb > voice_settings.MAX_AUDIO_FILE_SIZE_MB:
        logger.warning("Audio validation failed: File size %.2f MB exceeds limit of %d MB",
                       file_size_mb, voice_settings.MAX_AUDIO_FILE_SIZE_MB)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Audio file size exceeds maximum limit of {voice_settings.MAX_AUDIO_FILE_SIZE_MB}MB."
        )

    # Check extension
    filename = (file.filename or "").lower()
    has_valid_ext = any(filename.endswith(ext) for ext in ALLOWED_EXTENSIONS)
    
    # Check mime type
    content_type = (file.content_type or "").lower()
    has_valid_mime = content_type in ALLOWED_MIME_TYPES or content_type.startswith("audio/")

    if not (has_valid_ext or has_valid_mime):
        logger.warning("Audio validation failed: Unsupported format filename='%s', content_type='%s'",
                       file.filename, file.content_type)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Audio file format is not supported. Please upload a valid WAV, WebM, MP3, or M4A audio file."
        )
