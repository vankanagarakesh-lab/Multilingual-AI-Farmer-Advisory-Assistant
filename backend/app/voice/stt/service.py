from app.voice.stt.base import BaseSTTProvider
from app.voice.stt.local_provider import LocalSTTProvider
from app.voice.voice_config import voice_settings


def get_stt_provider() -> BaseSTTProvider:
    provider_name = voice_settings.STT_PROVIDER.lower()
    if provider_name == "local":
        return LocalSTTProvider()
    return LocalSTTProvider()
