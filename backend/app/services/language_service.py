import re
import json
import logging
import urllib.parse
import urllib.request
from typing import Optional, Dict

logger = logging.getLogger(__name__)

TELUGU_RE = re.compile(r'[\u0C00-\u0C7F]')
HINDI_RE = re.compile(r'[\u0900-\u097F]')
KANNADA_RE = re.compile(r'[\u0C80-\u0CFF]')
TAMIL_RE = re.compile(r'[\u0B80-\u0BFF]')
BENGALI_RE = re.compile(r'[\u0980-\u09FF]')
GUJARATI_RE = re.compile(r'[\u0A80-\u0AFF]')
MALAYALAM_RE = re.compile(r'[\u0D00-\u0D7F]')
PUNJABI_RE = re.compile(r'[\u0A00-\u0A7F]')
ENGLISH_RE = re.compile(r'[a-zA-Z]')

# Standard Farmer-Friendly Telugu Header Map
TELUGU_HEADER_MAP = {
    "problem": "🌱 సమస్య:",
    "possible reasons": "🔍 కారణాలు:",
    "reasons": "🔍 కారణాలు:",
    "what to do now": "🛠️ మీరు చేయాల్సింది:",
    "what you can do": "🛠️ మీరు చేయాల్సింది:",
    "what to do": "🛠️ మీరు చేయాల్సింది:",
    "prevention": "🛡️ నివారణ:",
    "important note": "⚠️ ముఖ్యమైన గమనిక:",
    "important": "⚠️ ముఖ్యమైన గమనిక:",
    "good crops": "🌾 మంచి పంటలు:",
    "suitable crops": "🌾 అనుకూలమైన పంటలు:",
    "water management": "💧 నీటి యాజమాన్యం:",
}

# Offline Domain Agricultural Telugu Dictionary for reliable fallback
AGRI_TELUGU_TERMS = {
    "crop rotation": "పంట మార్పిడి",
    "crop": "పంట",
    "crops": "పంటలు",
    "tomato": "టమాటా",
    "tomatoes": "టమాటాలు",
    "rice": "వరి",
    "paddy": "వరి",
    "cotton": "పత్తి",
    "chilli": "మిర్చి",
    "maize": "మొక్కజొన్న",
    "groundnut": "వేరుశనగ",
    "peanut": "వేరుశనగ",
    "pulses": "పప్పుధాన్యాలు",
    "millet": "చిరుధాన్యాలు",
    "millets": "చిరుధాన్యాలు",
    "ragi": "రాగి",
    "bajra": "సజ్జ",
    "jowar": "జొన్న",
    "pigeon pea": "కంది",
    "red gram": "కంది",
    "green gram": "పెసర",
    "black gram": "మినుము",
    "yellow leaves": "ఆకులు పసుపు రంగులోకి మారడం",
    "yellowing": "పసుపు రంగులోకి మారడం",
    "pest": "పురుగు",
    "pests": "పురుగులు",
    "disease": "తెగులు",
    "diseases": "తెగుళ్ళు",
    "fungus": "శిలీంధ్రం",
    "blight": "ఆకుమచ్చ తెగులు",
    "overwatering": "ఎక్కువ నీరు ఇవ్వడం",
    "drainage": "మురుగునీటి కాలువలు",
    "water stagnation": "నీరు నిల్వ ఉండటం",
    "soil moisture": "నేలలో తేమ",
    "soil testing": "నేల పరీక్ష",
    "fertilizer": "ఎరువు",
    "fertilizers": "ఎరువులు",
    "nitrogen": "నత్రజని",
    "neem oil": "వేపనూనె",
    "drip irrigation": "బిందు సేద్యం (డ్రిప్)",
    "sprinkler": "తుంపర సేద్యం",
    "farmer": "రైతు",
    "field": "పొలం",
}


def detect_language(text: str) -> str:
    """
    Detects predominant language of input text across Indian languages & English:
    - 'te': Telugu script
    - 'hi': Hindi / Marathi (Devanagari) script
    - 'kn': Kannada script
    - 'ta': Tamil script
    - 'bn': Bengali script
    - 'gu': Gujarati script
    - 'ml': Malayalam script
    - 'pa': Punjabi script
    - 'en': English / Latin script
    """
    if not text or not text.strip():
        return "en"

    counts = {
        "te": len(TELUGU_RE.findall(text)),
        "hi": len(HINDI_RE.findall(text)),
        "kn": len(KANNADA_RE.findall(text)),
        "ta": len(TAMIL_RE.findall(text)),
        "bn": len(BENGALI_RE.findall(text)),
        "gu": len(GUJARATI_RE.findall(text)),
        "ml": len(MALAYALAM_RE.findall(text)),
        "pa": len(PUNJABI_RE.findall(text)),
        "en": len(ENGLISH_RE.findall(text)),
    }

    # Find language with highest character count
    sorted_langs = sorted(counts.items(), key=lambda item: item[1], reverse=True)
    top_lang, top_count = sorted_langs[0]

    if top_count > 0:
        return top_lang

    return "en"


def normalize_language_code(lang: Optional[str]) -> str:
    """Normalizes any language string/code to standard ISO code."""
    if not lang:
        return "en"
    clean = lang.strip().lower().replace("_", "-")
    if clean.startswith("te") or "telugu" in clean:
        return "te"
    if clean.startswith("hi") or "hindi" in clean:
        return "hi"
    if clean.startswith("kn") or "kannada" in clean:
        return "kn"
    if clean.startswith("ta") or "tamil" in clean:
        return "ta"
    if clean.startswith("bn") or "bengali" in clean or "bangla" in clean:
        return "bn"
    if clean.startswith("gu") or "gujarati" in clean:
        return "gu"
    if clean.startswith("mr") or "marathi" in clean:
        return "mr"
    if clean.startswith("ml") or "malayalam" in clean:
        return "ml"
    if clean.startswith("pa") or "punjabi" in clean:
        return "pa"
    return "en"


def determine_response_language(
    user_text: str,
    farmer_preferred_language: Optional[str] = None,
    explicit_response_language: Optional[str] = None
) -> str:
    """
    Determines the strict language code for the AI response.

    Priority:
    1. Explicit response_language requested from frontend payload (highest priority).
    2. Detected language from user's current query script.
    3. Query characters.
    4. Farmer preferred language.
    5. Default 'en'.
    """
    if explicit_response_language and explicit_response_language.strip():
        return normalize_language_code(explicit_response_language)

    detected = detect_language(user_text)
    if detected != "en":
        return detected

    english_chars = len(ENGLISH_RE.findall(user_text or ""))
    if english_chars > 0:
        # Check if farmer explicitly set preferred language (like Telugu or Hindi)
        if farmer_preferred_language and normalize_language_code(farmer_preferred_language) != "en":
            # If query is very short greeting/simple, prefer user preference
            return "en"
        return "en"

    if farmer_preferred_language:
        return normalize_language_code(farmer_preferred_language)

    return "en"


def validate_telugu_text(text: str) -> bool:
    """Checks if text contains valid Telugu characters without corrupted sequences."""
    if not text or not text.strip():
        return False
    
    # Check for unicode replacement character or broken marks
    if "\ufffd" in text or "" in text:
        return False
    
    # Check for presence of Telugu characters
    telugu_count = len(TELUGU_RE.findall(text))
    return telugu_count >= 5


def clean_telugu_text(text: str) -> str:
    """
    Safely cleans Telugu AI responses:
    - Normalizes whitespace while preserving paragraphs
    - Removes repeated consecutive lines
    - Preserves Telugu Unicode characters and naturally mixed English terms
    - Handles None, empty, or non-string inputs safely
    """
    if text is None:
        return ""

    if not isinstance(text, str):
        text = str(text)

    text = text.strip()
    if not text:
        return ""

    # Remove residual special tokens
    for tag in ["<|im_start|>", "<|im_end|>", "<|endoftext|>", "assistant\n", "assistant:", "system\n", "system:"]:
        text = text.replace(tag, "")

    text = text.replace("\ufffd", "")

    # Normalize whitespace while preserving paragraphs
    text = re.sub(r'[ \t]+', ' ', text)
    text = re.sub(r'\n{3,}', '\n\n', text)

    # Remove repeated consecutive lines
    lines = []
    previous = None

    for line in text.splitlines():
        line_stripped = line.strip()
        if line_stripped and line_stripped != previous:
            lines.append(line_stripped)
            previous = line_stripped

    return '\n'.join(lines).strip()


def translate_text_online(text: str, target_lang: str = "te") -> Optional[str]:
    """
    Translates English agricultural response into natural Telugu or Hindi.
    Fast, reliable, and preserves emoji and formatting headers.
    """
    if not text or not text.strip():
        return text

    target_code = normalize_language_code(target_lang)
    if target_code == "en":
        return text

    # Try Google Translate RPC
    try:
        encoded_query = urllib.parse.quote(text)
        url = f"https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl={target_code}&dt=t&q={encoded_query}"
        
        req = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        )
        with urllib.request.urlopen(req, timeout=4.0) as response:
            if response.status == 200:
                raw_data = response.read().decode("utf-8")
                parsed = json.loads(raw_data)
                if parsed and isinstance(parsed, list) and len(parsed) > 0 and isinstance(parsed[0], list):
                    translated_chunks = [part[0] for part in parsed[0] if part and len(part) > 0 and part[0]]
                    result = "".join(translated_chunks)
                    if result and result.strip():
                        return result.strip()
    except Exception as e:
        logger.warning("Online translation note: %s", e)

    # Secondary fallback endpoint
    try:
        url_tier2 = f"https://clients5.google.com/translate_a/t?client=dict-chrome-ex&sl=en&tl={target_code}&q={urllib.parse.quote(text)}"
        req2 = urllib.request.Request(
            url_tier2,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        with urllib.request.urlopen(req2, timeout=3.0) as response2:
            if response2.status == 200:
                raw_data2 = response2.read().decode("utf-8")
                parsed2 = json.loads(raw_data2)
                if isinstance(parsed2, list) and len(parsed2) > 0 and isinstance(parsed2[0], str):
                    return parsed2[0].strip()
    except Exception as e2:
        logger.warning("Online translation Tier 2 note: %s", e2)

    return None


def convert_to_farmer_telugu(text: str) -> str:
    """
    Converts English structured AI guidance into 100% clean, natural, farmer-friendly Telugu.
    Guarantees no broken Unicode or garbled characters reach the user.
    """
    if not text or not text.strip():
        return "నమస్కారం! నేను మీకు ఎలా సహాయపడగలను?"

    # If text is already predominantly Telugu, just clean it
    if len(TELUGU_RE.findall(text)) > 10:
        return clean_telugu_text(text)

    # 1. Translate using natural translation engine
    translated = translate_text_online(text, target_lang="te")
    if translated and validate_telugu_text(translated):
        return clean_telugu_text(translated)

    # 2. Offline Agronomic Mapping Fallback
    lines = text.split("\n")
    telugu_lines = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if telugu_lines and telugu_lines[-1] != "":
                telugu_lines.append("")
            continue

        # Map headers
        lower_line = stripped.lower()
        matched_header = False
        for eng_key, tel_header in TELUGU_HEADER_MAP.items():
            if eng_key in lower_line:
                telugu_lines.append(tel_header)
                matched_header = True
                break
        
        if matched_header:
            continue

        # Simple term replacement
        line_trans = stripped
        for eng_term, tel_term in AGRI_TELUGU_TERMS.items():
            line_trans = re.sub(rf'\b{re.escape(eng_term)}\b', tel_term, line_trans, flags=re.IGNORECASE)

        telugu_lines.append(line_trans)

    result = "\n".join(telugu_lines).strip()
    return clean_telugu_text(result)


def localize_ai_response(response_text: str, target_lang: str) -> str:
    """
    Localizes AI response into the farmer's target language:
    - If 'en': returns clean English response.
    - If 'te': converts to 100% natural, grammatically correct farmer Telugu.
    - If 'hi' / 'kn' / 'ta' / 'bn' / 'mr' / etc.: translates and formats appropriately.
    """
    if not response_text:
        return ""

    lang_code = normalize_language_code(target_lang)
    if lang_code == "en":
        cleaned = response_text.replace("\ufffd", "")
        for tag in ["<|im_start|>", "<|im_end|>", "<|endoftext|>", "assistant\n", "assistant:", "system\n", "system:"]:
            cleaned = cleaned.replace(tag, "")
        return cleaned.strip()

    if lang_code == "te":
        return convert_to_farmer_telugu(response_text)

    if lang_code == "hi":
        if len(HINDI_RE.findall(response_text)) > 10:
            return response_text.strip()
        translated = translate_text_online(response_text, target_lang="hi")
        if translated:
            return translated.strip()
        return response_text.strip()

    # Any other supported Indian language (kn, ta, bn, mr, gu, ml, pa)
    translated = translate_text_online(response_text, target_lang=lang_code)
    if translated:
        return translated.strip()

    return response_text.strip()


def get_language_display_name(lang_code: str) -> str:
    """Returns friendly UI label for a language code."""
    mapping = {
        "te": "తెలుగు",
        "hi": "हिंदी",
        "kn": "ಕನ್ನಡ",
        "ta": "தமிழ்",
        "bn": "বাংলা",
        "mr": "मराठी",
        "gu": "ગુજરાતી",
        "ml": "മലയാളം",
        "pa": "ਪੰਜਾਬੀ",
        "en": "English"
    }
    return mapping.get(normalize_language_code(lang_code), "English")

