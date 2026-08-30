import json
import time
import logging
from typing import Optional, List, Dict, Any, Tuple
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models import Conversation, Message
from app.schemas.chat import ChatMessageResponse
from app.schemas.conversation import MessageResponse, SourceItem
from app.services.farmer_service import get_farmer_profile
from app.services.language_service import (
    detect_language, 
    determine_response_language,
    localize_ai_response
)
from app.services.weather_service import get_live_weather
from app.ai.provider import get_ai_provider
from app.ai.agricultural_prompt import build_system_prompt
from app.ai.query_classifier import classify_query
from app.knowledge.retrieval.knowledge_service import retrieve_agricultural_context
from app.services.disease_service import get_disease_detector
from app.services.agronomy_synthesizer import generate_expert_agronomic_advice, stream_fast_tokens

logger = logging.getLogger(__name__)


def generate_deterministic_title(first_message: str) -> str:
    """Creates a concise 3-5 word conversation title."""
    clean_text = first_message.strip().replace("\n", " ")
    words = clean_text.split()
    if len(words) <= 4:
        return clean_text.capitalize()
    return " ".join(words[:4]).capitalize() + "..."


async def process_chat_message(
    db: Session,
    user_id: int,
    message_content: str,
    conversation_id: Optional[int] = None,
    response_language: Optional[str] = None,
    image_data: Optional[str] = None,
    weather_data: Optional[Dict[str, Any]] = None
) -> ChatMessageResponse:
    """
    Main entry point for processing incoming chat requests with deep farmer profile,
    real-time weather intelligence, and LoRA reasoning.
    """
    start_total_time = time.perf_counter()

    # 1. Fetch live farmer profile context from DB
    profile = get_farmer_profile(db, user_id)
    farmer_context = {
        "name": profile.name or "Farmer",
        "location": profile.location or (weather_data.get("locationName") if weather_data else None) or "Andhra Pradesh, India",
        "farm_size": profile.farm_size or "2 Acres",
        "primary_crop": profile.primary_crop or None,
        "soil_type": profile.soil_type or None,
        "current_crop_stage": profile.current_crop_stage or None,
        "preferred_language": profile.preferred_language or "English",
        "water_availability": "Moderate"
    }

    # 2. Fetch live verified meteorological data
    weather_context = await get_live_weather(
        location_name=profile.location,
        client_weather=weather_data
    )

    # 3. Detect query language & target response language
    detected_user_lang = detect_language(message_content)
    target_response_lang = determine_response_language(
        user_text=message_content,
        farmer_preferred_language=profile.preferred_language,
        explicit_response_language=response_language
    )

    # 4. Get or create conversation
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

    # 5. Save user message to DB
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

    # 6. Update conversation title on first message
    message_count = db.query(Message).filter(Message.conversation_id == conversation.id).count()
    if message_count <= 1:
        new_title = generate_deterministic_title(message_content)
        conversation.title = new_title
        db.commit()
        db.refresh(conversation)

    # 7. Check if image attachment is present for Plant Disease Diagnosis
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
        # 8. Analyze text query and extract crop, symptom, and intent
        classification = classify_query(
            text=message_content,
            farmer_crop=profile.primary_crop
        )
        query_intent = classification.get("intent", "GENERAL_FARMING")
        if query_intent in ["CROP_RECOMMENDATION", "GREETING"]:
            target_crop = classification.get("crop")
        else:
            target_crop = classification.get("crop") or profile.primary_crop
        target_category = classification.get("category")
        max_tokens = classification.get("max_tokens") or settings.MAX_NEW_TOKENS

        # 9. Metadata-aware RAG Retrieval
        if classification.get("intent") == "GREETING":
            rag_context, sources = None, []
        else:
            rag_context, sources = retrieve_agricultural_context(
                query=message_content,
                target_crop=target_crop,
                target_category=target_category
            )

        # 10. Fetch recent chat history (compact 2 turns)
        recent_messages = db.query(Message).filter(
            Message.conversation_id == conversation.id
        ).order_by(Message.created_at.desc()).limit(settings.MAX_CHAT_HISTORY).all()
        recent_messages.reverse()

        formatted_history: List[Dict[str, str]] = []
        for m in recent_messages:
            content_clean = (m.content or "").strip()
            if content_clean:
                if not formatted_history or not (formatted_history[-1]["role"] == m.role and formatted_history[-1]["content"] == content_clean):
                    formatted_history.append({"role": m.role, "content": content_clean})

        if not formatted_history or formatted_history[-1]["content"] != message_content:
            formatted_history.append({"role": "user", "content": message_content})

        # 11. Build personalized system prompt with farmer profile and live weather
        system_prompt = build_system_prompt(
            farmer_context=farmer_context,
            weather_context=weather_context,
            rag_context=rag_context,
            required_language=target_response_lang,
            query_intent=classification.get("intent")
        )

        # DEBUG LOG: Request parameters, selected language, RAG context, and system prompt
        logger.info("\n" + "="*80)
        logger.info("[DEBUG LOG] KRISHI AI INFERENCE PIPELINE")
        logger.info("[DEBUG LOG] Loaded Farmer Profile: Name=%s | Location=%s | Land=%s | Soil=%s | Crop=%s | Stage=%s",
                    farmer_context.get("name"), farmer_context.get("location"), farmer_context.get("farm_size"),
                    farmer_context.get("soil_type"), farmer_context.get("primary_crop"), farmer_context.get("current_crop_stage"))
        logger.info("[DEBUG LOG] Location: %s | Coordinates: (%s, %s)",
                    weather_context.get("location"), weather_context.get("latitude"), weather_context.get("longitude"))
        logger.info("[DEBUG LOG] Live Current Weather: %s°C | %s | Humidity: %s%% | Rain Forecast: %s",
                    weather_context.get("temperature"), weather_context.get("condition"),
                    weather_context.get("humidity"), weather_context.get("next_rain"))
        logger.info("[DEBUG LOG] Query Intent: %s | Detected Crop: %s | Category: %s",
                    classification.get("intent"), target_crop, target_category)
        logger.info("[DEBUG LOG] LoRA Adapter Active: %s (Base Model: %s, Adapter: %s)",
                    getattr(settings, "USE_LORA", True), settings.HF_BASE_MODEL, settings.KRISHI_ADAPTER_PATH)
        logger.info("[DEBUG LOG] Retrieved RAG Knowledge (%d chars):\n%s",
                    len(rag_context) if rag_context else 0, rag_context if rag_context else "(None)")
        # 12. Try ultra-fast expert agronomic synthesis
        agronomic_advice = generate_expert_agronomic_advice(
            query=message_content,
            target_crop=target_crop,
            intent=classification.get("intent", "GENERAL_FARMING"),
            farmer_context=farmer_context,
            weather_context=weather_context,
            rag_context=rag_context,
            target_language=target_response_lang
        )

        if agronomic_advice:
            final_ai_content, expert_sources = agronomic_advice
            if expert_sources:
                sources = expert_sources
            logger.info("[DEBUG LOG] FAST AGRONOMY SYNTHESIS HIT (Time: <0.1s)")
        else:
            # Fallback to AI Provider
            ai_provider = get_ai_provider()
            raw_ai_content = await ai_provider.generate_response(
                messages=formatted_history,
                system_prompt=system_prompt,
                max_new_tokens=max_tokens
            )
            final_ai_content = localize_ai_response(raw_ai_content, target_lang=target_response_lang)

    total_duration = time.perf_counter() - start_total_time
    logger.info("\n" + "="*80)
    logger.info(
        "[DEBUG LOG] TOTAL CHAT PIPELINE FINISHED in %.3f s | Language: %s",
        total_duration, target_response_lang
    )
    logger.info("="*80 + "\n")

    # 14. Save assistant response
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


async def process_chat_message_stream(
    db: Session,
    user_id: int,
    message_content: str,
    conversation_id: Optional[int] = None,
    response_language: Optional[str] = None,
    image_data: Optional[str] = None,
    weather_data: Optional[Dict[str, Any]] = None
):
    """
    Streaming chat generator yielding Server-Sent Events (SSE).
    Injects deep farmer profile context, live verified weather, and LoRA reasoning.
    """
    # 1. Fetch live farmer profile context from DB
    profile = get_farmer_profile(db, user_id)
    farmer_context = {
        "name": profile.name or "Farmer",
        "location": profile.location or (weather_data.get("locationName") if weather_data else None) or "Andhra Pradesh, India",
        "farm_size": profile.farm_size or "2 Acres",
        "primary_crop": profile.primary_crop or None,
        "soil_type": profile.soil_type or None,
        "current_crop_stage": profile.current_crop_stage or None,
        "preferred_language": profile.preferred_language or "English",
        "water_availability": "Moderate"
    }

    # 2. Fetch live meteorological weather data
    weather_context = await get_live_weather(
        location_name=profile.location,
        client_weather=weather_data
    )

    # 3. Detect language
    detected_user_lang = detect_language(message_content)
    target_response_lang = determine_response_language(
        user_text=message_content,
        farmer_preferred_language=profile.preferred_language,
        explicit_response_language=response_language
    )

    # 4. Get or Create Conversation
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

    # 5. Save user message to DB
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

    # 6. Update title on first message
    message_count = db.query(Message).filter(Message.conversation_id == conversation.id).count()
    if message_count <= 1:
        new_title = generate_deterministic_title(message_content)
        conversation.title = new_title
        db.commit()
        db.refresh(conversation)

    # Yield initial init event
    init_payload = {
        "type": "init",
        "conversation_id": conversation.id,
        "user_message": {
            "id": user_msg.id,
            "conversation_id": user_msg.conversation_id,
            "role": user_msg.role,
            "content": user_msg.content,
            "language": target_response_lang,
            "image_url": user_msg.image_url,
            "created_at": user_msg.created_at.isoformat() if hasattr(user_msg.created_at, 'isoformat') else str(user_msg.created_at)
        }
    }
    yield f"data: {json.dumps(init_payload)}\n\n"

    sources = []
    full_generated_text = ""

    if image_data:
        detector = get_disease_detector()
        disease_analysis = await detector.analyze_leaf_image(
            image_data=image_data,
            target_language=target_response_lang,
            farmer_crop=profile.primary_crop
        )
        final_ai_content = disease_analysis["formatted_response"]
        sources = [{"title": "KRISHI AI Vision Engine (MobileNetV2 Leaf Diagnostic Model)", "source": "Agricultural Pathology System"}]
        yield f"data: {json.dumps({'type': 'token', 'chunk': final_ai_content})}\n\n"
    else:
        # Fast classification & RAG
        classification = classify_query(
            text=message_content,
            farmer_crop=profile.primary_crop
        )
        query_intent = classification.get("intent", "GENERAL_FARMING")
        if query_intent in ["CROP_RECOMMENDATION", "GREETING"]:
            target_crop = classification.get("crop")
        else:
            target_crop = classification.get("crop") or profile.primary_crop
        target_category = classification.get("category")
        max_tokens = classification.get("max_tokens") or settings.MAX_NEW_TOKENS

        if classification.get("intent") == "GREETING":
            rag_context, sources = None, []
        else:
            rag_context, sources = retrieve_agricultural_context(
                query=message_content,
                target_crop=target_crop,
                target_category=target_category
            )

        # Compact history (last 2 turns)
        recent_messages = db.query(Message).filter(
            Message.conversation_id == conversation.id
        ).order_by(Message.created_at.desc()).limit(settings.MAX_CHAT_HISTORY).all()
        recent_messages.reverse()

        formatted_history: List[Dict[str, str]] = []
        for m in recent_messages:
            content_clean = (m.content or "").strip()
            if content_clean:
                if not formatted_history or not (formatted_history[-1]["role"] == m.role and formatted_history[-1]["content"] == content_clean):
                    formatted_history.append({"role": m.role, "content": content_clean})

        if not formatted_history or formatted_history[-1]["content"] != message_content:
            formatted_history.append({"role": "user", "content": message_content})

        system_prompt = build_system_prompt(
            farmer_context=farmer_context,
            weather_context=weather_context,
            rag_context=rag_context,
            required_language=target_response_lang,
            query_intent=classification.get("intent")
        )

        logger.info("\n" + "="*80)
        logger.info("[DEBUG LOG] KRISHI AI STREAMING INFERENCE PIPELINE")
        logger.info("[DEBUG LOG] Loaded Farmer Profile: Name=%s | Location=%s | Land=%s | Soil=%s | Crop=%s | Stage=%s",
                    farmer_context.get("name"), farmer_context.get("location"), farmer_context.get("farm_size"),
                    farmer_context.get("soil_type"), farmer_context.get("primary_crop"), farmer_context.get("current_crop_stage"))
        logger.info("[DEBUG LOG] Location: %s | Coordinates: (%s, %s)",
                    weather_context.get("location"), weather_context.get("latitude"), weather_context.get("longitude"))
        logger.info("[DEBUG LOG] Live Current Weather: %s°C | %s | Humidity: %s%% | Rain Forecast: %s",
                    weather_context.get("temperature"), weather_context.get("condition"),
                    weather_context.get("humidity"), weather_context.get("next_rain"))
        logger.info("[DEBUG LOG] Query Intent: %s | Target Crop: %s",
                    classification.get("intent"), target_crop)
        logger.info("[DEBUG LOG] LoRA Adapter Active: %s (Base Model: %s, Adapter: %s)",
                    getattr(settings, "USE_LORA", True), settings.HF_BASE_MODEL, settings.KRISHI_ADAPTER_PATH)
        logger.info("[DEBUG LOG] Retrieved RAG Knowledge (%d chars):\n%s",
                    len(rag_context) if rag_context else 0, rag_context if rag_context else "(None)")
        logger.info("[DEBUG LOG] Final Prompt Sent to Model:\n%s", system_prompt)
        # Check ultra-fast expert agronomic synthesis
        agronomic_advice = generate_expert_agronomic_advice(
            query=message_content,
            target_crop=target_crop,
            intent=classification.get("intent", "GENERAL_FARMING"),
            farmer_context=farmer_context,
            weather_context=weather_context,
            rag_context=rag_context,
            target_language=target_response_lang
        )

        if agronomic_advice:
            fast_content, expert_sources = agronomic_advice
            if expert_sources:
                sources = expert_sources
            full_generated_text = fast_content
            logger.info("[DEBUG LOG] FAST STREAMING HIT (Immediate token dispatch)")
            async for token_chunk in stream_fast_tokens(fast_content):
                yield f"data: {json.dumps({'type': 'token', 'chunk': token_chunk})}\n\n"
            final_ai_content = fast_content
        else:
            ai_provider = get_ai_provider()
            
            # Stream tokens live from AI model
            try:
                async for token_chunk in ai_provider.generate_response_stream(
                    messages=formatted_history,
                    system_prompt=system_prompt,
                    max_new_tokens=max_tokens
                ):
                    if token_chunk:
                        full_generated_text += token_chunk
                        yield f"data: {json.dumps({'type': 'token', 'chunk': token_chunk})}\n\n"
            except Exception as stream_err:
                logger.warning("Streaming error, falling back to sync generation: %s", stream_err)
                full_generated_text = await ai_provider.generate_response(
                    messages=formatted_history,
                    system_prompt=system_prompt,
                    max_new_tokens=max_tokens
                )
                yield f"data: {json.dumps({'type': 'token', 'chunk': full_generated_text})}\n\n"

            final_ai_content = localize_ai_response(full_generated_text, target_lang=target_response_lang)

    # Save to database
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

    # Yield final done event
    done_payload = {
        "type": "done",
        "conversation_id": conversation.id,
        "ai_message": {
            "id": ai_msg.id,
            "conversation_id": ai_msg.conversation_id,
            "role": ai_msg.role,
            "content": ai_msg.content,
            "language": target_response_lang,
            "sources": sources,
            "created_at": ai_msg.created_at.isoformat() if hasattr(ai_msg.created_at, 'isoformat') else str(ai_msg.created_at)
        }
    }
    yield f"data: {json.dumps(done_payload)}\n\n"
