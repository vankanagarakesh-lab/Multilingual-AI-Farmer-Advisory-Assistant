import json
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.session import get_db
from app.schemas.conversation import ConversationResponse, ConversationDetailResponse, MessageResponse, SourceItem, ConversationCreate
from app.services.auth_service import get_current_user
from app.models.user import User
from app.models.conversation import Conversation

router = APIRouter(prefix="/api/conversations", tags=["Conversations"])


@router.get("", response_model=List[ConversationResponse])
def get_user_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversations = db.query(Conversation).filter(
        Conversation.user_id == current_user.id
    ).order_by(Conversation.updated_at.desc()).all()
    return conversations


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
def create_conversation(
    conv_in: ConversationCreate = ConversationCreate(),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = Conversation(
        user_id=current_user.id,
        title=conv_in.title or "New Conversation"
    )
    db.add(conversation)
    db.commit()
    db.refresh(conversation)
    return conversation


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation_detail(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found."
        )

    # Convert stored Message ORM items to MessageResponse with parsed sources
    messages_resp = []
    for msg in conversation.messages:
        sources_list = None
        if msg.sources_json:
            try:
                raw_sources = json.loads(msg.sources_json)
                if isinstance(raw_sources, list):
                    sources_list = [
                        SourceItem(title=s.get("title", "Reference"), source=s.get("source", "verified_doc"))
                        for s in raw_sources if isinstance(s, dict)
                    ]
            except Exception:
                sources_list = None

        messages_resp.append(MessageResponse(
            id=msg.id,
            conversation_id=msg.conversation_id,
            role=msg.role,
            content=msg.content,
            language=msg.language or "en",
            sources=sources_list,
            created_at=msg.created_at
        ))

    return ConversationDetailResponse(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=messages_resp
    )


@router.delete("/{conversation_id}", status_code=status.HTTP_200_OK)
def delete_conversation(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    conversation = db.query(Conversation).filter(
        Conversation.id == conversation_id,
        Conversation.user_id == current_user.id
    ).first()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found."
        )

    db.delete(conversation)
    db.commit()
    return {"success": True, "message": "Conversation deleted successfully", "id": conversation_id}

