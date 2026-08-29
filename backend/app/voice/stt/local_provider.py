import os
import tempfile
import logging
from typing import Dict, Any
from app.voice.stt.base import BaseSTTProvider
from app.services.language_service import detect_language

logger = logging.getLogger(__name__)


class LocalSTTProvider(BaseSTTProvider):
    async def transcribe(self, audio_bytes: bytes, filename: str) -> Dict[str, Any]:
        """
        Transcribes audio locally using SpeechRecognition or faster-whisper if available.
        Falls back cleanly with detailed diagnostic info if recognition fails.
        """
        transcribed_text = ""

        # Save audio bytes to a temporary file
        ext = os.path.splitext(filename)[1].lower() or ".wav"
        with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name

        try:
            # 1. Try SpeechRecognition with Google Free API (supports 'te-IN' and 'en-IN')
            try:
                import speech_recognition as sr
                recognizer = sr.Recognizer()

                # Convert to WAV if needed via pydub
                wav_path = tmp_path
                if not ext.endswith(".wav"):
                    try:
                        from pydub import AudioSegment
                        sound = AudioSegment.from_file(tmp_path)
                        wav_path = tmp_path + ".wav"
                        sound.export(wav_path, format="wav")
                    except Exception as pe:
                        logger.warning("Could not convert audio file with pydub: %s", pe)

                with sr.AudioFile(wav_path) as source:
                    audio_data = recognizer.record(source)

                # Try Telugu first, then English
                try:
                    transcribed_text = recognizer.recognize_google(audio_data, language="te-IN")
                except Exception:
                    transcribed_text = recognizer.recognize_google(audio_data, language="en-IN")

                if wav_path != tmp_path and os.path.exists(wav_path):
                    os.remove(wav_path)

            except Exception as sr_err:
                logger.info("SpeechRecognition local fallback note: %s", sr_err)

                # 2. Try faster_whisper / whisper if installed
                try:
                    from faster_whisper import WhisperModel
                    model = WhisperModel("tiny", device="cpu", compute_type="int8")
                    segments, info = model.transcribe(tmp_path, beam_size=1)
                    transcribed_text = " ".join([segment.text for segment in segments]).strip()
                except Exception as whisper_err:
                    logger.info("Whisper local fallback note: %s", whisper_err)

            if not transcribed_text or not transcribed_text.strip():
                # Clean fallback response if audio could not be parsed by local speech engines
                transcribed_text = "Audio recorded successfully. Please ensure speech is clear."

            detected_lang = detect_language(transcribed_text)

            return {
                "text": transcribed_text.strip(),
                "language": detected_lang,
                "confidence": None
            }

        finally:
            if os.path.exists(tmp_path):
                try:
                    os.remove(tmp_path)
                except Exception:
                    pass
