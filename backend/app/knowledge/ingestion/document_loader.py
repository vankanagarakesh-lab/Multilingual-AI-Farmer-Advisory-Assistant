import os
import json
import logging
from typing import List, Dict, Any

logger = logging.getLogger(__name__)


def load_documents_from_directory(base_dir: str) -> List[Dict[str, Any]]:
    """
    Recursively load text, markdown, and JSON files from base_dir.
    Infers category from folder name, crop/language from filename/metadata.
    """
    documents = []
    if not os.path.exists(base_dir):
        logger.warning("Document base directory does not exist: %s", base_dir)
        return documents

    for root, _, files in os.walk(base_dir):
        category = os.path.basename(root)
        for filename in files:
            filepath = os.path.join(root, filename)
            ext = os.path.splitext(filename)[1].lower()

            if ext not in [".txt", ".md", ".json"]:
                continue

            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    content = f.read()

                if not content.strip():
                    continue

                title = os.path.splitext(filename)[0].replace("_", " ").title()
                crop = "general"
                language = "en"

                # Infer crop name if filename contains known crops
                lower_fn = filename.lower()
                for known_crop in ["tomato", "rice", "maize", "groundnut", "cotton", "chilli"]:
                    if known_crop in lower_fn:
                        crop = known_crop
                        break

                if "telugu" in lower_fn or "te" in lower_fn:
                    language = "te"

                # If JSON format with structured metadata
                if ext == ".json":
                    try:
                        data = json.loads(content)
                        title = data.get("title", title)
                        source = data.get("source", filename)
                        category = data.get("category", category)
                        crop = data.get("crop", crop)
                        language = data.get("language", language)
                        body = data.get("content", content)
                    except Exception:
                        body = content
                        source = filename
                else:
                    source = filename
                    body = content

                documents.append({
                    "title": title,
                    "source": source,
                    "category": category,
                    "crop": crop,
                    "language": language,
                    "content": body,
                    "filepath": filepath
                })
            except Exception as e:
                logger.error("Failed to load document %s: %s", filepath, e)

    return documents
