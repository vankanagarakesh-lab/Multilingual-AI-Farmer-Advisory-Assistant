import logging
import sqlite3
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.core.config import settings
from app.database.session import engine, SessionLocal
from app.database.base import Base
import app.models  # Ensures all SQLAlchemy models are registered
from app.api import (
    auth_router, farmers_router, conversations_router,
    chat_router, voice_router, knowledge_router, simulator_router,
    translate_router
)
from app.knowledge.retrieval.knowledge_service import initialize_knowledge_base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("krishi_ai")


def run_db_migrations():
    """Migrates existing SQLite database schema to add Phase 2 columns if missing."""
    db_path = settings.DATABASE_URL.replace("sqlite:///", "")
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        # Check users table
        user_cols = [c[1] for c in cursor.execute("PRAGMA table_info(users)").fetchall()]
        if "uuid" not in user_cols:
            cursor.execute("ALTER TABLE users ADD COLUMN uuid VARCHAR(64)")

        # Check farmer_profiles table
        farmer_cols = [c[1] for c in cursor.execute("PRAGMA table_info(farmer_profiles)").fetchall()]
        if "age" not in farmer_cols:
            cursor.execute("ALTER TABLE farmer_profiles ADD COLUMN age INTEGER")
        if "voice_response_enabled" not in farmer_cols:
            cursor.execute("ALTER TABLE farmer_profiles ADD COLUMN voice_response_enabled BOOLEAN DEFAULT 0")

        # Check messages table
        msg_cols = [c[1] for c in cursor.execute("PRAGMA table_info(messages)").fetchall()]
        if "language" not in msg_cols:
            cursor.execute("ALTER TABLE messages ADD COLUMN language VARCHAR(20)")
        if "image_url" not in msg_cols:
            cursor.execute("ALTER TABLE messages ADD COLUMN image_url TEXT")
        if "sources_json" not in msg_cols:
            cursor.execute("ALTER TABLE messages ADD COLUMN sources_json TEXT")

        conn.commit()
        conn.close()
        logger.info("Database schema migration verified successfully.")
    except Exception as e:
        logger.warning("Database migration note: %s", e)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Create tables if missing
    logger.info("Initializing KRISHI AI database tables...")
    Base.metadata.create_all(bind=engine)
    run_db_migrations()
    logger.info("Database tables initialized successfully.")

    # Initialize Knowledge Base (Vector Store)
    try:
        db = SessionLocal()
        initialize_knowledge_base(db)
        db.close()
    except Exception as e:
        logger.error("Failed to initialize knowledge base on startup: %s", e)

    # Pre-load Plant Disease AI Vision Model on startup
    try:
        logger.info("Pre-loading Plant Disease AI Vision Model on startup...")
        from app.services.disease_service import get_disease_detector
        detector = get_disease_detector()
        detector.load_model()
        logger.info("Plant Disease AI Vision Model initialized.")
    except Exception as e:
        logger.warning("Plant Disease Vision Model startup note: %s", e)

    # Pre-initialize Hugging Face model if active provider
    if settings.AI_PROVIDER.lower() == "huggingface":
        try:
            logger.info("Pre-loading Hugging Face model & LoRA adapter on startup...")
            from app.ai.model_manager import HFModelManager
            manager = HFModelManager.get_instance()
            manager.load_model()
        except Exception as e:
            logger.error("Failed to pre-load Hugging Face model on startup: %s", e)

    yield
    # Shutdown logic if any
    logger.info("Shutting down KRISHI AI backend server.")


app = FastAPI(
    title=settings.APP_NAME,
    description="Multilingual Agricultural Intelligence Assistant API",
    version="2.0.0",
    lifespan=lifespan
)

# Configure CORS Middleware
origins = [
    settings.FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    "http://localhost:5175",
    "http://127.0.0.1:5175",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1|192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth_router)
app.include_router(farmers_router)
app.include_router(conversations_router)
app.include_router(chat_router)
app.include_router(voice_router)
app.include_router(knowledge_router)
app.include_router(simulator_router)
app.include_router(translate_router)


@app.get("/api/health", tags=["Health"])
def health_check():
    health_info = {
        "status": "online",
        "app": settings.APP_NAME,
        "ai_provider": settings.AI_PROVIDER,
    }
    if settings.AI_PROVIDER.lower() == "huggingface":
        from app.ai.model_manager import HFModelManager
        mgr = HFModelManager.get_instance()
        health_info.update({
            "hf_base_model": settings.HF_BASE_MODEL,
            "adapter_path": settings.KRISHI_ADAPTER_PATH,
            "use_lora": getattr(settings, "USE_LORA", True),
            "has_adapter": mgr.has_adapter,
            "is_loaded": mgr.is_loaded,
            "device": mgr.device
        })
    elif settings.AI_PROVIDER.lower() == "ollama":
        health_info.update({
            "ollama_model": settings.OLLAMA_MODEL,
            "ollama_url": settings.OLLAMA_BASE_URL
        })
    return health_info

