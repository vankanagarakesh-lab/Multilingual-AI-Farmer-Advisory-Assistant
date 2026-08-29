import logging
from typing import List, Dict, Any, Tuple, Optional
from app.core.config import settings
from app.knowledge.vector_store.local_store import LocalVectorStore

logger = logging.getLogger(__name__)


class KnowledgeRetriever:
    def __init__(self, vector_store: LocalVectorStore):
        self.vector_store = vector_store

    def retrieve(
        self,
        query: str,
        target_crop: Optional[str] = None,
        target_category: Optional[str] = None,
        top_k: Optional[int] = None,
        max_chars: Optional[int] = None
    ) -> Tuple[str, List[Dict[str, str]]]:
        """
        Retrieves top relevant chunks for query with metadata filtering.
        Returns:
            - context_text: Concatenated retrieved chunks text (compact, up to max_chars)
            - sources: Unique list of dicts [{'title': ..., 'source': ...}]
        """
        if top_k is None:
            top_k = getattr(settings, "RAG_TOP_K", 2)
        if max_chars is None:
            max_chars = getattr(settings, "RAG_MAX_CONTEXT_CHARS", 800)
        min_score = getattr(settings, "RAG_SCORE_THRESHOLD", 0.50)

        chunks = self.vector_store.search(
            query=query,
            top_k=top_k,
            min_score=min_score,
            target_crop=target_crop,
            target_category=target_category
        )
        if not chunks:
            logger.info("No relevant chunks passed score threshold (min_score=%.2f) for query: '%s'", min_score, query)
            return "", []

        context_parts = []
        sources_map = {}  # Deduplicate sources
        total_chars = 0
        seen_texts = set()

        for chunk in chunks:
            content = chunk.get("content", "").strip()
            meta = chunk.get("metadata", {}) or {}

            if not content:
                continue

            # Normalize text for deduplication
            normalized_snippet = " ".join(content.lower().split()[:20])
            if normalized_snippet in seen_texts:
                continue
            seen_texts.add(normalized_snippet)

            if total_chars + len(content) > max_chars:
                content = content[:(max_chars - total_chars)].strip()

            title = meta.get("title", "Agricultural Guidance")
            source = meta.get("source", "verified_agricultural_doc")

            if content:
                context_parts.append(f"• [{title}]: {content}")
                total_chars += len(content)

            if source not in sources_map:
                sources_map[source] = {
                    "title": title,
                    "source": source
                }

            if total_chars >= max_chars:
                break

        formatted_context = "\n".join(context_parts)
        sources_list = list(sources_map.values())

        return formatted_context, sources_list
