from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.chat import (
    ChatMessageRequest, 
    ChatMessageResponse,
    DiseaseDetectionRequest,
    DiseaseDetectionResponse
)
from app.services.auth_service import get_current_user
from app.services.chat_service import process_chat_message
from app.services.disease_service import get_disease_detector
from app.services.farmer_service import get_farmer_profile
from app.models.user import User

router = APIRouter(prefix="/api/chat", tags=["AI Chat"])


@router.post("/message", response_model=ChatMessageResponse)
async def send_chat_message(
    payload: ChatMessageRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return await process_chat_message(
        db=db,
        user_id=current_user.id,
        message_content=payload.message,
        conversation_id=payload.conversation_id,
        response_language=payload.response_language,
        image_data=payload.image_data
    )


@router.post("/detect-disease", response_model=DiseaseDetectionResponse)
async def detect_disease_endpoint(
    payload: DiseaseDetectionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Direct endpoint to analyze an uploaded plant leaf photo using the deep learning vision model.
    """
    profile = get_farmer_profile(db, current_user.id)
    detector = get_disease_detector()
    result = await detector.analyze_leaf_image(
        image_data=payload.image_data,
        target_language=payload.language or profile.preferred_language or "en",
        farmer_crop=profile.primary_crop
    )
    return DiseaseDetectionResponse(**result)
