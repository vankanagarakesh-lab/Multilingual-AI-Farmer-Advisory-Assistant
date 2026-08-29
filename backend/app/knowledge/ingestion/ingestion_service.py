import os
import json
import logging
from typing import Dict, Any
from sqlalchemy.orm import Session

from app.models.knowledge import KnowledgeDocument, KnowledgeChunk
from app.knowledge.ingestion.document_loader import load_documents_from_directory
from app.knowledge.ingestion.chunking import chunk_document
from app.knowledge.vector_store.local_store import LocalVectorStore

logger = logging.getLogger(__name__)


def get_documents_base_dir() -> str:
    current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    return os.path.join(current_dir, "documents")


def ingest_knowledge_documents(
    db: Session,
    vector_store: LocalVectorStore,
    documents_dir: str = None
) -> Dict[str, Any]:
    """
    Ingests all agricultural documents into DB and VectorStore.
    """
    if documents_dir is None:
        documents_dir = get_documents_base_dir()

    logger.info("Ingesting agricultural documents from %s", documents_dir)
    docs = load_documents_from_directory(documents_dir)

    if not docs:
        logger.info("No documents found for ingestion in %s", documents_dir)
        return {"document_count": 0, "chunk_count": 0, "message": "No documents found."}

    # Clear existing documents and chunks in DB and vector store
    db.query(KnowledgeChunk).delete()
    db.query(KnowledgeDocument).delete()
    db.commit()

    vector_store.clear()

    total_docs = 0
    total_chunks = 0
    all_chunks_for_store = []

    for doc in docs:
        db_doc = KnowledgeDocument(
            title=doc["title"],
            source=doc["source"],
            category=doc["category"],
            crop=doc["crop"],
            language=doc["language"]
        )
        db.add(db_doc)
        db.commit()
        db.refresh(db_doc)
        total_docs += 1

        chunks = chunk_document(doc)
        for c in chunks:
            chunk_meta = c["metadata"]
            chunk_meta["document_id"] = db_doc.id

            db_chunk = KnowledgeChunk(
                document_id=db_doc.id,
                content=c["content"],
                chunk_metadata=chunk_meta
            )
            db.add(db_chunk)
            db.commit()
            db.refresh(db_chunk)

            all_chunks_for_store.append({
                "id": db_chunk.id,
                "content": c["content"],
                "metadata": chunk_meta
            })
            total_chunks += 1

    # Load into vector store
    vector_store.add_chunks(all_chunks_for_store)

    logger.info("Successfully ingested %d documents and %d chunks.", total_docs, total_chunks)
    return {
        "document_count": total_docs,
        "chunk_count": total_chunks,
        "message": f"Successfully ingested {total_docs} documents and {total_chunks} chunks."
    }
