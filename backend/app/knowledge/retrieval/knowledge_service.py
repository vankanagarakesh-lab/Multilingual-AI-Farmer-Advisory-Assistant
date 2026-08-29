import logging
from typing import Tuple, List, Dict, Any, Optional
from sqlalchemy.orm import Session

from app.models.knowledge import KnowledgeDocument, KnowledgeChunk
from app.knowledge.vector_store.local_store import LocalVectorStore
from app.knowledge.retrieval.retriever import KnowledgeRetriever
from app.knowledge.ingestion.ingestion_service import ingest_knowledge_documents

logger = logging.getLogger(__name__)

# Global singleton vector store instance
_vector_store_instance = LocalVectorStore()
_retriever_instance = KnowledgeRetriever(_vector_store_instance)


def get_vector_store() -> LocalVectorStore:
    return _vector_store_instance


def get_retriever() -> KnowledgeRetriever:
    return _retriever_instance


def initialize_knowledge_base(db: Session) -> None:
    """
    On startup, synchronizes and ingests verified knowledge documents into DB and VectorStore.
    """
    try:
        res = ingest_knowledge_documents(db, _vector_store_instance)
        logger.info("Knowledge base initialized: %s", res.get("message"))
    except Exception as e:
        logger.warning("Knowledge base automatic ingestion note: %s. Falling back to DB chunk loading.", e)
        chunks = db.query(KnowledgeChunk).all()
        if chunks:
            chunk_data = []
            for c in chunks:
                chunk_data.append({
                    "id": c.id,
                    "content": c.content,
                    "metadata": c.chunk_metadata or {}
                })
            _vector_store_instance.clear()
            _vector_store_instance.add_chunks(chunk_data)
            logger.info("Loaded %d knowledge chunks from database into vector store.", len(chunks))


def get_knowledge_status(db: Session) -> Dict[str, Any]:
    doc_count = db.query(KnowledgeDocument).count()
    chunk_count = db.query(KnowledgeChunk).count()
    return {
        "document_count": doc_count,
        "chunk_count": chunk_count
    }


def retrieve_agricultural_context(
    query: str,
    target_crop: Optional[str] = None,
    target_category: Optional[str] = None
) -> Tuple[str, List[Dict[str, str]]]:
    """Helper function to fetch RAG context and sources for a farmer question with crop/category filters."""
    return _retriever_instance.retrieve(
        query=query,
        target_crop=target_crop,
        target_category=target_category
    )
