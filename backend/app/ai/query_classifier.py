import re
from typing import Dict, Any, Optional, List

# Multilingual crop dictionary mapping normalized English names
CROP_MAP = {
    # Tomato
    "tomato": "tomato",
    "tomatoes": "tomato",
    "టమోటా": "tomato",
    "టమాటా": "tomato",
    "టమాట": "tomato",
    "టమోటో": "tomato",
    "टमाटर": "tomato",

    # Rice / Paddy
    "rice": "rice",
    "paddy": "rice",
    "వరి": "rice",
    "వరిసాగు": "rice",
    "ధాన్యం": "rice",
    "धान": "rice",
    "चावल": "rice",

    # Cotton
    "cotton": "cotton",
    "పత్తి": "cotton",
    "దూది": "cotton",
    "कपास": "cotton",

    # Chilli
    "chilli": "chilli",
    "chili": "chilli",
    "chillies": "chilli",
    "మిర్చి": "chilli",
    "మిరప": "chilli",
    "మిరపకాయ": "chilli",
    "मिर्च": "chilli",

    # Maize
    "maize": "maize",
    "corn": "maize",
    "మొక్కజొన్న": "maize",
    "मक्का": "maize",

    # Groundnut
    "groundnut": "groundnut",
    "peanut": "groundnut",
    "వేరుశనగ": "groundnut",
    "వేరుశెనగ": "groundnut",
    "मूंगफली": "groundnut",

    # Wheat
    "wheat": "wheat",
    "గోధుమ": "wheat",
    "గోధుమలు": "wheat",
    "गेहूं": "wheat",

    # Onion
    "onion": "onion",
    "onions": "onion",
    "ఉల్లిపాయ": "onion",
    "ఉల్లి": "onion",
    "प्याज": "onion",

    # Potato
    "potato": "potato",
    "potatoes": "potato",
    "బంగాళాదుంప": "potato",
    "आलू": "potato",

    # Sugarcane
    "sugarcane": "sugarcane",
    "చెరకు": "sugarcane",
    "गन्ना": "sugarcane"
}

# Symptom keywords
SYMPTOM_KEYWORDS = [
    "yellow", "yellowing", "spot", "spots", "curl", "curling", "wilt", "wilting",
    "rot", "rotting", "dry", "drying", "blight", "fungus", "mold", "rust",
    "burn", "burning", "hole", "holes", "drop", "dropping",
    # Telugu
    "పసుపు", "మచ్చలు", "ముడత", "వాడిపోవడం", "కుళ్ళు", "ఎండిపోవడం", "తెగులు",
    "రాలిపోవడం", "తుప్పు", "బూజు",
    # Hindi
    "पीला", "पीले", "धब्बा", "धब्बे", "मुरझाना", "सड़न", "सूखना", "झुलसा",
    "फफूंद", "गिरना"
]

# Pest keywords
PEST_KEYWORDS = [
    "pest", "pests", "insect", "insects", "worm", "worms", "bug", "bugs",
    "caterpillar", "borer", "aphid", "aphids", "whitefly", "thrips", "mite", "mites",
    # Telugu
    "పురుగు", "పురుగులు", "కీటకం", "కీటకాలు", "లద్దెపురుగు", "కాండం తొలిచే",
    "తేనెమంచు", "తెల్లదోమ", "పేనుబంక",
    # Hindi
    "कीट", "कीड़ा", "कीड़े", "इल्ली", "माहू", "सफेद मक्खी", "तना छेदक"
]

# Fertilizer / Soil keywords
FERTILIZER_SOIL_KEYWORDS = [
    "fertilizer", "fertilizers", "urea", "npk", "nitrogen", "potash", "phosphate",
    "manure", "compost", "soil fertility", "soil health", "soil test", "organic matter",
    # Telugu
    "ఎరువు", "ఎరువులు", "యూరియా", "నత్రజని", "భాస్వరం", "పొటాష్", "నేల సారం",
    "పశువుల ఎరువు", "సేంద్రియ",
    # Hindi
    "उर्वरक", "खाद", "यूरिया", "नाइट्रोजन", "पोटाश", "फास्फोरस", "मिट्टी की उर्वरता",
    "जैविक खाद"
]

# Irrigation / Water keywords
IRRIGATION_KEYWORDS = [
    "water", "irrigation", "watering", "drip", "sprinkler", "drainage",
    "reduce water", "water usage", "moisture",
    # Telugu
    "నీరు", "నీటి", "నీటిపారుదల", "బిందుసేద్యం", "మురుగునీరు", "తేమ",
    # Hindi
    "पानी", "सिंचाई", "ड्रिप", "जल निकास", "नमी"
]

# Simple definition inquiry indicators
DEFINITION_PREFIXES = [
    "what is", "what are", "what do you mean by", "define", "explain", "meaning of",
    "difference between", "why is",
    # Telugu
    "అంటే ఏమిటి", "అంటే ఏమిటీ", "వివరించండి", "ఎందుకు",
    # Hindi
    "क्या है", "किसे कहते हैं", "का अर्थ", "समझाएं"
]


# Crop Recommendation keywords
CROP_RECOMMENDATION_KEYWORDS = [
    "what crop", "which crop", "suggest crop", "crop suggestion", "crop suggest",
    "recommend crop", "crop recommendation", "what can i grow", "which crop should i grow",
    "what to sow", "best crop", "crop for my soil", "crop for my land", "suitable crop",
    "crop for my farm", "crops to plant", "crop selection", "recommend a crop",
    "what crops", "suggest for me", "crop can you suggest", "give me some crop names",
    "crop names for me", "crop names", "suggest some crops", "list crops", "crops for me",
    # Telugu
    "ఏ పంట", "ఏమి పంట", "ఏ పంట వేయాలి", "ఏ పంట సాగు", "పంట సూచన", "ఏ పంట మంచిది",
    "నా నేలకు ఏ పంట", "నా పొలానికి ఏ పంట", "ఏ పంట పండించాలి", "పంట ఎంపిక", "ఏ పంట లాభం",
    "పంట పేర్లు", "పంటల పేర్లు", "నాకు ఏ పంట",
    # Hindi
    "कौन सी फसल", "कौन सी खेती", "फसल सुझाव", "क्या बोएं", "मेरी जमीन के लिए फसल",
    "कौन सी फसल लगाएं", "उपयुक्त फसल", "फसलों के नाम", "फसल के नाम"
]

# Greeting keywords
GREETING_KEYWORDS = [
    "hi", "hello", "hey", "namaste", "namaskaram", "good morning", "good evening", "greetings",
    # Telugu
    "నమస్కారం", "నమస్తే", "హలో", "హాయ్", "బాగున్నారా", "ఎలా ఉన్నారు",
    # Hindi
    "नमस्ते", "नमस्कार", "हैलो", "प्रणाम"
]


def extract_crop(text: str) -> Optional[str]:
    """Identifies crop mentioned in user query."""
    text_lower = text.lower()
    for keyword, normalized_crop in CROP_MAP.items():
        if keyword in text_lower:
            return normalized_crop
    return None


def classify_query(text: str, farmer_crop: Optional[str] = None) -> Dict[str, Any]:
    """
    Analyzes farmer query and classifies into intent, crop, topic, and optimal token limit.
    """
    text_clean = text.strip()
    text_lower = text_clean.lower()
    cleaned_no_punct = re.sub(r'[^\w\s]', '', text_lower).strip()

    # 0. Greeting detection
    if cleaned_no_punct in GREETING_KEYWORDS or any(cleaned_no_punct == g for g in GREETING_KEYWORDS):
        return {
            "intent": "GREETING",
            "crop": None,
            "category": None,
            "max_tokens": 100,
            "needs_followup": False
        }

    has_crop_rec = any(k in text_lower for k in CROP_RECOMMENDATION_KEYWORDS)
    explicit_crop = extract_crop(text_clean)
    detected_crop = explicit_crop or (None if has_crop_rec else (farmer_crop.lower() if farmer_crop else None))

    has_symptom = any(k in text_lower for k in SYMPTOM_KEYWORDS)
    has_pest = any(k in text_lower for k in PEST_KEYWORDS)
    has_fertilizer = any(k in text_lower for k in FERTILIZER_SOIL_KEYWORDS)
    has_irrigation = any(k in text_lower for k in IRRIGATION_KEYWORDS)
    is_definition = any(p in text_lower for p in DEFINITION_PREFIXES)

    # 1. Crop Recommendation Inquiry
    if has_crop_rec:
        return {
            "intent": "CROP_RECOMMENDATION",
            "crop": explicit_crop,
            "category": "crop_selection",
            "max_tokens": None,
            "needs_followup": False
        }

    # 2. Simple informational / definition query
    if is_definition and not has_symptom and not has_pest:
        return {
            "intent": "SIMPLE_QUESTION",
            "crop": detected_crop,
            "category": "farm_management",
            "max_tokens": None,
            "needs_followup": False
        }

    # 2. Crop Disease / Health Symptom problem
    if has_symptom:
        if not detected_crop and len(text_clean.split()) < 6:
            # Vague symptom with no crop mentioned
            return {
                "intent": "INSUFFICIENT_INFO",
                "crop": None,
                "category": "diseases",
                "max_tokens": None,
                "needs_followup": True
            }
        return {
            "intent": "CROP_DISEASE_OR_SYMPTOM",
            "crop": detected_crop,
            "category": "diseases",
            "max_tokens": None,
            "needs_followup": False
        }

    # 3. Pest problem
    if has_pest:
        if not detected_crop and len(text_clean.split()) < 6:
            return {
                "intent": "INSUFFICIENT_INFO",
                "crop": None,
                "category": "pests",
                "max_tokens": None,
                "needs_followup": True
            }
        return {
            "intent": "PEST_PROBLEM",
            "crop": detected_crop,
            "category": "pests",
            "max_tokens": None,
            "needs_followup": False
        }

    # 4. Fertilizer / Soil Health query
    if has_fertilizer:
        return {
            "intent": "FERTILIZER_SOIL",
            "crop": detected_crop,
            "category": "fertilizers" if "fertilizer" in text_lower or "ఎరువు" in text_lower else "soil",
            "max_tokens": None,
            "needs_followup": False
        }

    # 5. Irrigation / Water query
    if has_irrigation:
        return {
            "intent": "IRRIGATION_WATER",
            "crop": detected_crop,
            "category": "irrigation",
            "max_tokens": None,
            "needs_followup": False
        }

    # 6. General Farming / Advice
    return {
        "intent": "GENERAL_FARMING",
        "crop": detected_crop,
        "category": "farm_management",
        "max_tokens": None,
        "needs_followup": False
    }
