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
        "Always use the farmer's profile, current location, current weather, soil type, water availability, land area, crop details and conversation context before giving recommendations.",
        "Never give a generic answer when profile data is available.",
        "CRITICAL RULE: NEVER say 'I don't have access to your location or soil information' because all verified farmer details and live meteorological data are already provided below.",
        "If specific details are missing, use the available profile and weather information and politely ask only for the missing parameters.",
        "Never stop midway through a sentence or farming step. Ensure all explanations and lists are fully completed."
    ]

    # 3. Verified Farmer Profile Context Block
    if farmer_context:
        f_name = farmer_context.get("name") or "Farmer"
        f_loc = farmer_context.get("location") or "Andhra Pradesh, India"
        f_soil = farmer_context.get("soil_type") or "Black Soil (Clay Loam)"
        f_area = farmer_context.get("farm_size") or "3 Acres"
        f_crop = farmer_context.get("primary_crop") or "Not specified yet"
        f_stage = farmer_context.get("current_crop_stage") or "Vegetative / Sowing"
        f_water = farmer_context.get("water_availability") or farmer_context.get("water_source") or "Moderate / Canal & Borewell"
        f_lang = farmer_context.get("preferred_language") or ("Telugu" if lang == "te" else "English")

        prompt_lines.append("")
        prompt_lines.append("FARMER PROFILE & LOCAL FARM CONDITIONS:")
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
        w_wind = weather_context.get("wind_speed", 10)
        w_rain_chance = weather_context.get("rain_chance", 15)
        w_next_rain = weather_context.get("next_rain", "Clear weather in upcoming 48 hours")
        w_loc = weather_context.get("location", "Farm Coordinates")

        prompt_lines.append("")
        prompt_lines.append("LIVE METEOROLOGICAL STATION WEATHER & FORECAST:")
        prompt_lines.append(f"- Location: {w_loc}")
        prompt_lines.append(f"- Current Condition: {w_cond}")
        prompt_lines.append(f"- Temperature: {w_temp}°C")
        prompt_lines.append(f"- Relative Humidity: {w_hum}%")
        prompt_lines.append(f"- Wind Speed: {w_wind} km/h")
        prompt_lines.append(f"- Rain Chance: {w_rain_chance}%")
        prompt_lines.append(f"- Next Rain Forecast: {w_next_rain}")

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
