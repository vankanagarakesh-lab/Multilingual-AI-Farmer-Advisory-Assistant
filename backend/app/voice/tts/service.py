from app.voice.tts.base import BaseTTSProvider
from app.voice.tts.local_provider import LocalTTSProvider
from app.voice.voice_config import voice_settings


def get_tts_provider() -> BaseTTSProvider:
    provider_name = voice_settings.TTS_PROVIDER.lower()
    if provider_name == "local":
        return LocalTTSProvider()
    return LocalTTSProvider()
