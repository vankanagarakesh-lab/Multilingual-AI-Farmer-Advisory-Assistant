from typing import Optional, Dict, Any


def build_system_prompt(
    farmer_context: Optional[Dict[str, Any]] = None,
    weather_context: Optional[Dict[str, Any]] = None,
    rag_context: Optional[str] = None,
    required_language: Optional[str] = "en",
    query_intent: Optional[str] = "GENERAL_FARMING"
) -> str:
    """
    Builds a highly intelligent, personalized agricultural system prompt incorporating:
    - Farmer Profile (Name, Location, Soil, Land Area, Current Crop, Crop Stage, Water)
    - Live Meteorological Data (Current Weather, Temp, Humidity, Rain Probability, Forecast)
    - Intent-specific guidance (Crop Recommendation, Disease Advisory, Fertilizers, Irrigation)
    - Multilingual instructions (Telugu, Hindi, English)
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
        farmer_name = farmer_context.get("name") if farmer_context else ""
        greeting_prefix = f", {farmer_name}" if farmer_name and farmer_name != "Farmer" else ""
        if lang == "te":
            return (
                f"You are KRISHI AI, a personalized agricultural advisor. "
                f"Respond in simple, natural Telugu with a warm greeting welcoming the farmer{greeting_prefix} and asking how you can help their farm or crops today in 1-2 short sentences. "
                f"Example: నమస్కారం{greeting_prefix}! నేను మీ కృషి AI వ్యవసాయ సలహాదారుని. మీ పంటలు, నేల లేదా సాగు సంబంధిత సలహాల కోసం మీకు ఎలా సహాయపడగలను?"
            )
        elif lang == "hi":
            return (
                f"You are KRISHI AI, a personalized agricultural advisor. "
                f"Respond in simple, natural Hindi with a warm greeting welcoming the farmer{greeting_prefix} and asking how you can help their farm today in 1-2 short sentences."
            )
        else:
            return (
                f"You are KRISHI AI, a personalized agricultural advisor. "
                f"Respond in clear, friendly English with a warm greeting welcoming the farmer{greeting_prefix} and asking how you can help their farm today in 1-2 short sentences."
            )

    # 2. Base Core Directives for Krishi AI
    prompt_lines = [
        "You are KRISHI AI, a personalized, farmer-friendly agricultural advisor.",
        "CRITICAL RULES:",
        "1. Never output raw RAG chunks, document titles, or internal knowledge-base citations directly in the message text. Use knowledge strictly to formulate your own clear, natural advice.",
        "2. Always reason using the farmer's actual profile (location, soil, land area, current crop, growth stage) and live weather conditions.",
        "3. Do not assume or default to Rice / Paddy or Black Soil unless the farmer specifically asks about it or it is set in their profile.",
        "4. If essential parameters (like crop name for fertilizer advice) are not provided, politely ask the farmer for the missing detail instead of inventing facts.",
        "5. For crop suggestion requests, format your response cleanly as:",
        "   'Based on your location, soil, current weather and water availability, these crops may be suitable for you:\n   1. [Crop name] – [Reason]\n   2. [Crop name] – [Reason]\n   3. [Crop name] – [Reason]\n   Best recommendation: [Crop name] because [personalized reason].'",
        "6. Keep answers concise, actionable, and free from repetitive meta-explanations."
    ]

    # 3. Verified Farmer Profile Context Block
    if farmer_context:
        f_name = farmer_context.get("name") or "Farmer"
        f_loc = farmer_context.get("location") or "Andhra Pradesh, India"
        f_soil = farmer_context.get("soil_type") or "Not specified yet"
        f_area = farmer_context.get("farm_size") or "Not specified yet"
        f_crop = farmer_context.get("primary_crop") or "Not specified yet"
        f_stage = farmer_context.get("current_crop_stage") or "Not specified yet"
        f_water = farmer_context.get("water_availability") or "Moderate"
        f_lang = farmer_context.get("preferred_language") or ("Telugu" if lang == "te" else "English")

        prompt_lines.append("")
        prompt_lines.append("FARMER PROFILE CONTEXT:")
        prompt_lines.append(f"- Farmer Name: {f_name}")
        prompt_lines.append(f"- Farm Location: {f_loc}")
        prompt_lines.append(f"- Soil Type: {f_soil}")
        prompt_lines.append(f"- Land Area: {f_area}")
        prompt_lines.append(f"- Current Crop: {f_crop}")
        prompt_lines.append(f"- Crop Growth Stage: {f_stage}")
        prompt_lines.append(f"- Water Availability: {f_water}")
        prompt_lines.append(f"- Preferred Language: {f_lang}")

    # 4. Live Meteorological Weather Context Block
    if weather_context:
        w_temp = weather_context.get("temperature", 30)
        w_cond = weather_context.get("condition", "Partly Cloudy")
        w_hum = weather_context.get("humidity", 65)
        w_rain_chance = weather_context.get("rain_chance", 15)
        w_next_rain = weather_context.get("next_rain", "Clear weather in upcoming 48 hours")
        w_loc = weather_context.get("location", "Farm Location")

        prompt_lines.append("")
        prompt_lines.append("LIVE WEATHER CONTEXT (Use for agricultural reasoning):")
        prompt_lines.append(f"- Location: {w_loc} | Condition: {w_cond} | Temperature: {w_temp}°C | Humidity: {w_hum}% | Rain Forecast: {w_next_rain} ({w_rain_chance}%)")

    # 5. Intent Specific Agricultural Guidance
    if intent == "CROP_RECOMMENDATION":
        prompt_lines.append("")
        prompt_lines.append("TASK: HIGHLY PERSONALIZED CROP RECOMMENDATION:")
        prompt_lines.append("- Analyze the farmer's specific Soil Type, Location, Water Availability, Land Area, and Current Weather before suggesting crops.")
        prompt_lines.append("- Recommend 2 to 3 best suited, profitable crops specifically matched to this soil and climate (e.g. for Black soil & moderate rain in AP: Cotton, Chilli, Maize, Groundnut, Pulses; for high water: Rice/Paddy; for low water: Millets, Groundnut).")
        prompt_lines.append("- For each recommended crop, briefly state why it fits their soil, weather, water level, and expected duration/yield.")
    elif intent in ["CROP_DISEASE_OR_SYMPTOM", "PEST_PROBLEM"]:
        prompt_lines.append("")
        prompt_lines.append("TASK: CROP HEALTH & PEST/DISEASE MANAGEMENT:")
        prompt_lines.append("- Provide clear diagnosis, direct causes, step-by-step organic/chemical remedy with exact dosages, and future preventive measures.")
    elif intent == "FERTILIZER_SOIL":
        prompt_lines.append("")
        prompt_lines.append("TASK: SOIL HEALTH & NUTRIENT MANAGEMENT:")
        prompt_lines.append("- Recommend basal and top-dressing dosages suited for the farmer's soil type and crop stage.")
    elif intent == "IRRIGATION_WATER":
        prompt_lines.append("")
        prompt_lines.append("TASK: IRRIGATION & WATER MANAGEMENT:")
        prompt_lines.append("- Factor in the live rainfall forecast, humidity, and temperature to give an accurate watering schedule.")

    # 6. Language & Localization Directives
    if lang == "te":
        prompt_lines.append("")
        prompt_lines.append("LANGUAGE DIRECTIVE: TELUGU (తెలుగు):")
        prompt_lines.append("- Answer completely in natural, grammatically correct, farmer-friendly TELUGU (తెలుగు).")
        prompt_lines.append("- Explicitly address the farmer's location, soil type, and weather in Telugu (e.g., 'మీ గుంటూరు ప్రాంతం, నల్లరేగడి నేల మరియు ప్రస్తుత వాతావరణం ప్రకారం...').")
        prompt_lines.append("- Do not mix English words into the middle of sentences unless technical names are necessary.")
    elif lang == "hi":
        prompt_lines.append("")
        prompt_lines.append("LANGUAGE DIRECTIVE: HINDI (हिंदी):")
        prompt_lines.append("- Answer completely in simple, natural HINDI (देवनागरी).")
        prompt_lines.append("- Reference the farmer's soil, location, and weather conditions directly.")
    else:  # English
        prompt_lines.append("")
        prompt_lines.append("LANGUAGE DIRECTIVE: ENGLISH:")
        prompt_lines.append("- Answer completely in clear, structured, practical ENGLISH.")
        prompt_lines.append("- Directly reference the farmer's location, soil type, and weather conditions in your opening recommendation.")

    # 7. Optional Supporting Agricultural Knowledge (RAG)
    if rag_context and rag_context.strip():
        prompt_lines.append("")
        prompt_lines.append("SUPPORTING VERIFIED AGRICULTURAL KNOWLEDGE (RAG Context):")
        prompt_lines.append(rag_context.strip())

    return "\n".join(prompt_lines)
