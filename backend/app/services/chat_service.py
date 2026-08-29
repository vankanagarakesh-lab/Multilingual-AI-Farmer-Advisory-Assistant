import time
import json
import logging
from typing import Optional, List, Dict
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.user import User
from app.models.conversation import Conversation
from app.models.message import Message
from app.services.farmer_service import get_farmer_profile
from app.services.language_service import (
    detect_language,
    determine_response_language,
    localize_ai_response
)
from app.services.disease_service import get_disease_detector
from app.knowledge.retrieval.knowledge_service import retrieve_agricultural_context
from app.ai import get_ai_provider, build_system_prompt, classify_query
from app.core.config import settings
from app.schemas.chat import ChatMessageResponse
from app.schemas.conversation import MessageResponse, SourceItem

logger = logging.getLogger(__name__)


def generate_deterministic_title(user_message: str) -> str:
    """Generate a clean, deterministic title from the first user message without making an AI API call."""
    cleaned = user_message.strip()
    if not cleaned:
        return "Agricultural Guidance"
    
    # Remove common filler prefixes
    cleaned_lower = cleaned.lower()
    for prefix in [
        "hello", "hi", "can you tell me", "please help me with", "what is", "how to",
        "i want to know about", "నా", "మీరు", "దయచేసి", "చెప్పండి"
    ]:
        if cleaned_lower.startswith(prefix):
            cleaned = cleaned[len(prefix):].strip(" ,:?")
            break

    first_sentence = cleaned.split('\n')[0].split('.')[0].strip()
    words = first_sentence.split()
    if not words:
        words = user_message.strip().split()

    if len(words) > 6:
        title = " ".join(words[:6])
    else:
        title = " ".join(words)
    
    title = title.strip().capitalize()
    return title if title else "Agricultural Guidance"


async def process_chat_message(
    db: Session,
    user_id: int,
    message_content: str,
    conversation_id: Optional[int] = None,
    response_language: Optional[str] = None,
    image_data: Optional[str] = None
) -> ChatMessageResponse:
    start_total_time = time.perf_counter()

    # 1. Fetch farmer profile context
    profile = get_farmer_profile(db, user_id)
    farmer_context = {
        "location": profile.location,
        "farm_size": profile.farm_size,
        "primary_crop": profile.primary_crop,
        "soil_type": profile.soil_type,
        "current_crop_stage": profile.current_crop_stage,
        "preferred_language": profile.preferred_language,
    }

    # 2. Detect language & strictly determine target response language
    detected_user_lang = detect_language(message_content)
    target_response_lang = determine_response_language(
        user_text=message_content,
        farmer_preferred_language=profile.preferred_language,
        explicit_response_language=response_language
    )

    # 3. Get or Create Conversation (fallback gracefully to creating new if ID is stale or not found)
    conversation = None
    if conversation_id:
        conversation = db.query(Conversation).filter(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id
        ).first()

    if not conversation:
        conversation = Conversation(
            user_id=user_id,
            title="New Conversation"
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # 4. Save user message to DB
    user_msg = Message(
        conversation_id=conversation.id,
        role="user",
        content=message_content,
        language=target_response_lang,
        image_url=image_data
    )
    db.add(user_msg)
    db.commit()
    db.refresh(user_msg)

    # 5. Update conversation title if this is the first message
    message_count = db.query(Message).filter(Message.conversation_id == conversation.id).count()
    if message_count <= 1:
        new_title = generate_deterministic_title(message_content)
        conversation.title = new_title
        db.commit()
        db.refresh(conversation)

    # 6. Check if image attachment is present for Plant Disease Diagnosis
    sources = []
    if image_data:
        detector = get_disease_detector()
        disease_analysis = await detector.analyze_leaf_image(
            image_data=image_data,
            target_language=target_response_lang,
            farmer_crop=profile.primary_crop
        )
        final_ai_content = disease_analysis["formatted_response"]
        sources = [{"title": "KRISHI AI Vision Engine (MobileNetV2 Leaf Diagnostic Model)", "source": "Agricultural Pathology System"}]
    else:
        # 7. Analyze text query and extract crop, symptom, and intent
        classification = classify_query(
            text=message_content,
            farmer_crop=profile.primary_crop
        )
        target_crop = classification.get("crop")
        target_category = classification.get("category")
        max_tokens = classification.get("max_tokens", settings.MAX_NEW_TOKENS)

        # 8. Metadata-aware RAG Retrieval (Skip RAG for simple greetings)
        if classification.get("intent") == "GREETING":
            rag_context, sources = None, []
        else:
            rag_context, sources = retrieve_agricultural_context(
                query=message_content,
                target_crop=target_crop,
                target_category=target_category
            )

        # 9. Fetch recent chat history without duplication
        recent_messages = db.query(Message).filter(
            Message.conversation_id == conversation.id
        ).order_by(Message.created_at.desc()).limit(settings.MAX_CHAT_HISTORY).all()
        
        recent_messages.reverse()

        formatted_history: List[Dict[str, str]] = []
        for m in recent_messages:
            content_clean = (m.content or "").strip()
            if content_clean:
                # Avoid duplicate adjacent entries
                if not formatted_history or not (formatted_history[-1]["role"] == m.role and formatted_history[-1]["content"] == content_clean):
                    formatted_history.append({"role": m.role, "content": content_clean})

        # Ensure current user message is present at the end
        if not formatted_history or formatted_history[-1]["content"] != message_content:
            formatted_history.append({"role": "user", "content": message_content})

        # 10. Build strict system prompt targeting the requested response language
        system_prompt = build_system_prompt(
            farmer_context=farmer_context,
            rag_context=rag_context,
            required_language=target_response_lang,
            query_intent=classification.get("intent")
        )

        # DEBUG LOG: Request parameters, selected language, RAG context, and system prompt
        logger.info("\n" + "="*80)
        logger.info("[DEBUG LOG] INCOMING KRISHI AI REQUEST")
        logger.info("[DEBUG LOG] Target Response Language: %s (Detected from query: %s | Farmer Preferred: %s)",
                    target_response_lang, detected_user_lang, profile.preferred_language)
        logger.info("[DEBUG LOG] User Message: %s", message_content)
        logger.info("[DEBUG LOG] Query Intent: %s | Detected Crop: %s | Category: %s",
                    classification.get("intent"), target_crop, target_category)
        logger.info("[DEBUG LOG] RAG Context (%d chars):\n%s",
                    len(rag_context) if rag_context else 0, rag_context if rag_context else "(None)")
        logger.info("[DEBUG LOG] Final System Prompt:\n%s", system_prompt)
        logger.info("="*80)

        # 11. Call AI Provider
        ai_provider = get_ai_provider()
        raw_ai_content = await ai_provider.generate_response(
            messages=formatted_history,
            system_prompt=system_prompt,
            max_new_tokens=max_tokens
        )

        # 12. Clean and validate response
        final_ai_content = localize_ai_response(raw_ai_content, target_lang=target_response_lang)

    total_duration = time.perf_counter() - start_total_time
    logger.info("\n" + "="*80)
    logger.info(
        "[DEBUG LOG] TOTAL CHAT PIPELINE FINISHED in %.3f s | Language: %s",
        total_duration, target_response_lang
    )
    logger.info("="*80 + "\n")

    # 13. Save assistant response
    sources_json_str = json.dumps(sources) if sources else None
    ai_msg = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=final_ai_content,
        language=target_response_lang,
        sources_json=sources_json_str
    )
    db.add(ai_msg)
    db.commit()
    db.refresh(ai_msg)

    # Prepare response schemas
    user_msg_resp = MessageResponse(
        id=user_msg.id,
        conversation_id=user_msg.conversation_id,
        role=user_msg.role,
        content=user_msg.content,
        language=target_response_lang,
        image_url=user_msg.image_url,
        sources=None,
        created_at=user_msg.created_at
    )

    source_items = [SourceItem(title=s["title"], source=s["source"]) for s in sources] if sources else None

    ai_msg_resp = MessageResponse(
        id=ai_msg.id,
        conversation_id=ai_msg.conversation_id,
        role=ai_msg.role,
        content=ai_msg.content,
        language=target_response_lang,
        image_url=None,
        sources=source_items,
        created_at=ai_msg.created_at
    )

    return ChatMessageResponse(
        conversation_id=conversation.id,
        user_message=user_msg_resp,
        ai_message=ai_msg_resp
    )
