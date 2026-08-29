from typing import List, Dict, Any


def chunk_document(
    doc: Dict[str, Any],
    chunk_size: int = 500,
    chunk_overlap: int = 100
) -> List[Dict[str, Any]]:
    """
    Chunks document content into manageable pieces with overlap.
    Preserves document metadata on every chunk.
    """
    content = doc.get("content", "")
    if not content:
        return []

    words = content.split()
    if not words:
        return []

    chunks = []
    start = 0
    chunk_index = 0

    while start < len(words):
        end = min(start + chunk_size, len(words))
        chunk_words = words[start:end]
        chunk_text = " ".join(chunk_words)

        chunks.append({
            "chunk_index": chunk_index,
            "content": chunk_text,
            "metadata": {
                "source": doc.get("source"),
                "title": doc.get("title"),
                "category": doc.get("category"),
                "crop": doc.get("crop"),
                "language": doc.get("language")
            }
        })

        chunk_index += 1
        if end == len(words):
            break
        start += (chunk_size - chunk_overlap)

    return chunks
