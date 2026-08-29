import math
import re
from typing import List, Dict, Any, Optional
from app.knowledge.vector_store.base import BaseVectorStore

# Common stopwords in English, Telugu, and Hindi to ignore during TF-IDF calculations
STOPWORDS = {
    # English
    "the", "is", "at", "which", "on", "a", "an", "and", "or", "in", "for", "to",
    "of", "with", "as", "by", "from", "my", "your", "our", "are", "was", "were",
    "how", "what", "why", "when", "where", "can", "do", "does", "did", "tell",
    "me", "please", "about", "give", "solution", "problem", "help", "i", "you",
    "turning", "getting", "having", "some", "any", "all", "so", "it", "this", "that",

    # Telugu
    "మరియు", "లేదా", "యొక్క", "లో", "పై", "నా", "మీ", "మా", "ఉంది", "ఉన్నాయి",
    "ఎలా", "ఏమిటి", "ఎందుకు", "ఎక్కడ", "గురించి", "చెప్పండి", "సహాయం", "చేయండి",

    # Hindi
    "और", "या", "का", "की", "के", "में", "पर", "मेरा", "मेरी", "मेरे", "आपका",
    "है", "हैं", "था", "थी", "थे", "कैसे", "क्या", "क्यों", "कहाँ", "के बारे में",
    "बताएं", "मदद", "करें"
}


def tokenize(text: str) -> List[str]:
    """Tokenize text into lowercase terms, stripping punctuation across Unicode scripts."""
    words = [w.lower() for w in re.findall(r'\w+', text)]
    return [w for w in words if w and w not in STOPWORDS and len(w) > 1]


class LocalVectorStore(BaseVectorStore):
    """
    Metadata-aware, high-precision local vector store.
    Features:
    - Stopword-filtered TF-IDF term scoring.
    - Strict crop-isolation (prevents cross-crop contamination like Rice retrieved for Tomato).
    - Category affinity weighting.
    - Confidence thresholding.
    """

    def __init__(self):
        self.chunks: List[Dict[str, Any]] = []

    def add_chunks(self, chunks: List[Dict[str, Any]]) -> None:
        for chunk in chunks:
            self.chunks.append(chunk)

    def search(
        self,
        query: str,
        top_k: int = 3,
        min_score: float = 0.45,
        target_crop: Optional[str] = None,
        target_category: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        if not self.chunks or not query.strip():
            return []

        query_tokens = tokenize(query)
        if not query_tokens:
            return []

        query_token_set = set(query_tokens)
        results = []
        seen_contents = set()

        for chunk in self.chunks:
            content = chunk.get("content", "")
            content_tokens = tokenize(content)
            if not content_tokens:
                continue

            content_key = content.strip().lower()
            if content_key in seen_contents:
                continue

            meta = chunk.get("metadata", {}) or {}
            chunk_crop = (meta.get("crop") or "").lower().strip()
            chunk_category = (meta.get("category") or "").lower().strip()

            # Strict Crop Isolation Check:
            # If the chunk is specific to a named crop (e.g. rice, tomato), only return it if that crop is explicitly targeted or in query
            if chunk_crop and chunk_crop != "general":
                if target_crop and chunk_crop != target_crop.lower():
                    continue
                if not target_crop and chunk_crop not in query.lower():
                    continue

            # Calculate TF-IDF term overlap
            content_token_counts = {}
            for token in content_tokens:
                content_token_counts[token] = content_token_counts.get(token, 0) + 1

            matched_terms = 0
            score = 0.0
            for token in query_token_set:
                if token in content_token_counts:
                    tf = content_token_counts[token]
                    score += (1.0 + math.log(tf))
                    matched_terms += 1

            if matched_terms == 0:
                continue

            # Crop match boost
            if target_crop and chunk_crop == target_crop.lower():
                score += 2.0
            elif target_crop and target_crop.lower() in content.lower():
                score += 1.5

            # Category match boost
            if target_category and chunk_category == target_category.lower():
                score += 1.0

            # Normalize by log length of content to ensure fairness
            norm_score = score / (1.0 + math.log(len(content_tokens)))

            # Minimum relevance threshold
            if norm_score >= min_score and matched_terms >= 1:
                seen_contents.add(content_key)
                chunk_copy = dict(chunk)
                chunk_copy["_score"] = norm_score
                results.append((norm_score, chunk_copy))

        # Sort by relevance score descending
        results.sort(key=lambda x: x[0], reverse=True)

        return [item[1] for item in results[:top_k]]

    def clear(self) -> None:
        self.chunks.clear()

    def count(self) -> int:
        return len(self.chunks)
