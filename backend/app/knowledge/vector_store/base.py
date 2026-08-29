from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional


class BaseVectorStore(ABC):
    @abstractmethod
    def add_chunks(self, chunks: List[Dict[str, Any]]) -> None:
        """Add text chunks with metadata to store."""
        pass

    @abstractmethod
    def search(self, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Search for top_k relevant chunks matching query."""
        pass

    @abstractmethod
    def clear(self) -> None:
        """Clear all stored vector chunks."""
        pass

    @abstractmethod
    def count(self) -> int:
        """Return total number of chunks stored."""
        pass
