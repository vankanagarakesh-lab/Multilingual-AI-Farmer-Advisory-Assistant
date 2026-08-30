import asyncio
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from app.services.language_service import (
    localize_ai_response,
    translate_batch_online,
    normalize_language_code
)

router = APIRouter(prefix="/api/translate", tags=["Multilingual Translation"])


class SingleTranslateRequest(BaseModel):
    text: str
    target_language: str


class BatchTranslateRequest(BaseModel):
    texts: List[str]
    target_language: str


class SingleTranslateResponse(BaseModel):
    translated_text: str
    target_language: str


class BatchTranslateResponse(BaseModel):
    translations: List[str]
    target_language: str


@router.post("/single", response_model=SingleTranslateResponse)
async def translate_single_endpoint(payload: SingleTranslateRequest):
    """
    Translates a single text into the target language.
    """
    translated = localize_ai_response(payload.text, payload.target_language)
    return SingleTranslateResponse(
        translated_text=translated,
        target_language=normalize_language_code(payload.target_language)
    )


@router.post("/batch", response_model=BatchTranslateResponse)
async def translate_batch_endpoint(payload: BatchTranslateRequest):
    """
    Translates multiple messages or UI strings into the target language in parallel.
    """
    translations = await translate_batch_online(payload.texts, payload.target_language)
    return BatchTranslateResponse(
        translations=translations,
        target_language=normalize_language_code(payload.target_language)
    )
