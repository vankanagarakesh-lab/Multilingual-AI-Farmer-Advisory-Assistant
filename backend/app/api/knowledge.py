from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.services.auth_service import get_current_user
from app.models.user import User
from app.knowledge.retrieval.knowledge_service import get_knowledge_status, get_vector_store
from app.knowledge.ingestion.ingestion_service import ingest_knowledge_documents

router = APIRouter(prefix="/api/knowledge", tags=["Agricultural Knowledge Base"])


@router.post("/ingest")
def ingest_knowledge_endpoint(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Ingests agricultural knowledge documents into DB and VectorStore.
    Protected admin/dev endpoint requiring authentication.
    """
    vector_store = get_vector_store()
    res = ingest_knowledge_documents(db, vector_store)
    return res


@router.get("/status")
def knowledge_status_endpoint(
    db: Session = Depends(get_db)
):
    """
    Returns current knowledge base status.
    """
    return get_knowledge_status(db)
