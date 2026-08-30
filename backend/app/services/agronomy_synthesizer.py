import asyncio
import logging
from typing import AsyncGenerator, Dict, Any, Optional, List, Tuple
from app.services.language_service import (
    localize_ai_response,
    normalize_language_code
)

logger = logging.getLogger(__name__)


def generate_expert_agronomic_advice(
    query: str,
    target_crop: Optional[str],
    intent: str,
    farmer_context: Dict[str, Any],
    weather_context: Dict[str, Any],
    rag_context: Optional[str],
    target_language: str
) -> Optional[Tuple[str, List[Dict[str, str]]]]:
    """
    Synthesizes authoritative, highly specific agronomic advice combining:
    - Farmer profile (crop, soil, land area, growth stage)
    - Live weather data (temperature, rain forecast)
    - Verified RAG knowledge base
    - Multi-stage chemical / organic scheduling
    Supports instant native generation in English, Telugu, Hindi, Kannada, Tamil, Marathi.
    """
    q_lower = query.lower()
    crop = (target_crop or farmer_context.get("primary_crop") or "paddy").lower()
    soil = (farmer_context.get("soil_type") or "Black Soil").strip()
    f_name = farmer_context.get("name") or "Farmer"
    farm_size = farmer_context.get("farm_size") or "2 Acres"
    crop_stage = farmer_context.get("current_crop_stage") or "Vegetative"
    weather_temp = weather_context.get("temperature", 30)
    weather_rain = weather_context.get("next_rain", "Clear in 48 hours")
    lang = normalize_language_code(target_language)
    
    sources = []

    # 1. FERTILIZER & N-P-K RATIO ADVISORY
    if (
        "npk" in q_lower 
        or "fertilizer" in q_lower 
        or "fertilizers" in q_lower 
        or "urea" in q_lower 
        or "ratio" in q_lower 
        or "nutrient" in q_lower
        or "dose" in q_lower
        or "dosage" in q_lower
        or "ఎరువు" in q_lower
        or "నత్రజని" in q_lower
        or "భాస్వరం" in q_lower
        or "యూరియా" in q_lower
        or "खाद" in q_lower
        or "उर्वरक" in q_lower
        or "नाइट्रोजन" in q_lower
        or intent == "FERTILIZER_SOIL"
    ):
        sources.append({
            "title": "ICAR & State Agricultural University Crop Nutrition Guidelines",
            "source": "Integrated Nutrient Management Manual"
        })
        sources.append({
            "title": "Soil Health & Nutrient Stewardship (TNAU / ANGRAU)",
            "source": "Agronomic Field Formulations"
        })

        if "rice" in crop or "paddy" in crop or "వరి" in q_lower or "ధాన" in q_lower or "వరి" in str(farmer_context.get("primary_crop", "")).lower():
            is_black_soil = "black" in soil.lower() or "నల్ల" in soil.lower() or "काली" in soil.lower()

            if lang == "te":
                soil_desc = "నల్లరేగడి నేల (Black Clay Loam)" if is_black_soil else f"{soil}"
                text = (
                    f"🌾 **{soil_desc}లో వరి పంటకు సిఫార్సు చేసిన ఎరువుల సమగ్ర ప్రణాళిక (N-P-K Schedule)**\n\n"
                    f"### 🧪 1. సిఫార్సు చేసిన సరైన N-P-K నిష్పత్తి:\n"
                    f"- **ప్రామాణిక మోతాదు:** **120 : 60 : 40 కిలోలు/హెక్టారుకు** (ఎకరానికి సుమారు **50 కిలోల నత్రజని : 25 కిలోల భాస్వరం : 15 కిలోల పొటాష్**).\n"
                    f"- **నేల స్వభావం:** నల్లరేగడి నేలలో తేమ నిల్వ సామర్థ్యం మరియు పొటాష్ లభ్యత ఎక్కువగా ఉంటాయి. అయితే భాస్వరం లభ్యత మందకొడిగా ఉండటం మరియు నీటి నిల్వ వల్ల **జింక్ (Zinc) లోపం** రావడం సహజం.\n\n"
                    f"### 🗓️ 2. దశలవారీ ఎరువుల మోతాదు (ఎకరానికి):\n"
                    f"1. **ఆఖరి దమ్ము సమయంలో (Basal Dose):**\n"
                    f"   - **DAP:** 50 కిలోలు (లేదా సింగిల్ సూపర్ ఫాస్ఫేట్ - SSP 150 కిలోలు)\n"
                    f"   - **మ్యూరేట్ ఆఫ్ పొటాష్ (MOP):** 15 కిలోలు\n"
                    f"   - **యూరియా:** 25 కిలోలు (ప్రారంభ పెరుగుదలకు)\n"
                    f"   - *నియమం:* దమ్ము చేసి నాటు వేసే ముందు నేలలో కలియదున్నాలి.\n\n"
                    f"2. **మొదటి దఫా (పిలకలు వేసే దశ — నాటిన 20-25 రోజులకు):**\n"
                    f"   - **యూరియా:** 50 కిలోలు\n"
                    f"   - **జింక్ సల్ఫేట్ (21% Zn):** 10–12 కిలోలు (నల్లరేగడి నేలలో ఖైరా తెగులు, ఆకులు తుప్పు మచ్చలుగా మారడాన్ని పూర్తిగా నివారిస్తుంది).\n"
                    f"   - *సూచన:* యూరియా వేసే ముందు పొలంలో నీటిని తీసివేసి, చల్లిన 24 గంటల తర్వాత పలుచటి నీరు పెట్టాలి.\n\n"
                    f"3. **రెండవ దఫా (చిరుపొట్ట / పొట్ట దశ — నాటిన 40-45 రోజులకు):**\n"
                    f"   - **యూరియా:** 25 కిలోలు\n"
                    f"   - **పొటాష్ (MOP):** 15 కిలోలు (గింజ గట్టిపడటానికి, తాలు గింజలు తగ్గడానికి మరియు కాండం గట్టిపడి పంట పడిపోకుండా ఉండటానికి).\n\n"
                    f"### 💧 3. వాతావరణం & నీటి నిర్వహణ:\n"
                    f"- **ప్రస్తుత ఉష్ణోగ్రత:** {weather_temp}°C | {weather_rain}.\n"
                    f"- వర్షం వచ్చే అవకాశం ఉన్నప్పుడు యూరియా చల్లవద్దు. పిలకల దశలో 2-3 సెం.మీ పలుచటి నీటి పొర ఉంచితే వేర్లు ఆరోగ్యంగా ఉంటాయి."
                )
                return text, sources

            elif lang == "hi":
                soil_desc = "काली मिट्टी (Black Clay Loam)" if is_black_soil else f"{soil}"
                text = (
                    f"🌾 **{soil_desc} में धान (चावल) के लिए सर्वोत्तम N-P-K उर्वरक प्रबंधन**\n\n"
                    f"### 🧪 1. अनुशंसित N-P-K अनुपात:\n"
                    f"- **मानक अनुपात:** **120 : 60 : 40 किग्रा/हेक्टेयर** (लगभग **50 किग्रा नाइट्रोजन : 25 किग्रा फास्फोरस : 15 किग्रा पोटाश प्रति एकड़**)।\n"
                    f"- **मिट्टी का प्रभाव:** काली मिट्टी में पोटाश की मात्रा अच्छी होती है, लेकिन पानी जमा होने पर जिंक की कमी और फास्फोरस की उपलब्धता धीमी हो जाती है।\n\n"
                    f"### 🗓️ 2. चरणबद्ध उर्वरक अनुप्रयोग (प्रति एकड़):\n"
                    f"1. **अंतिम जुताई / रोपाई के समय (Basal Dose):**\n"
                    f"   - **DAP:** 50 किग्रा (या SSP 150 किग्रा)\n"
                    f"   - **MOP (पोटाश):** 15 किग्रा\n"
                    f"   - **यूरिया:** 25 किग्रा\n\n"
                    f"2. **पहला टॉप ड्रेसिंग (कल्ले फूटने के समय — रोपाई के 20-25 दिन बाद):**\n"
                    f"   - **यूरिया:** 50 किग्रा\n"
                    f"   - **जिंक सल्फेट (21%):** 10-12 किग्रा (खैरा रोग और पत्तियों पर जंग जैसे धब्बों की रोकथाम हेतु)।\n\n"
                    f"3. **दूसरा टॉप ड्रेसिंग (बालियां निकलने से पूर्व — रोपाई के 40-45 दिन बाद):**\n"
                    f"   - **यूरिया:** 25 किग्रा\n"
                    f"   - **MOP (पोटाश):** 15 किग्रा (दाने के भराव और तने की मजबूती के लिए)।\n\n"
                    f"### 💧 3. मौसम व जल प्रबंधन:\n"
                    f"- **वर्तमान मौसम:** {weather_temp}°C | {weather_rain}."
                )
                return text, sources

            else:
                # English
                soil_note = (
                    "Black soil (Clay Loam) has high water retention and native potash, but is slow in phosphorus availability and vulnerable to Zinc deficiency under waterlogged conditions."
                    if is_black_soil else
                    f"For {soil}, ensure balanced nutrient availability and adequate organic manure."
                )
                english_text = (
                    f"🌾 **Optimal N-P-K Fertilizer Schedule for Paddy (Rice) in {soil}**\n\n"
                    f"### 🧪 1. Recommended Optimal N-P-K Ratio:\n"
                    f"- **Standard Ratio:** **120 : 60 : 40 kg/ha** (Approx **50 kg Nitrogen : 25 kg Phosphorus : 15 kg Potash per acre**).\n"
                    f"- **Soil Context:** {soil_note}\n\n"
                    f"### 🗓️ 2. Split Application Schedule (Per Acre):\n"
                    f"1. **Basal Application (At Final Puddling / Transplanting):**\n"
                    f"   - **DAP:** 50 kg (or SSP 150 kg)\n"
                    f"   - **MOP (Potash):** 15 kg\n"
                    f"   - **Urea:** 25 kg (provides initial vegetative boost)\n"
                    f"   - *Rule:* Incorporate fertilizers into top 5 cm soil before planting.\n\n"
                    f"2. **First Top Dressing (Active Tillering Stage — 20 to 25 DAT):**\n"
                    f"   - **Urea:** 50 kg\n"
                    f"   - **Zinc Sulphate (21% Zn):** 10–12 kg (or 33% Chelated Zinc 6 kg/acre) — *Crucial in black soils to prevent Khaira disease & rusty leaf spots.*\n"
                    f"   - *Note:* Drain excess standing water before broadcasting urea; re-flood 24 hours later.\n\n"
                    f"3. **Second Top Dressing (Panicle Initiation Stage — 40 to 45 DAT):**\n"
                    f"   - **Urea:** 25 kg\n"
                    f"   - **MOP (Potash):** 15 kg (strengthens culms against lodging & boosts grain weight).\n\n"
                    f"### 💧 3. Live Weather & Water Precautions:\n"
                    f"- **Current Weather:** {weather_temp}°C | {weather_rain}.\n"
                    f"- Never broadcast urea when heavy rain is expected within 24 hours to prevent nutrient leaching.\n"
                    f"- Maintain a thin 2–3 cm water film during tillering rather than deep stagnant flooding in clayey black soils."
                )
                if lang not in ["en", "te", "hi"]:
                    english_text = localize_ai_response(english_text, lang)
                return english_text, sources

        elif "tomato" in crop or "టమాటా" in q_lower or "टमाटर" in q_lower:
            english_text = (
                f"🍅 **Optimal N-P-K Fertilizer Schedule for Tomato in {soil}**\n\n"
                f"### 🧪 1. Recommended Optimal N-P-K Ratio:\n"
                f"- **Standard Ratio:** **150 : 100 : 120 kg/ha** (Approx **60 kg Nitrogen : 40 kg Phosphorus : 50 kg Potash per acre**).\n\n"
                f"### 🗓️ 2. Step-by-Step Fertilizer Application:\n"
                f"1. **Basal Dose (During Bed Preparation):**\n"
                f"   - Well-decomposed FYM/Compost: 5–8 tonnes/acre\n"
                f"   - Single Super Phosphate (SSP): 150 kg/acre (100% P)\n"
                f"   - Urea: 25 kg + MOP: 25 kg\n"
                f"   - Neem Cake: 100 kg/acre (prevents root-knot nematodes).\n\n"
                f"2. **Vegetative Growth (20–25 DAT):** Top dress Urea 30 kg/acre.\n"
                f"3. **Flowering & Fruit Set (45 DAT):** Top dress Urea 25 kg + MOP 25 kg/acre.\n"
                f"4. **Foliar Nutrition:** Spray Calcium Nitrate (1%) + Boron (0.2%) during flowering to prevent Blossom End Rot and fruit cracking.\n\n"
                f"### 💧 3. Weather Alert:\n"
                f"- Current condition: {weather_temp}°C. Use drip fertigation if available for 30% higher nutrient uptake."
            )
            localized_response = localize_ai_response(english_text, target_language)
            return localized_response, sources

        elif "cotton" in crop or "పత్తి" in q_lower or "कपास" in q_lower:
            english_text = (
                f"🌱 **Optimal N-P-K Fertilizer Schedule for Cotton (Bt Cotton) in {soil}**\n\n"
                f"### 🧪 1. Recommended Optimal N-P-K Ratio:\n"
                f"- **Standard Ratio:** **120 : 60 : 60 kg/ha** (Approx **50 kg N : 25 kg P : 25 kg K per acre**).\n\n"
                f"### 🗓️ 2. Application Timing (Per Acre):\n"
                f"1. **Basal Dose (Sowing):** Full Phosphorus (SSP 150 kg) + 20% Nitrogen (Urea 20 kg) + 20% Potash (MOP 10 kg).\n"
                f"2. **Square Formation (45 DAS):** Urea 35 kg + MOP 15 kg.\n"
                f"3. **Peak Flowering & Boll Development (70–75 DAS):** Urea 35 kg + MOP 15 kg.\n"
                f"4. **Foliar Spray:** 1% Magnesium Sulphate + 1% 19:19:19 at 60 & 90 DAS to prevent leaf reddening."
            )
            localized_response = localize_ai_response(english_text, target_language)
            return localized_response, sources

        elif "chilli" in crop or "chili" in crop or "మిర్చి" in q_lower or "मिर्च" in q_lower:
            english_text = (
                f"🌶️ **Optimal N-P-K Fertilizer Schedule for Chilli in {soil}**\n\n"
                f"### 🧪 1. Recommended Optimal N-P-K Ratio:\n"
                f"- **Standard Ratio:** **150 : 80 : 80 kg/ha** (Approx **60 kg N : 35 kg P : 35 kg K per acre**).\n\n"
                f"### 🗓️ 2. Application Schedule:\n"
                f"1. **Basal:** Full P (SSP 200 kg) + 25% N (Urea 30 kg) + 25% K (MOP 20 kg) + 10 kg Sulphur.\n"
                f"2. **Top Dressing 1 (30 DAT):** Urea 35 kg + MOP 15 kg.\n"
                f"3. **Top Dressing 2 (60 DAT):** Urea 35 kg + MOP 15 kg.\n"
                f"4. **Top Dressing 3 (90 DAT):** Urea 25 kg + MOP 10 kg.\n"
                f"5. **Micronutrient:** Foliar spray of Zinc + Boron at flower initiation to reduce flower drop."
            )
            localized_response = localize_ai_response(english_text, target_language)
            return localized_response, sources

        elif "groundnut" in crop or "peanut" in crop or "వేరుశనగ" in q_lower or "मूंगफली" in q_lower:
            english_text = (
                f"🥜 **Optimal Fertilizer & Nutrition Schedule for Groundnut in {soil}**\n\n"
                f"### 🧪 1. Recommended N-P-K Ratio:\n"
                f"- **Ratio:** **20 : 40 : 40 kg/ha** (Approx **10 kg N : 20 kg P : 20 kg K per acre** — legumes fix their own Nitrogen).\n\n"
                f"### 🗓️ 2. Application Steps:\n"
                f"1. **Basal (At Sowing):** SSP 125 kg (provides P, Ca & S) + Urea 20 kg + MOP 25 kg.\n"
                f"2. **Crucial Gypsum Application (40–45 DAS at Pegging Stage):**\n"
                f"   - Apply **200 kg Gypsum/acre** near root zone and lightly incorporate.\n"
                f"   - *Why:* Calcium is critical for pod development and kernel filling; prevents 'pops' (empty pods)."
            )
            localized_response = localize_ai_response(english_text, target_language)
            return localized_response, sources

    # 2. CROP RECOMMENDATION & SOIL SUITABILITY
    if intent == "CROP_RECOMMENDATION" or "suggest crop" in q_lower or "which crop" in q_lower or "what crop" in q_lower:
        sources.append({
            "title": "State Agronomic Crop Suitability Matrix",
            "source": "Agro-Ecological Land Evaluation"
        })
        is_black = "black" in soil.lower() or "నల్ల" in soil.lower()
        if lang == "te":
            crops_list = (
                "1. **వరి (Paddy / Rice):** నీటి సదుపాయం ఉన్నప్పుడు ఖరీఫ్ సీజన్లో అధిక దిగుబడి ఇస్తుంది.\n"
                "2. **పత్తి (Bt Cotton):** నల్లరేగడి నేలలో తేమ నిల్వ వల్ల అత్యంత లాభదాయక వాణిజ్య పంట.\n"
                "3. **మిర్చి (Chilli):** ఎత్తైన బోదెలపై సాగు చేస్తే అధిక రాబడి.\n"
                "4. **మొక్కజొన్న (Maize):** తక్కువ ఖర్చుతో 100 రోజుల్లో ఖచ్చితమైన ఆదాయం."
                if is_black else
                "1. **వేరుశనగ (Groundnut):** తేలికపాటి నేలల్లో అత్యుత్తమ పంట.\n"
                "2. **టమాటా & కూరగాయలు:** డ్రిప్ ఇరిగేషన్‌తో అధిక లాభం.\n"
                "3. **చిరుధాన్యాలు (రాగి/సజ్జ):** తక్కువ నీటితో పండే పోషక పంటలు."
            )
            text = (
                f"🌾 **మీ ప్రాంతం & {soil} నేలకు అనుకూలమైన పంటల సిఫార్సు**\n\n"
                f"### 📍 పొలం వివరాలు:\n"
                f"- **నేల రకం:** {soil}\n"
                f"- **భూమి విస్తీర్ణం:** {farm_size}\n"
                f"- **వాతావరణం:** {weather_temp}°C | {weather_rain}\n\n"
                f"### 🏆 అనుకూలమైన ఉత్తమ పంటలు:\n{crops_list}\n\n"
                f"💡 *సలహా:* పెట్టుబడి పెట్టే ముందు KRISHI VISION సిమ్యులేటర్ ద్వారా రాబడిని అంచనా వేయండి."
            )
            return text, sources
        else:
            crops_list = (
                "1. **Paddy / Rice:** Highly productive during Kharif with regulated water.\n"
                "2. **Cotton (Bt Cotton):** Premium cash crop in black clay soil due to deep moisture retention.\n"
                "3. **Chilli / Spices:** High return crop on raised beds with proper drainage.\n"
                "4. **Maize / Corn:** Resilient 100-day crop with low risk and steady market demand."
                if is_black else
                "1. **Groundnut:** Excellent in well-drained loamy soils.\n"
                "2. **Tomato & Vegetables:** High-yielding with drip irrigation.\n"
                "3. **Millets (Ragi/Bajra):** Drought resilient with low input cost.\n"
                "4. **Pulses (Red Gram / Green Gram):** Enriches soil fertility."
            )
            english_text = (
                f"🌾 **Crop Recommendations Tailored for {farmer_context.get('location', 'Your Region')}**\n\n"
                f"### 📍 Farm Parameters:\n"
                f"- **Soil Type:** {soil}\n"
                f"- **Land Area:** {farm_size}\n"
                f"- **Current Weather:** {weather_temp}°C | {weather_rain}\n\n"
                f"### 🏆 Top Recommended Crops:\n{crops_list}\n\n"
                f"💡 *Tip:* Use KRISHI VISION Farm Future Simulator to simulate yield and ROI before sowing."
            )
            localized_response = localize_ai_response(english_text, target_language)
            return localized_response, sources

    # 3. IRRIGATION & WATER MANAGEMENT
    if intent == "IRRIGATION_WATER" or "water" in q_lower or "irrigation" in q_lower or "నీరు" in q_lower or "సిंचाई" in q_lower:
        sources.append({
            "title": "FAO-56 Water Management & Evapotranspiration Guidelines",
            "source": "Agricultural Water Resource Management"
        })
        english_text = (
            f"💧 **Irrigation & Water Management for {crop.capitalize()} in {soil}**\n\n"
            f"### 📊 Soil & Weather Moisture Assessment:\n"
            f"- **Soil Water Retention:** {soil} has high moisture retention capacity.\n"
            f"- **Weather Telemetry:** {weather_temp}°C | Forecast: {weather_rain}.\n\n"
            f"### 🛠️ Actionable Water Schedule:\n"
            f"1. **Critical Moisture Stages:** Ensure optimal soil moisture during flowering, tillering, and pod/grain development.\n"
            f"2. **Avoid Waterlogging:** Create 30 cm drainage channels at field boundaries to prevent root suffocation.\n"
            f"3. **Alternate Wetting & Drying (AWD):** For paddy, irrigate 2–3 days after disappearance of ponded water to save up to 30% water."
        )
        localized_response = localize_ai_response(english_text, target_language)
        return localized_response, sources

    # If RAG context is available and provides clear content, synthesize cleanly
    if rag_context and len(rag_context.strip()) > 50:
        sources.append({
            "title": "KRISHI AI Agricultural Knowledge Repository",
            "source": "Verified Agronomic Database"
        })
        english_text = (
            f"🌾 **Agricultural Advisory for {crop.capitalize()} ({soil})**\n\n"
            f"{rag_context.strip()}\n\n"
            f"### 🌦️ Local Field Weather Context:\n"
            f"- **Temperature:** {weather_temp}°C | **Next Rain:** {weather_rain}\n"
            f"- **Recommendation:** Apply fertilizers and sprays during calm morning or late afternoon hours."
        )
        localized_response = localize_ai_response(english_text, target_language)
        return localized_response, sources

    return None


async def stream_fast_tokens(text: str, chunk_size: int = 4) -> AsyncGenerator[str, None]:
    """
    Streams text in smooth, realistic token/word chunks with ultra-low latency (15ms).
    Gives instantaneous time-to-first-token in the frontend UI.
    """
    words = text.split(" ")
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i + chunk_size])
        if i + chunk_size < len(words):
            chunk += " "
        yield chunk
        await asyncio.sleep(0.015)
