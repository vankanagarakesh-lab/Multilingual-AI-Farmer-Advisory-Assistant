import re
import io
import logging
from typing import Tuple
from app.voice.tts.base import BaseTTSProvider

logger = logging.getLogger(__name__)


def clean_markdown_for_speech(text: str) -> str:
    """Removes Markdown headers, bolding, bullet points, and emojis for clean speech output."""
    if not text:
        return ""
    cleaned = re.sub(r'#+\s*', '', text)  # Remove headings
    cleaned = re.sub(r'\*+|_+', '', cleaned)  # Remove bold/italic
    cleaned = re.sub(r'[-•*]\s*', '', cleaned)  # Remove bullet points
    cleaned = re.sub(r'⚠️|🌾|🎙|🔊|📚|🌱|🔬|📊|🔍|🛠️|🛡️|💧|📍|👋', '', cleaned)  # Remove emojis
    cleaned = re.sub(r'\n+', ' ', cleaned)  # Collapse newlines
    return cleaned.strip()[:1500]  # Limit length for speech performance


class LocalTTSProvider(BaseTTSProvider):
    async def synthesize(self, text: str, language: str = "en") -> Tuple[bytes, str]:
        """
        Synthesizes text to speech audio in Telugu ('te'), Hindi ('hi'), or English ('en').
        """
        speech_text = clean_markdown_for_speech(text)
        if not speech_text:
            speech_text = "No text provided for audio synthesis."

        clean_lang = (language or "en").lower().strip()
        if "te" in clean_lang or "telugu" in clean_lang:
            lang_code = "te"
        elif "hi" in clean_lang or "hindi" in clean_lang:
            lang_code = "hi"
        else:
            lang_code = "en"

        # 1. Try gTTS (Google Text-to-Speech)
        try:
            from gtts import gTTS
            tts = gTTS(text=speech_text, lang=lang_code, slow=False)
            fp = io.BytesIO()
            tts.write_to_fp(fp)
            fp.seek(0)
            return fp.read(), "audio/mpeg"
        except Exception as gtts_err:
            logger.warning("gTTS synthesis failed, attempting local fallback: %s", gtts_err)

        # 2. Try pyttsx3 or edge-tts fallback
        try:
            import pyttsx3
            engine = pyttsx3.init()
            fp = io.BytesIO()
            engine.save_to_file(speech_text, "temp_tts.wav")
            engine.runAndWait()
            import os
            if os.path.exists("temp_tts.wav"):
                with open("temp_tts.wav", "rb") as f:
                    audio_data = f.read()
                os.remove("temp_tts.wav")
                return audio_data, "audio/wav"
        except Exception as pyttsx_err:
            logger.warning("pyttsx3 synthesis fallback failed: %s", pyttsx_err)

        # 3. Create minimal valid silent/beep WAV audio if all engines are offline
        # Standard 44.1kHz 16-bit mono WAV header for fallback compatibility
        wav_header = (
            b'RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00'
            b'\x44\xac\x00\x00\x88\x58\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00'
        )
        return wav_header, "audio/wav"
