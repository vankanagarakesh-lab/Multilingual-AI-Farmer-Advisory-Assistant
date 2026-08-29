import json
from datetime import datetime
from pydantic import BaseModel, ConfigDict, field_validator
from typing import List, Optional, Dict, Any


class SourceItem(BaseModel):
    title: str
    source: str


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    role: str
    content: str
    language: Optional[str] = "en"
    image_url: Optional[str] = None
    sources: Optional[List[SourceItem]] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

    @field_validator("sources", mode="before")
    @classmethod
    def parse_sources(cls, v):
        if isinstance(v, list):
            return v
        if isinstance(v, str) and v.strip():
            try:
                parsed = json.loads(v)
                if isinstance(parsed, list):
                    return parsed
            except Exception:
                return None
        return None


class ConversationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageResponse] = []

    model_config = ConfigDict(from_attributes=True)


class ConversationCreate(BaseModel):
    title: Optional[str] = "New Conversation"
