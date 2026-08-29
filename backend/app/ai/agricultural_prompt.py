from typing import Optional, Dict, Any


def build_system_prompt(
    farmer_context: Optional[Dict[str, Any]] = None,
    rag_context: Optional[str] = None,
    required_language: Optional[str] = "en",
    query_intent: Optional[str] = "GENERAL_FARMING"
) -> str:
    """
    Builds a clean, intent-aware agricultural system prompt matching the required language.
    Supported languages: 'en' (English), 'te' (Telugu), 'hi' (Hindi).
    """
    lang = (required_language or "en").strip().lower()
    if lang not in ["en", "te", "hi"]:
        if lang in ["telugu", "te-in", "te_in"]:
            lang = "te"
        elif lang in ["hindi", "hi-in", "hi_in"]:
            lang = "hi"
        else:
            lang = "en"

    intent = (query_intent or "GENERAL_FARMING").upper()

    # 1. Special Handling for Greetings
    if intent == "GREETING":
        if lang == "te":
            return (
                "You are KRISHI AI, a helpful and polite agricultural assistant. "
                "Respond in simple, natural Telugu with a warm greeting welcoming the farmer and asking how you can help their farm or crops today in 1-2 short sentences. "
                "Example: నమస్కారం! నేను కృషి AI. మీ పంటలు, సాగు లేదా వ్యవసాయ సమస్యల గురించి అడగండి. మీకు ఎలా సహాయపడగలను?"
            )
        elif lang == "hi":
            return (
                "You are KRISHI AI, a helpful and polite agricultural assistant. "
                "Respond in simple, natural Hindi with a warm greeting welcoming the farmer and asking how you can help their farm today in 1-2 short sentences."
            )
        else:
            return (
                "You are KRISHI AI, a helpful and polite agricultural assistant. "
                "Respond in clear, friendly English with a warm greeting welcoming the farmer and asking how you can help their farm today in 1-2 short sentences."
            )

    # 2. Base Core Directives for Krishi AI
    prompt_lines = [
        "You are KRISHI AI, an expert, farmer-friendly agricultural advisor.",
        "Formulate your own original, practical advice in clear, natural language.",
        "Never copy raw notes verbatim, and never produce confusing number loops or lists of isolated numbers.",
        "Keep answers concise and easy for a farmer to understand."
    ]

    # 3. Language & Intent Specific Directives
    if lang == "te":
        prompt_lines.append("")
        prompt_lines.append("LANGUAGE DIRECTIVE: TELUGU (తెలుగు):")
        prompt_lines.append("- Answer completely in simple, natural, grammatically correct TELUGU that a farmer can easily understand.")
        prompt_lines.append("- Do not translate English word-by-word; speak naturally like an agricultural expert talking to a farmer.")
        prompt_lines.append("- Do not repeat words or sentences.")

        if intent in ["CROP_DISEASE_OR_SYMPTOM", "PEST_PROBLEM"]:
            prompt_lines.extend([
                "",
                "STRUCTURE FOR CROP PROBLEM ADVISORY:",
                "🌱 సమస్య ఏమిటి?: [సమస్యను 1-2 వాక్యాలలో చెప్పండి]",
                "🔍 ఇలా ఎందుకు జరుగుతుంది?: [ముఖ్య కారణాలను 2-3 పాయింట్లలో చెప్పండి]",
                "🛠️ ఇప్పుడు ఏం చేయాలి?: [రైతు వెంటనే చేయగల 3-4 ఆచరణాత్మక చర్యలు]",
                "🛡️ మళ్లీ రాకుండా ఎలా చూసుకోవాలి?: [ముందు జాగ్రత్త చర్యలు]"
            ])
        else:
            prompt_lines.extend([
                "",
                "GUIDELINES:",
                "- Give a direct, helpful, natural answer to the farmer's question in 2 to 4 clear sentences or simple bullet points."
            ])
    elif lang == "hi":
        prompt_lines.append("")
        prompt_lines.append("LANGUAGE DIRECTIVE: HINDI (हिंदी):")
        prompt_lines.append("- Answer completely in simple, natural HINDI (देवनागरी).")
        prompt_lines.append("- Keep the advice practical, clear, and direct.")
    else:  # English
        prompt_lines.append("")
        prompt_lines.append("LANGUAGE DIRECTIVE: ENGLISH:")
        prompt_lines.append("- Answer completely in clear, simple, practical ENGLISH.")
        prompt_lines.append("- Keep the advice direct, actionable, and easy to understand.")

    # 4. Farmer Profile Context
    if farmer_context and any(farmer_context.values()):
        profile_parts = []
        if farmer_context.get("primary_crop"):
            profile_parts.append(f"Crop: {farmer_context['primary_crop']}")
        if farmer_context.get("location"):
            profile_parts.append(f"Location: {farmer_context['location']}")
        if farmer_context.get("soil_type"):
            profile_parts.append(f"Soil: {farmer_context['soil_type']}")
        if farmer_context.get("current_crop_stage"):
            profile_parts.append(f"Stage: {farmer_context['current_crop_stage']}")
        if profile_parts:
            prompt_lines.append("")
            prompt_lines.append(f"FARMER PROFILE CONTEXT: {', '.join(profile_parts)}")

    # 5. Optional Supporting Agricultural Knowledge (RAG)
    if rag_context and rag_context.strip():
        prompt_lines.append("")
        prompt_lines.append("SUPPORTING AGRICULTURAL REFERENCE (Use only to inform your answer; do not copy verbatim):")
        prompt_lines.append(rag_context.strip())

    return "\n".join(prompt_lines)


