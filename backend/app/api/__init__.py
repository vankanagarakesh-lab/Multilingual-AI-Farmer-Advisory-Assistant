from app.api.auth import router as auth_router
from app.api.farmers import router as farmers_router
from app.api.conversations import router as conversations_router
from app.api.chat import router as chat_router
from app.api.voice import router as voice_router
from app.api.knowledge import router as knowledge_router
from app.api.simulator import router as simulator_router

__all__ = [
    "auth_router", "farmers_router", "conversations_router",
    "chat_router", "voice_router", "knowledge_router", "simulator_router"
]
