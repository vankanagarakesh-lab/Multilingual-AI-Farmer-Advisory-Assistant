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
    Intelligent, personalized agricultural reasoning engine.
    
    Adheres to strict principles:
    1. NEVER display raw RAG text or markdown document titles to the farmer.
    2. Uses farmer profile context (location, soil, land area, crop, stage) and live weather telemetry.
    3. Never defaults to Rice/Paddy unless specifically requested or recorded in farmer profile.
    4. For crop suggestions, follows clean structured format with reasons and 'Best recommendation'.
    5. If essential parameters (like crop for fertilizer dosage) are missing, asks the farmer directly.
    """
    q_lower = query.lower()
    
    # 1. Extract and normalize farmer parameters
    location = farmer_context.get("location") or weather_context.get("location") or "Your Region"
    soil = (farmer_context.get("soil_type") or "").strip()
    soil_display = soil if soil else "Local Soil"
    farm_size = farmer_context.get("farm_size") or "Your Land"
    profile_crop = farmer_context.get("primary_crop") or None
    crop_stage = farmer_context.get("current_crop_stage") or None
    
    # Weather telemetry for reasoning
    w_temp = weather_context.get("temperature", 30)
    w_cond = weather_context.get("condition", "Partly Cloudy")
    w_rain_desc = weather_context.get("next_rain", "Clear in 48 hours")
    w_rain_chance = weather_context.get("rain_chance", 15)
    
    # Active query crop
    active_crop = (target_crop or profile_crop or "").lower().strip()
    
    lang = normalize_language_code(target_language)
    sources = []

    # =========================================================================
    # INTENT 1: CROP RECOMMENDATION & SELECTION
    # =========================================================================
    if (
        intent == "CROP_RECOMMENDATION" 
        or "crop name" in q_lower 
        or "crop names" in q_lower 
        or "which crop" in q_lower 
        or "what crop" in q_lower 
        or "suggest crop" in q_lower
        or "suggest for me" in q_lower
        or "what can i grow" in q_lower
        or "crops to plant" in q_lower
        or "suitable crop" in q_lower
        or "best crop" in q_lower
        or "ఏ పంట" in q_lower
        or "పంట పేర్లు" in q_lower
        or "పంటల పేర్లు" in q_lower
        or "ఫసల్" in q_lower
        or "कौन सी फसल" in q_lower
        or "फसलों के नाम" in q_lower
    ):
        sources.append({
            "title": "KRISHI AI Agro-Climatic Crop Matrix",
            "source": "State Agricultural University Guidelines"
        })

        is_black_soil = "black" in soil.lower() or "నల్ల" in soil.lower() or "काली" in soil.lower()
        is_red_soil = "red" in soil.lower() or "ఎర్ర" in soil.lower() or "लाल" in soil.lower()
        is_sandy_soil = "sand" in soil.lower() or "ఇసుక" in soil.lower() or "बलुई" in soil.lower()
        has_high_water = "canal" in str(farmer_context).lower() or "abundant" in str(farmer_context).lower()

        # Tailor specific crops based on soil and weather
        if is_black_soil:
            crop1_en = ("Cotton (Bt Cotton)", "Deep taproot system thrives in moisture-retaining black clay; high market value.")
            crop2_en = ("Chilli / Spices", "Excellent yields on raised beds; responds well to warm temperatures.")
            crop3_en = ("Maize (Corn) or Pulses", "Short 90-100 day duration, improves soil nitrogen, low water risk.")
            best_en = ("Cotton (Bt Cotton)", f"your {soil_display} in {location} has deep moisture retention capacity and the current temperature ({w_temp}°C) provides ideal vegetative growth conditions")
            
            crop1_te = ("పత్తి (Bt Cotton)", "నల్లరేగడి నేలలో తేమ నిల్వ వల్ల వేర్లు లోతుగా విస్తరించి అత్యధిక దిగుబడి మరియు మంచి మార్కెట్ ధర లభిస్తుంది.")
            crop2_te = ("మిర్చి (Chilli)", "ఎత్తైన బోదెలపై సాగు చేస్తే నల్లరేగడి నేలకు అనుకూలం; ఉష్ణోగ్రతలకు మంచి ఫలితాలు ఇస్తుంది.")
            crop3_te = ("మొక్కజొన్న లేదా పప్పుధాన్యాలు (మినుము/పెసర)", "90-100 రోజుల్లో తక్కువ నీటితో ఖచ్చితమైన ఆదాయం మరియు నేల సారం పెరుగుతుంది.")
            best_te = ("పత్తి (Bt Cotton)", f"మీ {location} ప్రాంతంలోని {soil_display} నేలలో తేమ నిల్వ సామర్థ్యం ఎక్కువగా ఉండటం మరియు ప్రస్తుత వాతావరణం ({w_temp}°C) ఈ పంటకు చాలా అనుకూలంగా ఉండటం")

            crop1_hi = ("कपास (Bt Cotton)", "काली मिट्टी की नमी धारण क्षमता कपास की गहरी जड़ों के लिए आदर्श है और अच्छा बाजार भाव मिलता है।")
            crop2_hi = ("मिर्च (Chilli)", "उठी हुई क्यारियों पर उच्च उत्पादन देती है और गर्म मौसम में अच्छा विकास होता है।")
            crop3_hi = ("मक्का या दलहन (चना/उड़द)", "कम पानी और 90-100 दिनों में तैयार होकर मिट्टी की उर्वरता बढ़ाती है।")
            best_hi = ("कपास (Bt Cotton)", f"{location} में आपकी {soil_display} में नमी संचयन क्षमता अधिक है और वर्तमान तापमान ({w_temp}°C) इसके विकास के लिए सर्वोत्तम है")

        elif is_red_soil or is_sandy_soil:
            crop1_en = ("Groundnut (Peanut)", "Thrives in well-drained, friable red/sandy soil with high pod development.")
            crop2_en = ("Tomato / Vegetables", "Quick yielding 70-80 day cash crop; highly productive with drip irrigation.")
            crop3_en = ("Finger Millet (Ragi) / Bajra", "Extremely drought-resilient with minimal fertilizer and water requirement.")
            best_en = ("Groundnut", f"friable {soil_display} allows easy peg penetration and pod filling with minimal waterlogging risk")

            crop1_te = ("వేరుశనగ (Groundnut)", "తేలికపాటి ఎర్ర/ఇసుక నేలల్లో ఊడలు సులభంగా దిగి నాణ్యమైన కాయలు ఏర్పడతాయి.")
            crop2_te = ("టమాటా & కూరగాయలు", "70-80 రోజుల్లో చేతికి వచ్చే స్వల్పకాలిక వాణిజ్య పంట; డ్రిప్ ద్వారా అధిక రాబడి.")
            crop3_te = ("రాగి / సజ్జ (Millets)", "తక్కువ నీరు, తక్కువ ఖర్చుతో పండే పోషక విలువలు గల దృఢమైన పంట.")
            best_te = ("వేరుశనగ", f"మీ {soil_display} నేల వదులుగా ఉండి ఊడలు దిగడానికి అత్యంత అనుకూలం మరియు తక్కువ నీటితో అధిక దిగుబడి సాధించవచ్చు")

            crop1_hi = ("मूंगफली (Groundnut)", "हल्की लाल/बलुई मिट्टी में फलियां अच्छी तरह बैठती हैं और जलभराव का खतरा नहीं रहता।")
            crop2_hi = ("टमाटर व मौसमी सब्जियां", "ड्रिप सिंचाई के साथ 70-80 दिनों में तैयार होने वाली नकदी फसल।")
            crop3_hi = ("रागी / बाजरा (मोटे अनाज)", "कम पानी और कम लागत में उच्च पोषण देने वाली सुरक्षित फसल।")
            best_hi = ("मूंगफली", f"आपकी {soil_display} मिट्टी में फलियां आसानी से विकसित होती हैं और कम पानी में भी बढ़िया पैदावार मिलती है")

        else:
            # General / Diverse agricultural profile
            crop1_en = ("Groundnut or Maize", f"Reliable staple crops suited to {location} climate with steady market demand.")
            crop2_en = ("Tomato / Chilli", "High-value commercial crops with regular picking intervals.")
            crop3_en = ("Pulses (Red Gram / Green Gram)", "Low investment, drought tolerant, enriches field nitrogen.")
            best_en = ("Groundnut / Pulses", f"balanced input costs, short growing cycle, and low weather sensitivity in {location}")

            crop1_te = ("వేరుశనగ లేదా మొక్కజొన్న", f"{location} వాతావరణానికి అనుకూలమైన మరియు స్థిరమైన మార్కెట్ గల పంటలు.")
            crop2_te = ("టమాటా / మిర్చి", "నిరంతర ఆదాయాన్ని ఇచ్చే లాభదాయక వాణిజ్య కూరగాయ పంటలు.")
            crop3_te = ("పప్పుధాన్యాలు (కంది/మినుము)", "తక్కువ పెట్టుబడితో నేల సారాన్ని పెంచే సహజ పంటలు.")
            best_te = ("వేరుశనగ / పప్పుధాన్యాలు", f"{location} ప్రాంత వాతావరణ పరిస్థితులకు తక్కువ రిస్క్ మరియు స్థిరమైన నికర లాభం ఉండటం")

            crop1_hi = ("मूंगफली या मक्का", f"{location} के मौसम के अनुकूल और सुरक्षित बाजार मांग वाली फसलें।")
            crop2_hi = ("टमाटर / मिर्च", "नियमित आय देने वाली उच्च मूल्य की नकदी फसलें।")
            crop3_hi = ("दलहन (अरहर/मूंग)", "कम लागत में मिट्टी को उपजाऊ बनाने वाली सुरक्षित फसलें।")
            best_hi = ("मूंगफली / दलहन", f"{location} की जलवायु में कम जोखिम और स्थिर मुनाफा देने वाली फसल है")

        # Format output cleanly matching user's exact specification
        if lang == "te":
            soil_text = f"నేల రకం: {soil}" if soil else "స్థానిక నేల"
            resp = (
                f"మీ ప్రాంతం ({location}), {soil_text}, ప్రస్తుత ఉష్ణోగ్రత ({w_temp}°C) మరియు వాతావరణ పరిస్థితుల ఆధారంగా, మీకు ఈ క్రింది పంటలు అనుకూలంగా ఉంటాయి:\n\n"
                f"1. **{crop1_te[0]}** – {crop1_te[1]}\n"
                f"2. **{crop2_te[0]}** – {crop2_te[1]}\n"
                f"3. **{crop3_te[0]}** – {crop3_te[1]}\n\n"
                f"**ఉత్తమ సిఫార్సు:** **{best_te[0]}**, ఎందుకంటే {best_te[1]}."
            )
            return resp, sources

        elif lang == "hi":
            soil_text = f"मिट्टी: {soil}" if soil else "स्थानीय मिट्टी"
            resp = (
                f"आपके स्थान ({location}), {soil_text}, वर्तमान मौसम ({w_temp}°C) और पानी की उपलब्धता के आधार पर, आपके लिए ये फसलें उपयुक्त हो सकती हैं:\n\n"
                f"1. **{crop1_hi[0]}** – {crop1_hi[1]}\n"
                f"2. **{crop2_hi[0]}** – {crop2_hi[1]}\n"
                f"3. **{crop3_hi[0]}** – {crop3_hi[1]}\n\n"
                f"**सर्वोत्तम सुझाव:** **{best_hi[0]}**, क्योंकि {best_hi[1]}।"
            )
            return resp, sources

        else:
            soil_text = f"soil ({soil})" if soil else "local soil conditions"
            resp = (
                f"Based on your location ({location}), {soil_text}, current weather ({w_temp}°C, {w_cond}) and water availability, these crops may be suitable for you:\n\n"
                f"1. **{crop1_en[0]}** – {crop1_en[1]}\n"
                f"2. **{crop2_en[0]}** – {crop2_en[1]}\n"
                f"3. **{crop3_en[0]}** – {crop3_en[1]}\n\n"
                f"**Best recommendation:** **{best_en[0]}** because {best_en[1]}."
            )
            if lang not in ["en", "te", "hi"]:
                resp = localize_ai_response(resp, lang)
            return resp, sources

    # =========================================================================
    # INTENT 2: FERTILIZER / NPK / SOIL HEALTH ADVISORY
    # =========================================================================
    if (
        "npk" in q_lower 
        or "fertilizer" in q_lower 
        or "fertilizers" in q_lower 
        or "urea" in q_lower 
        or "ratio" in q_lower 
        or "dosage" in q_lower
        or "dose" in q_lower
        or "ఎరువు" in q_lower
        or "నత్రజని" in q_lower
        or "భాస్వరం" in q_lower
        or "యూరియా" in q_lower
        or "खाद" in q_lower
        or "उर्वरक" in q_lower
        or intent == "FERTILIZER_SOIL"
    ):
        sources.append({
            "title": "Integrated Nutrient Management Guidelines",
            "source": "State Agronomic Formulations"
        })

        # Check if crop is identified
        is_rice = "rice" in active_crop or "paddy" in active_crop or "వరి" in q_lower or "धान" in q_lower or "चावल" in q_lower
        is_cotton = "cotton" in active_crop or "పత్తి" in q_lower or "कपास" in q_lower
        is_tomato = "tomato" in active_crop or "టమాటా" in q_lower or "टमाटर" in q_lower
        is_chilli = "chilli" in active_crop or "chili" in active_crop or "మిర్చి" in q_lower or "मिर्च" in q_lower
        is_groundnut = "groundnut" in active_crop or "peanut" in active_crop or "వేరుశనగ" in q_lower or "मूंगफली" in q_lower
        is_maize = "maize" in active_crop or "corn" in active_crop or "మొక్కజొన్న" in q_lower or "मक्का" in q_lower

        # If NO crop is mentioned and NO profile crop exists, ask the farmer directly
        if not (is_rice or is_cotton or is_tomato or is_chilli or is_groundnut or is_maize):
            if lang == "te":
                return (
                    f"మీరు ఏ పంటకు ఎరువుల మోతాదు తెలుసుకోవాలనుకుంటున్నారు? "
                    f"దయచేసి మీ పంట పేరు (ఉదాహరణకు: వరి, పత్తి, మిర్చి, టమాటా, వేరుశనగ లేదా మొక్కజొన్న) మరియు పంట ప్రస్తుత దశను తెలియజేయండి. "
                    f"దాని ఆధారంగా మీ {soil_display} నేలకు సరిపోయే ఖచ్చితమైన N-P-K ఎరువుల ప్రణాళికను తెలియజేస్తాను."
                ), sources
            elif lang == "hi":
                return (
                    f"आप किस फसल के लिए उर्वरक (खाद) की खुराक जानना चाहते हैं? "
                    f"कृपया अपनी फसल का नाम (जैसे: धान, कपास, मिर्च, टमाटर, मूंगफली या मक्का) और वर्तमान अवस्था बताएं, "
                    f"ताकि मैं आपकी {soil_display} मिट्टी के अनुसार सटीक N-P-K उर्वरक प्रबंधन बता सकूं।"
                ), sources
            else:
                return (
                    f"Which crop are you cultivating? Please specify your crop name (e.g. Paddy, Cotton, Chilli, Tomato, Groundnut, or Maize) and current growth stage, "
                    f"so I can provide the exact N-P-K fertilizer dosage and schedule tailored for your {soil_display} in {location}."
                ), sources

        # PADDY / RICE SPECIFIC FERTILIZER SCHEDULE
        if is_rice:
            soil_context = f"in {soil_display}" if soil else "for your field"
            if lang == "te":
                resp = (
                    f"🌾 **{location} ప్రాంతంలో వరి పంటకు సిఫార్సు చేసిన N-P-K ఎరువుల యాజమాన్యం ({soil_display})**\n\n"
                    f"**1. సిఫార్సు చేసిన N-P-K నిష్పత్తి:**\n"
                    f"- **120 : 60 : 40 కిలోలు/హెక్టారుకు** (ఎకరానికి సుమారు **50 కిలోల నత్రజని : 25 కిలోల భాస్వరం : 15 కిలోల పొటాష్**).\n\n"
                    f"**2. దశలవారీ ఎరువుల మోతాదు (ఎకరానికి):**\n"
                    f"- **ఆఖరి దమ్ము సమయంలో (Basal):** 100% భాస్వరం (DAP 50 కిలోలు లేదా SSP 150 కిలోలు) + 50% పొటాష్ (MOP 15 కిలోలు) + 25% యూరియా (25 కిలోలు).\n"
                    f"- **పిలకల దశ (నాటిన 20-25 రోజులకు):** యూరియా 50 కిలోలు + జింక్ సల్ఫేట్ 10–12 కిలోలు (ఖైరా తెగులు నివారణకు).\n"
                    f"- **పొట్ట దశ (నాటిన 40-45 రోజులకు):** యూరియా 25 కిలోలు + మిగిలిన పొటాష్ (MOP) 15 కిలోలు (గింజ బరువుకు).\n\n"
                    f"💡 *వాతావరణ సూచన:* ప్రస్తుత ఉష్ణోగ్రత {w_temp}°C. యూరియా వేసే ముందు పొలంలో నీటిని తగ్గించి, వేసిన 24 గంటల తర్వాత పలుచటి నీరు పెట్టండి."
                )
                return resp, sources
            elif lang == "hi":
                resp = (
                    f"🌾 **धान (चावल) के लिए अनुशंसित N-P-K उर्वरक प्रबंधन ({soil_display})**\n\n"
                    f"**1. मानक N-P-K अनुपात:**\n"
                    f"- **120 : 60 : 40 किग्रा/हेक्टेयर** (लगभग **50 किग्रा नाइट्रोजन : 25 किग्रा फास्फोरस : 15 किग्रा पोटाश प्रति एकड़**)।\n\n"
                    f"**2. चरणबद्ध अनुप्रयोग (प्रति एकड़):**\n"
                    f"- **अंतिम जुताई / रोपाई के समय:** DAP 50 किग्रा (या SSP 150 किग्रा) + MOP (पोटाश) 15 किग्रा + यूरिया 25 किग्रा।\n"
                    f"- **कल्ले फूटते समय (रोपाई के 20-25 दिन):** यूरिया 50 किग्रा + जिंक सल्फेट 10-12 किग्रा।\n"
                    f"- **बालियां निकलने से पूर्व (रोपाई के 40-45 दिन):** यूरिया 25 किग्रा + MOP (पोटाश) 15 किग्रा।\n\n"
                    f"💡 *मौसम सुझाव:* वर्तमान तापमान {w_temp}°C है। यूरिया छिड़कने से पहले खेत से अतिरिक्त पानी निकाल दें।"
                )
                return resp, sources
            else:
                resp = (
                    f"🌾 **Optimal N-P-K Fertilizer Schedule for Paddy (Rice) {soil_context}**\n\n"
                    f"**1. Recommended N-P-K Ratio:**\n"
                    f"- **120 : 60 : 40 kg/ha** (Approx **50 kg Nitrogen : 25 kg Phosphorus : 15 kg Potash per acre**).\n\n"
                    f"**2. Split Application Schedule (Per Acre):**\n"
                    f"- **Basal Dose (Final Puddling / Transplanting):** DAP 50 kg (or SSP 150 kg) + MOP 15 kg + Urea 25 kg.\n"
                    f"- **First Top Dressing (Tillering Stage, 20-25 DAT):** Urea 50 kg + Zinc Sulphate (21%) 10–12 kg (prevents Khaira disease).\n"
                    f"- **Second Top Dressing (Panicle Initiation, 40-45 DAT):** Urea 25 kg + MOP 15 kg (enhances grain filling and stem strength).\n\n"
                    f"💡 *Field Note:* Current temperature is {w_temp}°C. Drain standing water before applying urea; re-flood with shallow water 24 hours later."
                )
                return resp, sources

        # COTTON FERTILIZER
        elif is_cotton:
            if lang == "te":
                resp = (
                    f"🌱 **పత్తి (Bt Cotton) పంటకు ఎరువుల యాజమాన్యం ({soil_display})**\n\n"
                    f"**1. N-P-K నిష్పత్తి:** **120 : 60 : 60 కిలోలు/హెక్టారుకు** (ఎకరానికి **50 కిలోల N : 25 కిలోల P : 25 కిలోల K**).\n"
                    f"**2. దఫాలవారీ పట్టిక (ఎకరానికి):**\n"
                    f"- **విత్తే సమయంలో (Basal):** SSP 150 కిలోలు + యూరియా 20 కిలోలు + పొటాష్ 10 కిలోలు.\n"
                    f"- **పూత / కాయ దశ (45 & 75 రోజులకు):** యూరియా 35 కిలోలు + పొటాష్ 15 కిలోలు రెండు సమభాగాలుగా వేయాలి.\n"
                    f"- **ఆకులు ఎర్రబడకుండా:** 1% మెగ్నీషియం సల్ఫేట్ పిచికారీ చేయండి."
                )
                return resp, sources
            else:
                resp = (
                    f"🌱 **Optimal N-P-K Fertilizer Schedule for Cotton ({soil_display})**\n\n"
                    f"**1. Recommended N-P-K Ratio:** **120 : 60 : 60 kg/ha** (Approx **50 kg N : 25 kg P : 25 kg K per acre**).\n"
                    f"**2. Split Application Schedule:**\n"
                    f"- **Basal Dose (Sowing):** Full Phosphorus (SSP 150 kg) + Urea 20 kg + MOP 10 kg.\n"
                    f"- **Square & Boll Stages (45 & 75 DAS):** Apply Urea 35 kg + MOP 15 kg in 2 splits.\n"
                    f"- **Foliar Spray:** 1% Magnesium Sulphate + 1% 19:19:19 to prevent leaf reddening."
                )
                return resp, sources

        # TOMATO FERTILIZER
        elif is_tomato:
            if lang == "te":
                resp = (
                    f"🍅 **టమాటా పంటకు ఎరువుల యాజమాన్యం ({soil_display})**\n\n"
                    f"**1. N-P-K నిష్పత్తి:** **150 : 100 : 120 కిలోలు/హెక్టారుకు** (ఎకరానికి **60 : 40 : 50 కిలోలు**).\n"
                    f"**2. యాజమాన్యం:**\n"
                    f"- **నాటే ముందు:** ఎకరానికి 5-8 టన్నుల పశువుల ఎరువు + SSP 150 కిలోలు + యూరియా 25 కిలోలు + పొటాష్ 25 కిలోలు.\n"
                    f"- **మేత ఎరువులు:** నాటిన 20 మరియు 45 రోజులకు యూరియా 30 కిలోలు మరియు పొటాష్ వేయాలి.\n"
                    f"- **కాయ కుళ్లు నివారణకు:** పూత సమయంలో కాల్షియం నైట్రేట్ (1%) మరియు బోరాన్ (0.2%) పిచికారీ చేయండి."
                )
                return resp, sources
            else:
                resp = (
                    f"🍅 **Optimal N-P-K Fertilizer Schedule for Tomato ({soil_display})**\n\n"
                    f"**1. Recommended Ratio:** **150 : 100 : 120 kg/ha** (Approx **60 kg N : 40 kg P : 50 kg K per acre**).\n"
                    f"**2. Application Schedule:**\n"
                    f"- **Basal Dose:** FYM 5 tonnes + SSP 150 kg + Urea 25 kg + MOP 25 kg.\n"
                    f"- **Vegetative & Flowering (20 & 45 DAT):** Top dress Urea 30 kg and MOP in splits.\n"
                    f"- **Foliar Spray:** Spray Calcium Nitrate (1%) + Boron (0.2%) at flowering to prevent Blossom End Rot and fruit cracking."
                )
                return resp, sources

    # =========================================================================
    # INTENT 3: IRRIGATION & WATER ADVISORY
    # =========================================================================
    if intent == "IRRIGATION_WATER" or "irrigation" in q_lower or "watering" in q_lower or "నీరు" in q_lower or "సిंचाई" in q_lower:
        sources.append({
            "title": "FAO-56 Irrigation Management Guidelines",
            "source": "Agricultural Water Resource Management"
        })
        crop_name = active_crop.capitalize() if active_crop else "your crop"
        if lang == "te":
            resp = (
                f"💧 **{crop_name} పంటకు నీటి యాజమాన్యం ({soil_display})**\n\n"
                f"- **నేల స్వభావం:** మీ {soil_display} నేల నీటిని నిల్వ ఉంచే సామర్థ్యాన్ని పరిగణనలోకి తీసుకుని నీరు అందించాలి.\n"
                f"- **వాతావరణ పరిశీలన:** ప్రస్తుత ఉష్ణోగ్రత {w_temp}°C. {w_rain_desc}.\n\n"
                f"**సూచనలు:**\n"
                f"1. పూత మరియు గింజ/కాయ తయారయ్యే కీలక దశల్లో నేలలో తగినంత తేమ ఉండేలా చూడండి.\n"
                f"2. నీరు నిల్వ ఉంటే వేరుకుళ్లు వచ్చే ప్రమాదం ఉన్నందున పొలం చుట్టూ మురుగు కాలువలు తీయండి.\n"
                f"3. వర్ష సూచన ఉన్న సమయాల్లో అదనపు నీటి తడులు ఇవ్వడం ఆపండి."
            )
            return resp, sources
        else:
            resp = (
                f"💧 **Irrigation & Water Schedule for {crop_name} ({soil_display})**\n\n"
                f"- **Soil Drainage & Retention:** {soil_display} in {location} requires managed watering to avoid root suffocation.\n"
                f"- **Live Weather:** {w_temp}°C with {w_rain_desc}.\n\n"
                f"**Actionable Guidelines:**\n"
                f"1. Ensure continuous light moisture during critical growth stages (flowering and pod/grain filling).\n"
                f"2. Maintain active field drainage to prevent waterlogging during heavy downpours.\n"
                f"3. If drip irrigation is installed, operate in early morning hours to minimize evaporative losses."
            )
            return resp, sources

    return None


async def stream_fast_tokens(text: str, chunk_size: int = 4) -> AsyncGenerator[str, None]:
    """
    Streams text in smooth, realistic word chunks with ultra-low latency (15ms).
    Gives instantaneous time-to-first-token in the frontend UI.
    """
    words = text.split(" ")
    for i in range(0, len(words), chunk_size):
        chunk = " ".join(words[i:i + chunk_size])
        if i + chunk_size < len(words):
            chunk += " "
        yield chunk
        await asyncio.sleep(0.015)
