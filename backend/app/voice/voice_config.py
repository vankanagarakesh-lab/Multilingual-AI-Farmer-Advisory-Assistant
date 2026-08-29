import os


class VoiceSettings:
    STT_PROVIDER: str = os.getenv("STT_PROVIDER", "local")
    TTS_PROVIDER: str = os.getenv("TTS_PROVIDER", "local")

    MAX_AUDIO_FILE_SIZE_MB: int = int(os.getenv("MAX_AUDIO_FILE_SIZE_MB", "25"))
    MAX_AUDIO_DURATION_SECONDS: int = int(os.getenv("MAX_AUDIO_DURATION_SECONDS", "120"))


voice_settings = VoiceSettings()
