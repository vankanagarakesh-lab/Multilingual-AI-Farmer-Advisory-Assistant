import httpx
import logging
from typing import List, Dict, Any, Optional
from app.ai.base import AIBaseProvider
from app.core.config import settings
from app.utils.errors import AIServiceException

logger = logging.getLogger(__name__)


class OllamaProvider(AIBaseProvider):
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL.rstrip('/')
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT

    async def generate_response(
        self,
        messages: List[Dict[str, str]],
        system_prompt: str,
        max_new_tokens: Optional[int] = None
    ) -> str:
        url = f"{self.base_url}/api/chat"

        payload_messages = [{"role": "system", "content": system_prompt}]
        for msg in messages:
            payload_messages.append({"role": msg["role"], "content": msg["content"]})

        tokens_limit = max_new_tokens or settings.MAX_NEW_TOKENS

        payload = {
            "model": self.model,
            "messages": payload_messages,
            "stream": False,
            "options": {
                "num_predict": tokens_limit,
                "temperature": settings.TEMPERATURE,
                "top_p": settings.TOP_P,
                "repeat_penalty": settings.REPETITION_PENALTY,
                "num_ctx": 2048,
            }
        }

        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(url, json=payload)
                
                if response.status_code == 404:
                    raise AIServiceException(
                        detail=f"Configured Ollama model '{self.model}' was not found. Please run 'ollama pull {self.model}'."
                    )
                
                response.raise_for_status()
                data = response.json()

                if "message" in data and "content" in data["message"]:
                    content = data["message"]["content"].strip()
                    if not content:
                        raise AIServiceException(detail="Ollama returned an empty response.")
                    return content
                else:
                    raise AIServiceException(detail="Received invalid response format from Ollama service.")

        except httpx.ConnectError:
            logger.error("Could not connect to Ollama at %s", self.base_url)
            raise AIServiceException(
                detail=f"Unable to connect to local AI service at {self.base_url}. Please ensure Ollama is running."
            )
        except httpx.TimeoutException:
            logger.error("Ollama request timed out after %s seconds", self.timeout)
            raise AIServiceException(
                detail=f"AI response timed out after {int(self.timeout)} seconds. Please click Retry."
            )
        except httpx.HTTPStatusError as e:
            logger.error("Ollama HTTP status error: %s", e)
            raise AIServiceException(
                detail=f"Ollama server returned error code {e.response.status_code}."
            )
        except AIServiceException:
            raise
        except Exception as e:
            logger.error("Unexpected error communicating with Ollama: %s", e)
            raise AIServiceException(
                detail="An unexpected error occurred while communicating with KRISHI AI assistant."
            )
