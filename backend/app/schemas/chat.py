from pydantic import BaseModel
from typing import Optional
from app.schemas.conversation import MessageResponse


class ChatMessageRequest(BaseModel):
    message: str
    conversation_id: Optional[int] = None
    response_language: Optional[str] = None  # 'en', 'te', 'hi', etc.
    image_data: Optional[str] = None  # Base64 data URL


class ChatMessageResponse(BaseModel):
    conversation_id: int
    user_message: MessageResponse
    ai_message: MessageResponse


class DiseaseDetectionRequest(BaseModel):
    image_data: str
    language: Optional[str] = "en"
    conversation_id: Optional[int] = None


class DiseaseDetectionResponse(BaseModel):
    success: bool
    plant_name: Optional[str] = None
    disease_name: Optional[str] = None
    confidence: Optional[float] = None
    is_healthy: Optional[bool] = None
    is_plant: Optional[bool] = None
    causes: Optional[list] = None
    treatment: Optional[list] = None
    prevention: Optional[list] = None
    formatted_response: str
