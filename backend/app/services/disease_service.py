import io
import re
import base64
import logging
import asyncio
from typing import Dict, Any, Optional, Tuple, List
from PIL import Image

logger = logging.getLogger(__name__)

# All 38 PlantVillage Classes mapped with localized metadata, causes, remedies, and prevention tips
DISEASE_KNOWLEDGE_BASE: Dict[str, Dict[str, Any]] = {
    # ------------------- TOMATO -------------------
    "Tomato___Early_blight": {
        "plant_en": "Tomato",
        "plant_te": "టమాటా",
        "plant_hi": "टमाटर",
        "disease_en": "Early Blight (Alternaria solani)",
        "disease_te": "ఆకుమచ్చ తెగులు (ఎర్లీ బ్లైట్)",
        "disease_hi": "अगेती झुलसा (अर्ली ब्लाइट)",
        "is_healthy": False,
        "causes_en": [
            "Caused by the fungus Alternaria solani surviving in soil and plant debris.",
            "High humidity (above 80%) combined with warm temperatures (24-29°C).",
            "Water splashing from soil onto lower leaves during heavy rain or overhead irrigation."
        ],
        "causes_te": [
            "నేలలో ఉండే ఆల్టర్నేరియా సొలానీ (Alternaria solani) శిలీంధ్రం వల్ల వ్యాపిస్తుంది.",
            "అధిక తేమ (80% పైన) మరియు వెచ్చని వాతావరణం (24-29°C) అనుకూలం.",
            "పైనుంచి నీరు పోయడం లేదా వర్షపు చినుకుల ద్వారా నేల నుంచి క్రింది ఆకులకు శిలీంధ్రం చేరుతుంది."
        ],
        "causes_hi": [
            "अल्टरनेरिया सोलानी नामक कवक (फंगस) के कारण होता है जो मिट्टी में जीवित रहता है।",
            "अधिक नमी (80% से अधिक) और गर्म तापमान (24-29°C)।",
            "ऊपर से सिंचाई करने या बारिश से मिट्टी के छींटे निचली पत्तियों पर पड़ने से।"
        ],
        "remedy_en": [
            "Prune and safely destroy heavily infected bottom leaves.",
            "Spray organic Neem Oil (5 ml/L) or Trichoderma viride (10 g/L) for early-stage control.",
            "For severe infection, spray Mancozeb 75% WP (2.5 g/L) or Copper Oxychloride 50% WP (3 g/L) at 10-12 day intervals."
        ],
        "remedy_te": [
            "తెగులు సోకిన క్రింది ఆకులను తుంచి కాల్చివేయండి లేదా దూరంగా పారవేయండి.",
            "ప్రారంభ దశలో వేపనూనె (5 మి.లీ / లీటరు నీటికి) లేదా ట్రైకోడెర్మా విరిడే (10 గ్రా / లీటరు) పిచికారీ చేయండి.",
            "తీవ్రత ఎక్కువగా ఉంటే మాంకోజెబ్ 75% WP (2.5 గ్రా / లీటరు) లేదా కాపర్ ఆక్సిక్లోరైడ్ 50% WP (3 గ్రా / లీటరు) 10-12 రోజుల వ్యవధిలో పిచికారీ చేయండి."
        ],
        "remedy_hi": [
            "रोगग्रस्त निचली पत्तियों को तोड़कर नष्ट कर दें।",
            "शुरुआती चरण में नीम का तेल (5 मिली/लीटर) या ट्राइकोडर्मा विरिडी का छिड़काव करें।",
            "गंभीर संक्रमण होने पर मैंकोजेब (2.5 ग्राम/लीटर) या कॉपर ऑक्सीक्लोराइड (3 ग्राम/लीटर) का छिड़काव करें।"
        ],
        "prevention_en": [
            "Practice 2-3 year crop rotation away from nightshade family crops (potato, brinjal, chilli).",
            "Use drip irrigation to keep plant foliage dry.",
            "Apply straw or plastic mulch around the plant base to prevent soil splashing."
        ],
        "prevention_te": [
            "టమాటా, బంగాళాదుంప, మిర్చి వంటి ఒకే జాతి పంటలను వరుసగా వేయకుండా 2-3 ఏళ్ళు పంట మార్పిడి చేయండి.",
            "ఆకులు తడవకుండా బిందు సేద్యం (డ్రిప్ ఇరిగేషన్) ద్వారా మాత్రమే నీరు అందించండి.",
            "నేల నుంచి ఆకులకు మట్టి ఎగరకుండా మొదళ్ళ చుట్టూ ఎండుగడ్డి లేదా మల్చింగ్ షీట్ వేయండి."
        ],
        "prevention_hi": [
            "टमाटर के बाद आलू या बैंगन न लगाएं, 2-3 साल का फसल चक्र अपनाएं।",
            "ड्रिप सिंचाई का उपयोग करें ताकि पत्तियां गीली न रहें।",
            "पौधों के चारों ओर पलवार (मल्चिंग) लगाएं ताकि मिट्टी के छींटे न उड़ें।"
        ]
    },
    "Tomato___Late_blight": {
        "plant_en": "Tomato",
        "plant_te": "టమాటా",
        "plant_hi": "टमाटर",
        "disease_en": "Late Blight (Phytophthora infestans)",
        "disease_te": "లేట్ బ్లైట్ తెగులు (మాడు తెగులు)",
        "disease_hi": "पछेती झुलसा (लेट ब्लाइट)",
        "is_healthy": False,
        "causes_en": [
            "Caused by the oomycete Phytophthora infestans.",
            "Cool, wet weather with continuous high humidity and fog.",
            "Waterlogged fields and poor air circulation among dense canopies."
        ],
        "causes_te": [
            "ఫైటోప్తోరా ఇన్‌ఫెస్టాన్స్ (Phytophthora infestans) అనే శిలీంధ్రం వల్ల వస్తుంది.",
            "చల్లటి మరియు తేమతో కూడిన వాతావరణం, మంచు కురవడం అనుకూలం.",
            "పొలంలో నీరు నిల్వ ఉండటం మరియు మొక్కల మధ్య గాలి వెలుతురు లేకపోవడం."
        ],
        "causes_hi": [
            "फाइटोफ्थोरा इन्फेस्टान्स कवक के कारण होता है।",
            "ठंडा, नम मौसम, लगातार कोहरा और अत्यधिक नमी।",
            "खेत में जलभराव और पौधों के बीच हवा का संचार न होना।"
        ],
        "remedy_en": [
            "Immediately destroy infected leaves and fruits to halt spreading.",
            "Apply systemic fungicide: Metalaxyl 8% + Mancozeb 64% WP (Ridomil MZ @ 2.5 g/L).",
            "Alternatively spray Cymoxanil 8% + Mancozeb 64% WP (Sectina @ 2 g/L)."
        ],
        "remedy_te": [
            "తెగులు సోకిన ఆకులు, కాయలను వెంటనే కోసి నాశనం చేయండి.",
            "మెటలాక్సిల్ 8% + మాంకోజెబ్ 64% WP (రిడోమిల్ @ 2.5 గ్రా / లీటరు) పిచికారీ చేయండి.",
            "లేదా సైమోక్సానిల్ + మాంకోజెబ్ (2 గ్రా / లీటరు) పిచికారీ చేయండి."
        ],
        "remedy_hi": [
            "संक्रमित पत्तियों और फलों को तुरंत नष्ट कर दें।",
            "मेटालेक्सिल + मैंकोजेब (रिडोमिल @ 2.5 ग्राम/लीटर) का तुरंत छिड़काव करें।",
            "या साइमोक्सानिल + मैंकोजेब (2 ग्राम/लीटर) का छिड़काव करें।"
        ],
        "prevention_en": [
            "Maintain wide plant spacing (60 x 45 cm) for good sunlight penetration.",
            "Avoid overhead irrigation; ensure excellent field drainage.",
            "Use certified disease-resistant hybrid seed varieties."
        ],
        "prevention_te": [
            "మొక్కల మధ్య సరైన దూరం (60 x 45 సెం.మీ) పాటించి గాలి, వెలుతురు తగిలేలా చూడండి.",
            "మురుగు నీరు త్వరగా బయటకు పోయేలా కాలువలు తీయండి.",
            "తెగుళ్లను తట్టుకునే రకాల విత్తనాలను మాత్రమే వాడండి."
        ],
        "prevention_hi": [
            "पौधों के बीच उचित दूरी (60 x 45 सेमी) रखें ताकि धूप और हवा मिल सके।",
            "खेत में जल निकासी की उत्तम व्यवस्था रखें।",
            "रोग प्रतिरोधी किस्मों के प्रमाणित बीज ही बोएं।"
        ]
    },
    "Tomato___Bacterial_spot": {
        "plant_en": "Tomato",
        "plant_te": "టమాటా",
        "plant_hi": "टमाटर",
        "disease_en": "Bacterial Spot (Xanthomonas)",
        "disease_te": "బ్యాక్టీరియా మచ్చల తెగులు",
        "disease_hi": "जीवाणु पत्ती धब्बा रोग",
        "is_healthy": False,
        "causes_en": [
            "Caused by Xanthomonas bacteria entering via natural leaf openings or wounds.",
            "Frequent rainfall, warm humid temperatures, and overhead watering."
        ],
        "causes_te": [
            "జాంతోమోనాస్ (Xanthomonas) బ్యాక్టీరియా ఆకులపై గాయాల ద్వారా ప్రవేశిస్తుంది.",
            "వర్షాలు, ఉక్కపోత మరియు అధిక తేమ వల్ల వేగంగా వ్యాపిస్తుంది."
        ],
        "causes_hi": [
            "जैंथोमोनास बैक्टीरिया द्वारा होता है जो पत्तियों के छिद्रों या चोटों से प्रवेश करता है।",
            "लगातार बारिश और गर्म आर्द्र मौसम।"
        ],
        "remedy_en": [
            "Spray Streptocycline (1 g in 10 L water) mixed with Copper Oxychloride (25 g in 10 L water).",
            "Avoid touching or harvesting plants when leaves are wet."
        ],
        "remedy_te": [
            "స్ట్రెప్టోసైక్లిన్ (1 గ్రాము / 10 లీటర్ల నీటికి) + కాపర్ ఆక్సిక్లోరైడ్ (25 గ్రాములు / 10 లీటర్లకు) కలిపి పిచికారీ చేయండి.",
            "ఆకులు తడిగా ఉన్నప్పుడు తోటలోకి వెళ్లడం లేదా కోతలు కోయడం చేయకండి."
        ],
        "remedy_hi": [
            "स्ट्रेप्टोसाइक्लिन (1 ग्राम / 10 लीटर पानी) + कॉपर ऑक्सीक्लोराइड (25 ग्राम / 10 लीटर) मिलाकर छिड़कें।",
            "पत्तियां गीली होने पर पौधों को न छुएं।"
        ],
        "prevention_en": [
            "Treat seeds with hot water (50°C for 25 mins) or Streptocycline before sowing.",
            "Use drip irrigation and sanitize farm pruning tools."
        ],
        "prevention_te": [
            "విత్తన శుద్ధి చేసిన విత్తనాలను మాత్రమే నాటండి.",
            "ఉపయోగించే కత్తెరలు, పరికరాలను శుభ్రపరచండి."
        ],
        "prevention_hi": [
            "बोने से पहले बीजोपचार अवश्य करें।",
            "उपकरणों को साफ रखें और ड्रिप से सिंचाई करें।"
        ]
    },
    "Tomato___Leaf_Mold": {
        "plant_en": "Tomato",
        "plant_te": "టమాటా",
        "plant_hi": "टमाटर",
        "disease_en": "Leaf Mold (Passalora fulva)",
        "disease_te": "ఆకు బూజు తెగులు (లీఫ్ మోల్డ్)",
        "disease_hi": "पत्ती फफूंद (लीफ मोल्ड)",
        "is_healthy": False,
        "causes_en": ["High humidity (>85%) and poor ventilation in greenhouses or dense fields."],
        "causes_te": ["గాలిలో అధిక తేమ (85% పైగా) మరియు మొక్కల మధ్య గాలి ఆడని పరిస్థితులు."],
        "causes_hi": ["अत्यधिक आर्द्रता और सघन पौधों के कारण हवा का न पहुंचना।"],
        "remedy_en": ["Spray Copper Hydroxide (2 g/L) or Chlorothalonil 75% WP (2 g/L).", "Improve air flow by pruning bottom suckers."],
        "remedy_te": ["కాపర్ హైడ్రాక్సైడ్ (2 గ్రా / లీ) లేదా క్లోరోథలోనిల్ (2 గ్రా / లీ) పిచికారీ చేయండి.", "క్రింది పిలకలను కత్తిరించి గాలి ఆడేలా చేయండి."],
        "remedy_hi": ["कॉपर हाइड्रॉक्साइड या क्लोरोथालोनिल (2 ग्राम/लीटर) का छिड़काव करें।", "निचली शाखाओं को काटकर हवादार बनाएं।"],
        "prevention_en": ["Ventilate polyhouses, reduce planting density, use drip lines."],
        "prevention_te": ["మొక్కల మధ్య తగిన ఎడం ఉంచండి, డ్రిప్ ద్వారా మాత్రమే నీరివ్వండి."],
        "prevention_hi": ["पौधों में पर्याप्त दूरी रखें और उचित वेंटिलेशन बनाए रखें।"]
    },
    "Tomato___Septoria_leaf_spot": {
        "plant_en": "Tomato",
        "plant_te": "టమాటా",
        "plant_hi": "टमाटर",
        "disease_en": "Septoria Leaf Spot (Septoria lycopersici)",
        "disease_te": "సెప్టోరియా ఆకుమచ్చ తెగులు",
        "disease_hi": "सेप्टोरिया पत्ती धब्बा रोग",
        "is_healthy": False,
        "causes_en": ["Soil-borne fungus Septoria lycopersici thriving in prolonged wet leaves."],
        "causes_te": ["నేలలో ఉండే సెప్టోరియా శిలీంధ్రం మరియు ఆకులు నిరంతరం తడిగా ఉండటం."],
        "causes_hi": ["पत्तियों पर लंबे समय तक पानी रहने से सेप्टोरिया फंगस का पनपना।"],
        "remedy_en": ["Spray Mancozeb (2.5 g/L) or Zineb 75% WP (2 g/L) every 7-10 days."],
        "remedy_te": ["మాంకోజెబ్ (2.5 గ్రా / లీ) లేదా జినెబ్ (2 గ్రా / లీ) 7-10 రోజుల వ్యవధిలో పిచికారీ చేయండి."],
        "remedy_hi": ["मैंकोजेब (2.5 ग्राम/लीटर) या जिनेब का छिड़काव करें।"],
        "prevention_en": ["Mulch ground, remove fallen leaf debris, rotate crops."],
        "prevention_te": ["రాలిన ఆకులను ఏరివేయండి, మల్చింగ్ వాడండి."],
        "prevention_hi": ["गिरी हुई पत्तियों को हटा दें, पलवार का उपयोग करें।"]
    },
    "Tomato___Spider_mites Two-spotted_spider_mite": {
        "plant_en": "Tomato",
        "plant_te": "టమాటా",
        "plant_hi": "टमाटर",
        "disease_en": "Two-Spotted Spider Mites Infestation",
        "disease_te": "ఎర్ర నల్లి / బూడిద పురుగు (స్పైడర్ మైట్స్)",
        "disease_hi": "लाल मकड़ी / माइट कीट",
        "is_healthy": False,
        "causes_en": ["Hot, dry, dusty weather favoring rapid mite reproduction."],
        "causes_te": ["వేడి, పొడి వాతావరణం మరియు దుమ్ము వల్ల నల్లి పురుగులు వేగంగా పెరుగుతాయి."],
        "causes_hi": ["गर्म और शुष्क मौसम में मकड़ी कीट का तेजी से बढ़ना।"],
        "remedy_en": [
            "Spray Wettable Sulphur 80% WP (3 g/L) or Neem Oil 10,000 ppm (3 ml/L).",
            "For severe mite attack, spray Spiromesifen 22.9% SC (Oberon @ 1 ml/L) or Propargite 57% EC (2 ml/L)."
        ],
        "remedy_te": [
            "నీటిలో కరిగే గంధకం (సల్ఫర్ 80% WP @ 3 గ్రా / లీ) లేదా వేపనూనె పిచికారీ చేయండి.",
            "ఉధృతి ఎక్కువైతే స్పైరోమెసిఫెన్ (ఒబెరాన్ @ 1 మి.లీ / లీటరు) పిచికారీ చేయండి."
        ],
        "remedy_hi": [
            "घुलनशील गंधक (सल्फर 80% @ 3 ग्राम/लीटर) या नीम तेल का छिड़काव करें।",
            "अधिक प्रकोप होने पर स्पाइरोमेसिफेन (1 मिली/लीटर) का छिड़काव करें।"
        ],
        "prevention_en": ["Keep field edges weed-free, spray water mist to increase humidity in dry spells."],
        "prevention_te": ["గట్లపై కలుపు లేకుండా చూసుకోండి, తీవ్రమైన ఎండల్లో తేమ కాపాడండి."],
        "prevention_hi": ["खेत की मेड़ों को खरपतवार मुक्त रखें।"]
    },
    "Tomato___Target_Spot": {
        "plant_en": "Tomato",
        "plant_te": "టమాటా",
        "plant_hi": "टमाटर",
        "disease_en": "Target Spot (Corynespora cassiicola)",
        "disease_te": "టార్గెట్ స్పాట్ (వలయాకార మచ్చలు)",
        "disease_hi": "टारगेट स्पॉट रोग",
        "is_healthy": False,
        "causes_en": ["Warm temperatures (25-32°C) combined with high relative humidity."],
        "causes_te": ["ఉక్కపోత మరియు 25-32°C వెచ్చని వాతావరణంలో ఈ శిలీంధ్రం వ్యాపిస్తుంది."],
        "causes_hi": ["गर्म तापमान और उच्च आर्द्रता में कोरीनेस्पोरा कवक का प्रसार।"],
        "remedy_en": ["Spray Azoxystrobin 23% SC (1 ml/L) or Chlorothalonil (2 g/L)."],
        "remedy_te": ["అజాక్సిస్ట్రోబిన్ (1 మి.లీ / లీ) లేదా క్లోరోథలోనిల్ (2 గ్రా / లీ) పిచికారీ చేయండి."],
        "remedy_hi": ["एजॉक्सीस्ट्रोबिन (1 मिली/लीटर) का छिड़काव करें।"],
        "prevention_en": ["Avoid excessive nitrogen fertilizer; maintain good air flow."],
        "prevention_te": ["నత్రజని ఎరువులు మోతాదుకు మించి వేయకండి."],
        "prevention_hi": ["संतुलित उर्वरकों का प्रयोग करें।"]
    },
    "Tomato___Tomato_Yellow_Leaf_Curl_Virus": {
        "plant_en": "Tomato",
        "plant_te": "టమాటా",
        "plant_hi": "टमाटर",
        "disease_en": "Tomato Yellow Leaf Curl Virus (TYLCV)",
        "disease_te": "టమాటా ఆకు ముడత వైరస్ (జెమినీ వైరస్)",
        "disease_hi": "टमाटर पीला पत्ती मुड़न वायरस",
        "is_healthy": False,
        "causes_en": [
            "Transmitted exclusively by the Silverleaf Whitefly (Bemisia tabaci).",
            "Hot, dry periods causing massive whitefly multiplication."
        ],
        "causes_te": [
            "తెల్లదోమ (Whitefly) అనే రసం పీల్చే పురుగుల ద్వారా ఈ వైరస్ వ్యాపిస్తుంది.",
            "ఎండలు, పొడి వాతావరణంలో తెల్లదోమ ఉధృతి పెరుగుతుంది."
        ],
        "causes_hi": [
            "सफेद मक्खी (Whitefly) कीट द्वारा वायरस का प्रसार होता है।",
            "गर्म और सूखे मौसम में सफेद मक्खी का प्रकोप बढ़ना।"
        ],
        "remedy_en": [
            "Install yellow sticky traps (15-20 traps per acre) to monitor and trap whiteflies.",
            "Uproot and bury severely stunted viral plants immediately.",
            "Spray Acetamiprid 20% SP (0.5 g/L) or Diafenthiuron 50% WP (1.25 g/L) to control whitefly vectors."
        ],
        "remedy_te": [
            "ఎకరాకు 15-20 పసుపు రంగు జిగురు అట్టలు అమర్చి తెల్లదోమలను అరికట్టండి.",
            "తీవ్రంగా ముడుచుకుపోయిన వైరస్ సోకిన మొక్కలను పీకి నాశనం చేయండి.",
            "తెల్లదోమ నివారణకు ఎసిటామిప్రిడ్ (0.5 గ్రా / లీ) లేదా డయాఫెంతియురాన్ (1.25 గ్రా / లీ) పిచికారీ చేయండి."
        ],
        "remedy_hi": [
            "खेत में पीले चिपचिपे कार्ड (15-20 प्रति एकड़) लगाएं।",
            "रोगग्रस्त पौधों को उखाड़कर नष्ट करें।",
            "सफेद मक्खी के नियंत्रण हेतु एसिटामिप्रिड (0.5 ग्राम/लीटर) का छिड़काव करें।"
        ],
        "prevention_en": ["Grow border crops like maize/sorghum; plant TYLCV-tolerant hybrids."],
        "prevention_te": ["పొలం చుట్టూ రక్షణ పంటగా 2-3 వరుసల మొక్కజొన్న లేదా జొన్న వేయండి."],
        "prevention_hi": ["खेत के चारों ओर मक्का या ज्वार की 2-3 पंक्तियां लगाएं।"]
    },
    "Tomato___Tomato_mosaic_virus": {
        "plant_en": "Tomato",
        "plant_te": "టమాటా",
        "plant_hi": "टमाटर",
        "disease_en": "Tomato Mosaic Virus (ToMV)",
        "disease_te": "టమాటా మొజాయిక్ వైరస్",
        "disease_hi": "टमाटर मोजेक वायरस",
        "is_healthy": False,
        "causes_en": ["Highly contagious mechanical transmission via tools, hands, and infected seeds."],
        "causes_te": ["రైతుల చేతులు, పనిముట్లు, తాకడం మరియు విత్తనాల ద్వారా వ్యాపిస్తుంది."],
        "causes_hi": ["हाथों, औजारों और संक्रमित बीजों के माध्यम से फैलता है।"],
        "remedy_en": ["Remove and burn infected plants. Wash hands and tools with 10% TSP or soap."],
        "remedy_te": ["సోకిన మొక్కలను పీకి కాల్చండి. పనిముట్లను సబ్బు నీటితో కడగండి."],
        "remedy_hi": ["प्रभावित पौधों को उखाड़कर जला दें। औजारों को साबुन से धोएं।"],
        "prevention_en": ["Use certified virus-free seeds, avoid smoking/tobacco near tomato crops."],
        "prevention_te": ["ధృవీకరించిన విత్తనాలు వాడండి, పొలంలో పొగాకు వాడకం నిషేధించండి."],
        "prevention_hi": ["प्रमाणित बीजों का प्रयोग करें।"]
    },
    "Tomato___healthy": {
        "plant_en": "Tomato",
        "plant_te": "టమాటా",
        "plant_hi": "टमाटर",
        "disease_en": "Healthy Plant (No Disease Detected)",
        "disease_te": "ఆరోగ్యకరమైన పంట (ఎటువంటి తెగులు లేదు)",
        "disease_hi": "स्वस्थ पौधा (कोई रोग नहीं पाया गया)",
        "is_healthy": True,
        "causes_en": ["Plant shows vigorous, disease-free green foliage and optimal nutrient balance."],
        "causes_te": ["మొక్క ఆకులు ఆరోగ్యకరంగా, మంచి పోషణతో పచ్చగా ఉన్నాయి."],
        "causes_hi": ["पौधे की पत्तियां स्वस्थ और उचित पोषण से युक्त हैं।"],
        "remedy_en": [
            "Maintain regular balanced NPK fertilization (19:19:19 @ 5 g/L).",
            "Ensure consistent drip irrigation and monitor leaf undersides weekly."
        ],
        "remedy_te": [
            "సమతుల్య ఎరువులను (19:19:19 @ 5 గ్రా / లీ) క్రమం తప్పకుండా అందించండి.",
            "డ్రిప్ ద్వారా క్రమబద్ధమైన నీరు అందిస్తూ వారానికోసారి ఆకుల అడుగు భాగాన్ని పరిశీలించండి."
        ],
        "remedy_hi": [
            "नियमित संतुलित खाद (19:19:19) दें और ड्रिप से नियमित सिंचाई जारी रखें।"
        ],
        "prevention_en": ["Continue preventative sprays of Neem oil (3 ml/L) once every 15 days."],
        "prevention_te": ["ముందు జాగ్రత్తగా ప్రతి 15 రోజులకు ఒకసారి వేపనూనె పిచికారీ చేయండి."],
        "prevention_hi": ["निवारक उपाय के तौर पर 15 दिन में एक बार नीम तेल का छिड़काव करें।"]
    },

    # ------------------- POTATO -------------------
    "Potato___Early_blight": {
        "plant_en": "Potato",
        "plant_te": "బంగాళాదుంప",
        "plant_hi": "आलू",
        "disease_en": "Potato Early Blight (Alternaria solani)",
        "disease_te": "బంగాళాదుంప ఆకుమచ్చ తెగులు (ఎర్లీ బ్లైట్)",
        "disease_hi": "आलू अगेती झुलसा रोग",
        "is_healthy": False,
        "causes_en": ["Alternaria fungus attacking older foliage in warm humid spells."],
        "causes_te": ["ఆల్టర్నేరియా శిలీంధ్రం వల్ల ముదిరిన ఆకులపై వలయాకారపు మచ్చలు ఏర్పడతాయి."],
        "causes_hi": ["गर्म और नम मौसम में निचली पत्तियों पर भूरे छल्लेदार धब्बे बनना।"],
        "remedy_en": ["Spray Mancozeb 75% WP (2.5 g/L) or Propineb 70% WP (2 g/L)."],
        "remedy_te": ["మాంకోజెబ్ (2.5 గ్రా / లీ) లేదా ప్రొపినెబ్ (2 గ్రా / లీ) పిచికారీ చేయండి."],
        "remedy_hi": ["मैंकोजेब (2.5 ग्राम/लीटर) या प्रोपिनेब का छिड़काव करें।"],
        "prevention_en": ["Practice crop rotation, maintain soil potassium levels."],
        "prevention_te": ["పంట మార్పిడి చేయండి, పొటాష్ ఎరువులను తగినంత వేయండి."],
        "prevention_hi": ["फसल चक्र अपनाएं और पोटाश युक्त खाद का सही उपयोग करें।"]
    },
    "Potato___Late_blight": {
        "plant_en": "Potato",
        "plant_te": "బంగాళాదుంప",
        "plant_hi": "आलू",
        "disease_en": "Potato Late Blight (Phytophthora infestans)",
        "disease_te": "బంగాళాదుంప లేట్ బ్లైట్ తెగులు",
        "disease_hi": "आलू पछेती झुलसा रोग",
        "is_healthy": False,
        "causes_en": ["Phytophthora infestans fungus favored by cold, foggy, wet weather."],
        "causes_te": ["చలి, పొగమంచు మరియు అధిక తేమ ఉన్నప్పుడు ఫైటోప్తోరా శిలీంధ్రం వేగంగా నాశనం చేస్తుంది."],
        "causes_hi": ["ठंड, कोहरा और नमी के कारण कवक का तीव्र फैलाव।"],
        "remedy_en": ["Spray Metalaxyl + Mancozeb (Ridomil MZ @ 2.5 g/L) or Dimethomorph 50% WP (1 g/L)."],
        "remedy_te": ["రిడోమిల్ MZ (2.5 గ్రా / లీ) లేదా డైమెథోమార్ఫ్ (1 గ్రా / లీ) పిచికారీ చేయండి."],
        "remedy_hi": ["रिडोमिल (2.5 ग्राम/लीटर) या डाइमथोमोर्फ का तुरंत छिड़काव करें।"],
        "prevention_en": ["Ensure good hilling/earthing up of soil around tubers, use disease-free seed tubers."],
        "prevention_te": ["దుంపల చుట్టూ మట్టిని బాగా ఎగదోయండి, నాణ్యమైన విత్తన దుంపలు వాడండి."],
        "prevention_hi": ["पौधों पर मिट्टी सही से चढ़ाएं और रोगमुक्त कंद ही बोएं।"]
    },
    "Potato___healthy": {
        "plant_en": "Potato",
        "plant_te": "బంగాళాదుంప",
        "plant_hi": "आलू",
        "disease_en": "Healthy Potato Crop",
        "disease_te": "ఆరోగ్యకరమైన బంగాళాదుంప పంట",
        "disease_hi": "स्वस्थ आलू की फसल",
        "is_healthy": True,
        "causes_en": ["Vigorous vegetative growth and healthy tuber development."],
        "causes_te": ["మొక్కలు ఏపుగా పెరిగి ఆరోగ్యకరంగా ఉన్నాయి."],
        "causes_hi": ["फसल स्वस्थ और अच्छी बढ़वार में है।"],
        "remedy_en": ["Continue scheduled irrigation and balanced earthing-up."],
        "remedy_te": ["సమయానుకూలంగా నీరు అందిస్తూ మట్టి ఎగదోయండి."],
        "remedy_hi": ["नियमित सिंचाई और मिट्टी चढ़ाने का कार्य जारी रखें।"],
        "prevention_en": ["Monitor regularly for early blight lesions."],
        "prevention_te": ["తెగులు లక్షణాలు రాకుండా క్రమం తప్పక పరిశీలించండి."],
        "prevention_hi": ["फसल का नियमित निरीक्षण करते रहें।"]
    },

    # ------------------- PEPPER / CHILLI -------------------
    "Pepper,_bell___Bacterial_spot": {
        "plant_en": "Bell Pepper / Chilli",
        "plant_te": "మిర్చి / బెల్ పెప్పర్",
        "plant_hi": "शिमला मिर्च / मिर्च",
        "disease_en": "Bacterial Spot (Xanthomonas campestris)",
        "disease_te": "మిర్చి బ్యాక్టీరియా మచ్చల తెగులు",
        "disease_hi": "मिर्च जीवाणु पत्ती धब्बा",
        "is_healthy": False,
        "causes_en": ["Xanthomonas bacteria spread by wind-driven rains and warm humidity."],
        "causes_te": ["గాలులతో కూడిన వర్షాలు మరియు తేమ వల్ల బ్యాక్టీరియా వ్యాపిస్తుంది."],
        "causes_hi": ["हवा और बारिश के पानी से जीवाणुओं का फैलना।"],
        "remedy_en": ["Spray Copper Oxychloride (2.5 g/L) + Streptocycline (1 g/10 L)."],
        "remedy_te": ["కాపర్ ఆక్సిక్లోరైడ్ (2.5 గ్రా / లీ) + స్ట్రెప్టోసైక్లిన్ (1 గ్రా / 10 లీ) కలిపి పిచికారీ చేయండి."],
        "remedy_hi": ["कॉपर ऑक्सीक्लोराइड + स्ट्रेप्टोसाइक्लिन का छिड़काव करें।"],
        "prevention_en": ["Use hot-water treated seeds and avoid overhead sprinklers."],
        "prevention_te": ["విత్తన శుద్ధి చేసిన విత్తనాలు వాడండి."],
        "prevention_hi": ["उचित बीजोपचार करें और स्प्रिंकलर से बचें।"]
    },
    "Pepper,_bell___healthy": {
        "plant_en": "Bell Pepper / Chilli",
        "plant_te": "మిర్చి / బెల్ పెప్పర్",
        "plant_hi": "शिमला मिर्च / मिर्च",
        "disease_en": "Healthy Pepper / Chilli Crop",
        "disease_te": "ఆరోగ్యకరమైన మిర్చి పంట",
        "disease_hi": "स्वस्थ मिर्च / शिमला मिर्च",
        "is_healthy": True,
        "causes_en": ["Green leaves with robust growth and balanced nutrition."],
        "causes_te": ["మొక్కలు మంచి ఎదుగుదలతో ఆరోగ్యంగా ఉన్నాయి."],
        "causes_hi": ["पौधे रोगमुक्त और स्वस्थ हैं।"],
        "remedy_en": ["Maintain nitrogen-potassium balance; spray micronutrients."],
        "remedy_te": ["సూక్ష్మ పోషకాలను పిచికారీ చేయండి."],
        "remedy_hi": ["सूक्ष्म पोषक तत्वों का छिड़काव करें।"],
        "prevention_en": ["Maintain sticky traps for thrips and mites."],
        "prevention_te": ["తామర పురుగుల నివారణకు జిగురు అట్టలు పెట్టండి."],
        "prevention_hi": ["चिपचिपे ट्रैप लगाकर रखें।"]
    },

    # ------------------- CORN / MAIZE -------------------
    "Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot": {
        "plant_en": "Corn (Maize)",
        "plant_te": "మొక్కజొన్న",
        "plant_hi": "मक्का (कॉर्न)",
        "disease_en": "Gray Leaf Spot (Cercospora zeae-maydis)",
        "disease_te": "మొక్కజొన్న గ్రే ఆకుమచ్చ తెగులు",
        "disease_hi": "मक्का ग्रे लीफ स्पॉट रोग",
        "is_healthy": False,
        "causes_en": ["Fungal spores surviving on corn debris; warm humid overcast days."],
        "causes_te": ["గత పంట వ్యర్థాల నుంచి గాలి ద్వారా శిలీంధ్ర బీజాలు వ్యాపిస్తాయి."],
        "causes_hi": ["पुराने अवशेषों से फफूंद का संक्रमण और नम मौसम।"],
        "remedy_en": ["Spray Azoxystrobin 18.2% + Difenoconazole 11.4% SC (Amistar Top @ 1 ml/L)."],
        "remedy_te": ["అజాక్సిస్ట్రోబిన్ + డైఫెనోకోనజోల్ (ఎమిస్టార్ టాప్ @ 1 మి.లీ / లీ) పిచికారీ చేయండి."],
        "remedy_hi": ["एजॉक्सीस्ट्रोबिन + डिफेनोकोनाजोल (1 मिली/लीटर) का छिड़काव करें।"],
        "prevention_en": ["Tillage of residue, 2-year crop rotation, resistant hybrid seed."],
        "prevention_te": ["పంట వ్యర్థాలను కలియదున్నండి, పంట మార్పిడి చేయండి."],
        "prevention_hi": ["गहरी जुताई करें और फसल चक्र अपनाएं।"]
    },
    "Corn_(maize)___Common_rust_": {
        "plant_en": "Corn (Maize)",
        "plant_te": "మొక్కజొన్న",
        "plant_hi": "मक्का (कॉर्न)",
        "disease_en": "Common Rust (Puccinia sorghi)",
        "disease_te": "మొక్కజొన్న తుప్పు తెగులు",
        "disease_hi": "मक्का रतुआ (कॉमन रस्ट)",
        "is_healthy": False,
        "causes_en": ["Airborne spores of Puccinia sorghi favored by moderate temps (16-25°C) and heavy dew."],
        "causes_te": ["గాలి ద్వారా వచ్చే పుస్సీనియా శిలీంధ్రం వల్ల ఆకులపై తుప్పు రంగు పొక్కులు వస్తాయి."],
        "causes_hi": ["हवा द्वारा फैलने वाला रतुआ फफूंद और अधिक ओस।"],
        "remedy_en": ["Spray Propiconazole 25% EC (Tilt @ 1 ml/L) or Mancozeb (2.5 g/L)."],
        "remedy_te": ["ప్రొపికొనజోల్ (టిల్ట్ @ 1 మి.లీ / లీ) లేదా మాంకోజెబ్ (2.5 గ్రా / లీ) పిచికారీ చేయండి."],
        "remedy_hi": ["प्रोपिकोनाजोल (1 मिली/लीटर) या मैंकोजेब का छिड़काव करें।"],
        "prevention_en": ["Plant resistant varieties; early planting."],
        "prevention_te": ["తుప్పు తెగులును తట్టుకునే విత్తనాలు వాడండి."],
        "prevention_hi": ["प्रतिरोधी किस्मों की समय पर बुवाई करें।"]
    },
    "Corn_(maize)___Northern_Leaf_Blight": {
        "plant_en": "Corn (Maize)",
        "plant_te": "మొక్కజొన్న",
        "plant_hi": "मक्का (कॉर्न)",
        "disease_en": "Northern Leaf Blight (Exserohilum turcicum)",
        "disease_te": "మొక్కజొన్న ఎండి తెగులు (టర్సికం బ్లైట్)",
        "disease_hi": "मक्का उत्तरी पत्ती झुलसा",
        "is_healthy": False,
        "causes_en": ["Fungal infection thriving in moderate temps (18-27°C) and wet leaves."],
        "causes_te": ["ఎక్సెరోహిలమ్ శిలీంధ్రం వల్ల ఆకులపై పొడవాటి చుట్టల వంటి మచ్చలు వస్తాయి."],
        "causes_hi": ["पत्तियों पर नाव के आकार के लंबे धब्बे बनना।"],
        "remedy_en": ["Spray Mancozeb (2.5 g/L) or Tebuconazole (1 ml/L) at first symptom sight."],
        "remedy_te": ["టెబుకొనజోల్ (1 మి.లీ / లీ) లేదా మాంకోజెబ్ పిచికారీ చేయండి."],
        "remedy_hi": ["टेबुकोनाजोल (1 मिली/लीटर) का छिड़काव करें।"],
        "prevention_en": ["Rotate crops with legumes; bury old crop residues deep."],
        "prevention_te": ["పప్పుధాన్యాలతో పంట మార్పిడి చేయండి."],
        "prevention_hi": ["दलहनी फसलों के साथ फसल चक्र अपनाएं।"]
    },
    "Corn_(maize)___healthy": {
        "plant_en": "Corn (Maize)",
        "plant_te": "మొక్కజొన్న",
        "plant_hi": "मक्का (कॉर्न)",
        "disease_en": "Healthy Maize Crop",
        "disease_te": "ఆరోగ్యకరమైన మొక్కజొన్న పంట",
        "disease_hi": "स्वस्थ मक्का की फसल",
        "is_healthy": True,
        "causes_en": ["Green broad leaves with strong photosynthetic activity."],
        "causes_te": ["ఆకులు వెడల్పుగా పచ్చగా ఆరోగ్యంగా ఉన్నాయి."],
        "causes_hi": ["फसल स्वस्थ है और अच्छी बढ़वार पर है।"],
        "remedy_en": ["Apply top-dressing urea at knee-high and tasseling stages."],
        "remedy_te": ["మోకాలి ఎత్తు మరియు పూత దశల్లో యూరియా వేయండి."],
        "remedy_hi": ["घुटने की ऊंचाई और मंजर निकलने के समय यूरिया दें।"],
        "prevention_en": ["Check regularly for fall armyworm in whorls."],
        "prevention_te": ["కత్తెర పురుగు రాకుండా సుడులను పరిశీలించండి."],
        "prevention_hi": ["फॉल आर्मीवर्म कीट के लिए गोभ का निरीक्षण करें।"]
    },

    # ------------------- APPLE -------------------
    "Apple___Apple_scab": {
        "plant_en": "Apple",
        "plant_te": "ఆపిల్",
        "plant_hi": "सेब",
        "disease_en": "Apple Scab (Venturia inaequalis)",
        "disease_te": "ఆపిల్ స్కాబ్ తెగులు",
        "disease_hi": "सेब का स्कैब रोग",
        "is_healthy": False,
        "causes_en": ["Venturia fungal spores released during cool, wet spring weather."],
        "causes_te": ["చల్లటి వర్షపు వాతావరణంలో శిలీంధ్రం ఆకులపై నల్లటి మచ్చలను కలిగిస్తుంది."],
        "causes_hi": ["ठंडे और नम मौसम में फंगस का फैलाव।"],
        "remedy_en": ["Spray Difenoconazole 25% EC (Score @ 0.5 ml/L) or Captan 50% WP (2.5 g/L)."],
        "remedy_te": ["డైఫెనోకోనజోల్ (స్కోర్ @ 0.5 మి.లీ / లీ) లేదా కాప్టాన్ పిచికారీ చేయండి."],
        "remedy_hi": ["डिफेनोकोनाजोल या कैप्टन का छिड़काव करें।"],
        "prevention_en": ["Rake and destroy fallen orchard leaves, prune trees for canopy sunlight."],
        "prevention_te": ["తోటలోని రాలిన ఆకులను నాశనం చేయండి, చెట్లను కత్తిరించండి."],
        "prevention_hi": ["गिरी हुई पत्तियों को नष्ट करें और छंटाई करें।"]
    },
    "Apple___Black_rot": {
        "plant_en": "Apple",
        "plant_te": "ఆపిల్",
        "plant_hi": "सेब",
        "disease_en": "Black Rot (Botryosphaeria obtusa)",
        "disease_te": "ఆపిల్ నల్ల కుళ్ళు తెగులు",
        "disease_hi": "सेब का काला सड़न रोग",
        "is_healthy": False,
        "causes_en": ["Fungal entry through tree bark wounds, fire-blight strikes, or insect damage."],
        "causes_te": ["చెట్ల కొమ్మలపై గాయాలు మరియు కీటకాల ద్వారా శిలీంధ్రం లోపలికి చేరుతుంది."],
        "causes_hi": ["घावों और कीटों के माध्यम से फंगस का प्रवेश।"],
        "remedy_en": ["Prune dead wood and cankers 15 cm below infection; spray Thiophanate Methyl 70% WP (1 g/L)."],
        "remedy_te": ["ఎండిన కొమ్మలను కత్తిరించి థియోఫానేట్ మిథైల్ (1 గ్రా / లీ) పిచికారీ చేయండి."],
        "remedy_hi": ["सूखी शाखाओं को काटें और थियोफैनेट मिथाइल का छिड़काव करें।"],
        "prevention_en": ["Remove mummified fruit, sanitize pruning shears."],
        "prevention_te": ["చెట్లపై ఎండిపోయిన పండ్లను తీసివేయండి."],
        "prevention_hi": ["सूखे फलों को हटाएं और औजार साफ रखें।"]
    },
    "Apple___Cedar_apple_rust": {
        "plant_en": "Apple",
        "plant_te": "ఆపిల్",
        "plant_hi": "सेब",
        "disease_en": "Cedar Apple Rust (Gymnosporangium juniperi-virginianae)",
        "disease_te": "ఆపిల్ రస్ట్ (తుప్పు మచ్చల) తెగులు",
        "disease_hi": "सेब का रतुआ रोग",
        "is_healthy": False,
        "causes_en": ["Fungus requiring both apple and nearby cedar/juniper trees to complete life cycle."],
        "causes_te": ["సమీపంలోని జునిపెర్ / సెడార్ చెట్ల ద్వారా వ్యాపించే శిలీంధ్రం."],
        "causes_hi": ["आसपास के जुनिपर पेड़ों से फंगस का संक्रमण।"],
        "remedy_en": ["Spray Myclobutanil (0.5 ml/L) or Mancozeb (2.5 g/L) from pink bud stage."],
        "remedy_te": ["మైక్లోబుటానిల్ లేదా మాంకోజెబ్ పిచికారీ చేయండి."],
        "remedy_hi": ["माइक्लोब्यूटानिल का छिड़काव करें।"],
        "prevention_en": ["Remove nearby wild cedar/juniper hosts within 300 meters."],
        "prevention_te": ["తోట చుట్టూ ఉన్న పిచ్చి చెట్లను తొలగించండి."],
        "prevention_hi": ["आसपास के जंगली पोधों को हटाएं।"]
    },
    "Apple___healthy": {
        "plant_en": "Apple",
        "plant_te": "ఆపిల్",
        "plant_hi": "सेब",
        "disease_en": "Healthy Apple Tree Foliage",
        "disease_te": "ఆరోగ్యకరమైన ఆపిల్ ఆకులు",
        "disease_hi": "स्वस्थ सेब का पौधा",
        "is_healthy": True,
        "causes_en": ["Vibrant green leaves and balanced orchard microclimate."],
        "causes_te": ["ఆకులు ఎలాంటి మచ్చలు లేకుండా పచ్చగా ఉన్నాయి."],
        "causes_hi": ["पत्तियां स्वस्थ और हरी हैं।"],
        "remedy_en": ["Maintain annual pruning and balanced micro-nutrient foliar sprays."],
        "remedy_te": ["సమతుల్య పోషకాలు అందించండి."],
        "remedy_hi": ["उचित पोषण और देखरेख जारी रखें।"],
        "prevention_en": ["Apply preventive copper sprays before bud break."],
        "prevention_te": ["చిగురు దశకు ముందు కాపర్ పిచికారీ చేయండి."],
        "prevention_hi": ["कलियां खिलने से पहले कॉपर का निवारक छिड़काव करें।"]
    },

    # ------------------- GRAPES -------------------
    "Grape___Black_rot": {
        "plant_en": "Grape",
        "plant_te": "ద్రాక్ష",
        "plant_hi": "अंगूर",
        "disease_en": "Grape Black Rot (Guignardia bidwellii)",
        "disease_te": "ద్రాక్ష నల్ల కుళ్ళు తెగులు",
        "disease_hi": "अंगूर का काला सड़न रोग",
        "is_healthy": False,
        "causes_en": ["Fungus attacking leaves and berries during warm, humid rainfall."],
        "causes_te": ["వర్షాలు, వెచ్చటి వాతావరణంలో శిలీంధ్రం ఆకులు మరియు కాయలను కుళ్ళింపజేస్తుంది."],
        "causes_hi": ["बारिश और गर्म मौसम में फफूंद का हमला।"],
        "remedy_en": ["Spray Mancozeb (2.5 g/L) or Kresoxim-methyl 44.3% SC (1 ml/L)."],
        "remedy_te": ["మాంకోజెబ్ లేదా క్రెసోక్సిమ్-మిథైల్ పిచికారీ చేయండి."],
        "remedy_hi": ["मैंकोजेब या क्रेसोक्सिम-मिथाइल का छिड़काव करें।"],
        "prevention_en": ["Prune canopy to maximize airflow, remove mummified grape clusters."],
        "prevention_te": ["పందిరిలో గాలి ఆడేలా కొమ్మలను సరిచేయండి, ఎండిన గుత్తులను తీసేయండి."],
        "prevention_hi": ["पत्तियों की छंटाई करें और सूखे गुच्छों को हटाएं।"]
    },
    "Grape___Esca_(Black_Measles)": {
        "plant_en": "Grape",
        "plant_te": "ద్రాక్ష",
        "plant_hi": "अंगूर",
        "disease_en": "Esca / Black Measles",
        "disease_te": "ద్రాక్ష ఎస్కా (నల్ల మచ్చల కుళ్ళు)",
        "disease_hi": "अंगूर का एस्का रोग",
        "is_healthy": False,
        "causes_en": ["Complex trunk fungal pathogens penetrating pruning wounds."],
        "causes_te": ["కొమ్మలను కత్తిరించినప్పుడు ఏర్పడే గాయాల ద్వారా ప్రవేశించే శిలీంధ్రాలు."],
        "causes_hi": ["कटाई-छंटाई के घावों से फंगस का प्रवेश।"],
        "remedy_en": ["Paint large pruning wounds with copper paste; protect vine trunks."],
        "remedy_te": ["గాయాలపై కాపర్ పేస్ట్ లేదా బోర్డో పేస్ట్ పూయండి."],
        "remedy_hi": ["घावों पर कॉपर पेस्ट लगाएं।"],
        "prevention_en": ["Prune vines in dry weather only."],
        "prevention_te": ["పొడి వాతావరణంలో మాత్రమే కత్తిరింపులు చేయండి."],
        "prevention_hi": ["सूखे मौसम में ही छंटाई करें।"]
    },
    "Grape___Leaf_blight_(Isariopsis_Leaf_Spot)": {
        "plant_en": "Grape",
        "plant_te": "ద్రాక్ష",
        "plant_hi": "अंगूर",
        "disease_en": "Grape Leaf Blight (Isariopsis)",
        "disease_te": "ద్రాక్ష ఆకుమచ్చ తెగులు",
        "disease_hi": "अंगूर पत्ती झुलसा",
        "is_healthy": False,
        "causes_en": ["Isariopsis clavispora fungus causing dark brown leaf spots in late season."],
        "causes_te": ["సీజన్ చివర్లో ఆకులపై ముదురు గోధుమ రంగు మచ్చలు ఏర్పడతాయి."],
        "causes_hi": ["पत्तियों पर गहरे भूरे रंग के धब्बे बनना।"],
        "remedy_en": ["Spray Carbendazim 50% WP (1 g/L) or Copper Oxychloride (2.5 g/L)."],
        "remedy_te": ["కార్బెండజిమ్ (1 గ్రా / లీ) లేదా కాపర్ ఆక్సిక్లోరైడ్ పిచికారీ చేయండి."],
        "remedy_hi": ["कार्बेंडाजिम या कॉपर ऑक्सीक्लोराइड का छिड़काव करें।"],
        "prevention_en": ["Ensure good vine aeration, clear dropped leaves."],
        "prevention_te": ["రాలిన ఆకులను శుభ్రం చేయండి."],
        "prevention_hi": ["खेत की सफाई रखें और गिरी पत्तियां हटाएं।"]
    },
    "Grape___healthy": {
        "plant_en": "Grape",
        "plant_te": "ద్రాక్ష",
        "plant_hi": "अंगूर",
        "disease_en": "Healthy Grape Vine",
        "disease_te": "ఆరోగ్యకరమైన ద్రాక్ష తోట",
        "disease_hi": "स्वस्थ अंगूर की बेल",
        "is_healthy": True,
        "causes_en": ["Healthy vines with robust leaf canopy and berry set."],
        "causes_te": ["ద్రాక్ష తోట మంచి ఎదుగుదలతో ఆరోగ్యంగా ఉంది."],
        "causes_hi": ["अंगूर की बेलें स्वस्थ और हरी हैं।"],
        "remedy_en": ["Maintain canopy management and balanced drip fertigation."],
        "remedy_te": ["సమతుల్య ఎరువులను డ్రిప్ ద్వారా అందించండి."],
        "remedy_hi": ["ड्रिप से उचित पोषण जारी रखें।"],
        "prevention_en": ["Continue routine preventative sprays of sulfur."],
        "prevention_te": ["ముందు జాగ్రత్తగా గంధకం పిచికారీ చేయండి."],
        "prevention_hi": ["गंधक का निवारक छिड़काव करें।"]
    },

    # ------------------- ORANGE / CITRUS -------------------
    "Orange___Haunglongbing_(Citrus_greening)": {
        "plant_en": "Orange (Citrus)",
        "plant_te": "బత్తాయి / నారింజ (సిట్రస్)",
        "plant_hi": "संतरा / मौसमी (सिट्रस)",
        "disease_en": "Citrus Greening / Huanglongbing (HLB)",
        "disease_te": "సిట్రస్ గ్రీనింగ్ తెగులు (ఆకు పచ్చదనం కోల్పోవడం)",
        "disease_hi": "सिट्रस ग्रीनिंग रोग",
        "is_healthy": False,
        "causes_en": [
            "Caused by Candidatus Liberibacter bacteria transmitted by the Asian Citrus Psyllid (Diaphorina citri).",
            "Infected nursery budding material."
        ],
        "causes_te": [
            "సిట్రస్ సైలిడ్ (Citrus Psyllid) అనే రసం పీల్చే పురుగు ద్వారా ఈ బ్యాక్టీరియా వ్యాపిస్తుంది.",
            "నర్సరీల నుంచి తెచ్చిన కలుషిత అంటుమొక్కలు."
        ],
        "causes_hi": [
            "सिट्रस साइलिड कीट द्वारा बैक्टीरिया का संचरण।",
            "संक्रमित नर्सरी के पौधों से फैलाव।"
        ],
        "remedy_en": [
            "Control psyllid insect vectors by spraying Imidacloprid 17.8% SL (0.5 ml/L) or Thiamethoxam 25% WG (0.3 g/L).",
            "Foliar spray with zinc sulphate (0.5%) + ferrous sulphate (0.5%) + urea (1%) to boost tree vigor.",
            "Uproot and burn severely declining trees to safeguard the orchard."
        ],
        "remedy_te": [
            "సైలిడ్ పురుగుల నివారణకు ఇమిడాక్లోప్రిడ్ (0.5 మి.లీ / లీ) లేదా థయామెథోక్సామ్ (0.3 గ్రా / లీ) పిచికారీ చేయండి.",
            "జింక్ సల్ఫేట్ (5 గ్రా) + ఫెర్రస్ సల్ఫేట్ (5 గ్రా) + యూరియా (10 గ్రా) లీటరు నీటికి కలిపి పిచికారీ చేయండి.",
            "బాగా పాడైన చెట్లను పీకి కాల్చివేయండి."
        ],
        "remedy_hi": [
            "कीट नियंत्रण के लिए इमिडाक्लोप्रिड या थायमेथॉक्साइम का छिड़काव करें।",
            "जिंक सल्फेट और सूक्ष्म पोषक तत्वों का छिड़काव करें।"
        ],
        "prevention_en": ["Use only certified disease-free grafted saplings from registered nurseries."],
        "prevention_te": ["రిజిస్టర్డ్ నర్సరీల నుంచి ధృవీకరించిన అంటుమొక్కలను మాత్రమే నాటండి."],
        "prevention_hi": ["प्रमाणित नर्सरी से रोगमुक्त पौधे ही लगाएं।"]
    },

    # ------------------- SQUASH / GOURDS -------------------
    "Squash___Powdery_mildew": {
        "plant_en": "Squash / Gourd",
        "plant_te": "గుమ్మడి / సొర / బీర (పాదు పంటలు)",
        "plant_hi": "कद्दू / लौकी / तोरई",
        "disease_en": "Powdery Mildew (Podosphaera xanthii)",
        "disease_te": "బూడిద తెగులు (పౌడరీ మిల్డ్యూ)",
        "disease_hi": "चूर्णिल आसिता (पाउडरी मिल्ड्यू)",
        "is_healthy": False,
        "causes_en": ["Airborne fungal spores thriving in dry weather with high humidity and shade."],
        "causes_te": ["నీడ, ఉక్కపోత మరియు పొడి వాతావరణంలో తెల్లటి బూడిద వంటి శిలీంధ్రం ఆకులపై వ్యాపిస్తుంది."],
        "causes_hi": ["शुष्क मौसम और छांव वाली जगह में पत्तियों पर सफेद चूर्ण जमना।"],
        "remedy_en": [
            "Spray Wettable Sulphur 80% WP (3 g/L) or Dinocap 48% EC (1 ml/L).",
            "Organic spray: Baking soda (5 g/L) + Liquid soap (2 ml/L) in water."
        ],
        "remedy_te": [
            "నీటిలో కరిగే గంధకం (సల్ఫర్ 80% WP @ 3 గ్రా / లీ) పిచికారీ చేయండి.",
            "సేంద్రీయ పద్ధతి: వంటసోడా (5 గ్రా) + వేపనూనె (3 మి.లీ) లీటరు నీటికి కలిపి పిచికారీ చేయండి."
        ],
        "remedy_hi": [
            "घुलनशील गंधक (3 ग्राम/लीटर) या नीम तेल का छिड़काव करें।",
            "बेकिंग सोडा (5 ग्राम/लीटर) का जैविक घोल छिड़कें।"
        ],
        "prevention_en": ["Plant in full sun; space plants for air flow."],
        "prevention_te": ["మొక్కలకు ఎండ బాగా తగిలేలా చూడండి."],
        "prevention_hi": ["पौधों को पूरी धूप मिले ऐसी जगह लगाएं।"]
    },

    # ------------------- STRAWBERRY -------------------
    "Strawberry___Leaf_scorch": {
        "plant_en": "Strawberry",
        "plant_te": "స్ట్రాబెర్రీ",
        "plant_hi": "स्ट्रॉबेरी",
        "disease_en": "Strawberry Leaf Scorch (Diplocarpon earlianum)",
        "disease_te": "స్ట్రాబెర్రీ ఆకు ఎండిపోయే తెగులు",
        "disease_hi": "स्ट्रॉबेरी पत्ती झुलसा रोग",
        "is_healthy": False,
        "causes_en": ["Fungus splashing from soil onto leaves during rains."],
        "causes_te": ["నీటి తుంపర్ల ద్వారా నేల నుంచి ఆకులకు సోకే శిలీంధ్రం."],
        "causes_hi": ["मिट्टी से पत्तियों पर फंगस का संक्रमण।"],
        "remedy_en": ["Spray Captan 50% WP (2.5 g/L) or Thiophanate Methyl (1 g/L)."],
        "remedy_te": ["కాప్టాన్ లేదా థియోఫానేట్ మిథైల్ పిచికారీ చేయండి."],
        "remedy_hi": ["कैप्टन या थियोफैनेट मिथाइल का छिड़काव करें।"],
        "prevention_en": ["Use plastic mulch around strawberry plants; drip irrigate."],
        "prevention_te": ["మొక్కల చుట్టూ మల్చింగ్ షీట్ వాడండి."],
        "prevention_hi": ["पलवार (मल्चिंग) का उपयोग करें।"]
    },
    "Strawberry___healthy": {
        "plant_en": "Strawberry",
        "plant_te": "స్ట్రాబెర్రీ",
        "plant_hi": "स्ट्रॉबेरी",
        "disease_en": "Healthy Strawberry Plants",
        "disease_te": "ఆరోగ్యకరమైన స్ట్రాబెర్రీ పంట",
        "disease_hi": "स्वस्थ स्ट्रॉबेरी का पौधा",
        "is_healthy": True,
        "causes_en": ["Healthy trifoliate foliage and good crown development."],
        "causes_te": ["మొక్కలు ఏపుగా పెరిగి ఆరోగ్యంగా ఉన్నాయి."],
        "causes_hi": ["पौधे स्वस्थ और रोगमुक्त हैं।"],
        "remedy_en": ["Maintain straw mulch and balanced potassium fertigation."],
        "remedy_te": ["పొటాష్ ఎరువులు తగిన మోతాదులో అందించండి."],
        "remedy_hi": ["उचित पोषण और सिंचाई जारी रखें।"],
        "prevention_en": ["Remove old dried leaves regularly."],
        "prevention_te": ["ఎండిన ఆకులను క్రమం తప్పక తొలగించండి."],
        "prevention_hi": ["पुरानी सूखी पत्तियों को हटाते रहें।"]
    },

    # ------------------- SOYBEAN -------------------
    "Soybean___healthy": {
        "plant_en": "Soybean",
        "plant_te": "సోయాబీన్",
        "plant_hi": "सोयाबीन",
        "disease_en": "Healthy Soybean Crop",
        "disease_te": "ఆరోగ్యకరమైన సోయాబీన్ పంట",
        "disease_hi": "स्वस्थ सोयाबीन की फसल",
        "is_healthy": True,
        "causes_en": ["Robust nitrogen-fixing nodules and healthy green foliage."],
        "causes_te": ["వేరు బుడిపెల ద్వారా మంచి నత్రజని స్థిరీకరణతో మొక్కలు పచ్చగా ఉన్నాయి."],
        "causes_hi": ["फसल स्वस्थ है और अच्छी बढ़वार पर है।"],
        "remedy_en": ["Ensure adequate moisture during flowering and pod development stages."],
        "remedy_te": ["పూత మరియు కాయ దశల్లో నేలలో తగినంత తేమ ఉండేలా చూడండి."],
        "remedy_hi": ["फूल और फली बनते समय पर्याप्त नमी बनाए रखें।"],
        "prevention_en": ["Scout for stem fly and pod borers."],
        "prevention_te": ["కాండం తొలుచు పురుగు రాకుండా గమనించండి."],
        "prevention_hi": ["तना मक्खी और कीटों का निरीक्षण करते रहें।"]
    },

    # ------------------- CHERRY -------------------
    "Cherry_(including_sour)___Powdery_mildew": {
        "plant_en": "Cherry",
        "plant_te": "చెర్రీ",
        "plant_hi": "चेरी",
        "disease_en": "Cherry Powdery Mildew (Podosphaera clandestina)",
        "disease_te": "చెర్రీ బూడిద తెగులు",
        "disease_hi": "चेरी चूर्णिल आसिता रोग",
        "is_healthy": False,
        "causes_en": ["Fungal white coating on new leaf flushes in warm dry weather."],
        "causes_te": ["కొత్త చిగుర్లపై తెల్లటి బూడిద పొరలా ఏర్పడే శిలీంధ్రం."],
        "causes_hi": ["नई पत्तियों पर सफेद चूर्ण की परत बनना।"],
        "remedy_en": ["Spray Myclobutanil (0.5 ml/L) or Wettable Sulphur (3 g/L)."],
        "remedy_te": ["సల్ఫర్ (3 గ్రా / లీ) పిచికారీ చేయండి."],
        "remedy_hi": ["सल्फर (3 ग्राम/लीटर) का छिड़काव करें।"],
        "prevention_en": ["Prune crowded interior branches."],
        "prevention_te": ["చెట్ల లోపలి కొమ్మలను కత్తిరించి గాలి ఆడేలా చేయండి."],
        "prevention_hi": ["अंदरूनी शाखाओं की छंटाई करें।"]
    },
    "Cherry_(including_sour)___healthy": {
        "plant_en": "Cherry",
        "plant_te": "చెర్రీ",
        "plant_hi": "चेरी",
        "disease_en": "Healthy Cherry Tree",
        "disease_te": "ఆరోగ్యకరమైన చెర్రీ చెట్టు",
        "disease_hi": "स्वस्थ चेरी का पौधा",
        "is_healthy": True,
        "causes_en": ["Clean green leaves without fungal spots or mildews."],
        "causes_te": ["చెట్టు ఆకులు ఆరోగ్యంగా ఉన్నాయి."],
        "causes_hi": ["पत्तियां स्वस्थ और हरी हैं।"],
        "remedy_en": ["Maintain standard orchard fertilization."],
        "remedy_te": ["సమయానుకూలంగా ఎరువులు వేయండి."],
        "remedy_hi": ["नियमित पोषण दें।"],
        "prevention_en": ["Monitor during spring leaf flush."],
        "prevention_te": ["చిగురు దశలో పరిశీలించండి."],
        "prevention_hi": ["नियमित निरीक्षण जारी रखें।"]
    },

    # ------------------- PEACH -------------------
    "Peach___Bacterial_spot": {
        "plant_en": "Peach",
        "plant_te": "పీచ్",
        "plant_hi": "आड़ू (पीच)",
        "disease_en": "Peach Bacterial Spot (Xanthomonas arboricola)",
        "disease_te": "పీచ్ బ్యాక్టీరియా మచ్చల తెగులు",
        "disease_hi": "आड़ू जीवाणु पत्ती धब्बा",
        "is_healthy": False,
        "causes_en": ["Bacterial infection favored by sandy soil, wind, and rain."],
        "causes_te": ["ఇసుక నేలలు మరియు వర్షపు గాలుల వల్ల బ్యాక్టీరియా వ్యాపిస్తుంది."],
        "causes_hi": ["रेतीली मिट्टी और हवा-बारिश से जीवाणु संक्रमण।"],
        "remedy_en": ["Spray Copper Hydroxide (2 g/L) or Oxytetracycline."],
        "remedy_te": ["కాపర్ హైడ్రాక్సైడ్ పిచికారీ చేయండి."],
        "remedy_hi": ["कॉपर का छिड़काव करें।"],
        "prevention_en": ["Plant windbreaks around the orchard."],
        "prevention_te": ["తోట చుట్టూ గాలిమళ్ల పంటలు వేయండి."],
        "prevention_hi": ["खेत के चारों ओर वायु अवरोधक पेड़ लगाएं।"]
    },
    "Peach___healthy": {
        "plant_en": "Peach",
        "plant_te": "పీచ్",
        "plant_hi": "आड़ू (पीच)",
        "disease_en": "Healthy Peach Tree",
        "disease_te": "ఆరోగ్యకరమైన పీచ్ చెట్టు",
        "disease_hi": "स्वस्थ आड़ू का पेड़",
        "is_healthy": True,
        "causes_en": ["Healthy foliage and vigorous shoot growth."],
        "causes_te": ["ఆకులు ఎలాంటి మచ్చలు లేకుండా పచ్చగా ఉన్నాయి."],
        "causes_hi": ["पत्तियां हरी और स्वस्थ हैं।"],
        "remedy_en": ["Maintain balanced potassium nutrition."],
        "remedy_te": ["పొటాష్ ఎరువులు సమతుల్యంగా వేయండి."],
        "remedy_hi": ["संतुलित खाद दें।"],
        "prevention_en": ["Check for peach leaf curl in spring."],
        "prevention_te": ["వసంత కాలంలో ఆకుముడత రాకుండా చూడండి."],
        "prevention_hi": ["वसंत में निरीक्षण करें।"]
    },

    # ------------------- BLUEBERRY & RASPBERRY -------------------
    "Blueberry___healthy": {
        "plant_en": "Blueberry",
        "plant_te": "బ్లూబెర్రీ",
        "plant_hi": "ब्लूबेरी",
        "disease_en": "Healthy Blueberry Plant",
        "disease_te": "ఆరోగ్యకరమైన బ్లూబెర్రీ పంట",
        "disease_hi": "स्वस्थ ब्लूबेरी का पौधा",
        "is_healthy": True,
        "causes_en": ["Healthy acidic soil foliage."],
        "causes_te": ["ఆరోగ్యకరమైన మొక్క."],
        "causes_hi": ["स्वस्थ पौधा।"],
        "remedy_en": ["Maintain acidic soil pH (4.5 - 5.5)."],
        "remedy_te": ["నేల pH తగినంత ఆమ్లత్వంతో ఉండేలా చూడండి."],
        "remedy_hi": ["मिट्टी का पीएच सही रखें।"],
        "prevention_en": ["Mulch with pine needles or acidic organic matter."],
        "prevention_te": ["మల్చింగ్ వాడండి."],
        "prevention_hi": ["पलवार का उपयोग करें।"]
    },
    "Raspberry___healthy": {
        "plant_en": "Raspberry",
        "plant_te": "రాస్ప్‌బెర్రీ",
        "plant_hi": "रास्पबेरी",
        "disease_en": "Healthy Raspberry Plant",
        "disease_te": "ఆరోగ్యకరమైన రాస్ప్‌బెర్రీ పంట",
        "disease_hi": "स्वस्थ रास्पबेरी का पौधा",
        "is_healthy": True,
        "causes_en": ["Vigorous green canes and disease-free foliage."],
        "causes_te": ["ఆరోగ్యకరమైన మొక్క."],
        "causes_hi": ["स्वस्थ पौधा।"],
        "remedy_en": ["Maintain trellising and cane pruning."],
        "remedy_te": ["కొమ్మలను కత్తిరించండి."],
        "remedy_hi": ["उचित छंटाई करें।"],
        "prevention_en": ["Ensure good air drainage."],
        "prevention_te": ["గాలి ఆడేలా చూడండి."],
        "prevention_hi": ["हवादार रखें।"]
    }
}


class PlantDiseaseDetector:
    _instance: Optional['PlantDiseaseDetector'] = None

    def __init__(self):
        self.model = None
        self.transform = None
        self.device = "cpu"
        self.is_loaded = False
        self.model_name = "linkanjarad/mobilenet_v2_1.0_224-plant-disease-identification"

    @classmethod
    def get_instance(cls) -> 'PlantDiseaseDetector':
        if cls._instance is None:
            cls._instance = PlantDiseaseDetector()
        return cls._instance

    def load_model(self) -> None:
        if self.is_loaded and self.model is not None:
            return

        try:
            import torch
            import torchvision.transforms as T
            from transformers import AutoModelForImageClassification

            self.device = "cuda" if torch.cuda.is_available() else "cpu"
            logger.info("Loading Plant Disease AI Vision Model (%s) on %s...", self.model_name, self.device)

            self.model = AutoModelForImageClassification.from_pretrained(self.model_name)
            self.model.to(self.device)
            self.model.eval()

            # MobileNetV2 ImageNet Standard Preprocessing Transformation
            self.transform = T.Compose([
                T.Resize((224, 224)),
                T.ToTensor(),
                T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])

            self.is_loaded = True
            logger.info("Plant Disease AI Vision Model loaded successfully with %d classes!", len(self.model.config.id2label))

        except Exception as e:
            logger.error("Failed to load Plant Disease AI Vision Model: %s", e, exc_info=True)
            self.is_loaded = False

    def decode_and_validate_image(self, image_data: str) -> Tuple[Optional[Image.Image], Optional[str]]:
        """
        Safely validates and decodes base64 image data URL or raw string into a PIL Image.
        """
        if not image_data or not isinstance(image_data, str) or len(image_data.strip()) < 50:
            return None, "Invalid or empty image data provided."

        try:
            clean_b64 = image_data.strip()
            # Strip data URL header if present (e.g. data:image/jpeg;base64,...)
            if "," in clean_b64 and ("data:image" in clean_b64 or "base64" in clean_b64):
                clean_b64 = clean_b64.split(",", 1)[1]

            image_bytes = base64.b64decode(clean_b64)
            if len(image_bytes) < 100:
                return None, "Image file is too small or corrupted."

            img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            width, height = img.size

            if width < 32 or height < 32:
                return None, "Image resolution is too low. Please upload a clear photo of the plant leaf."

            # Check image variance and visual texture (detect blank, solid, or completely dark non-leaf images)
            import numpy as np
            arr = np.array(img, dtype=np.float32)
            std_dev = float(np.std(arr))
            mean_val = float(np.mean(arr))

            if std_dev < 14.0 or mean_val < 15.0 or mean_val > 245.0:
                return None, "Image has insufficient detail, is too dark, or is not a plant leaf photo."

            return img, None

        except Exception as e:
            logger.warning("Image decoding error: %s", e)
            return None, "Could not decode the uploaded image. Please ensure it is a valid JPEG, PNG, or WebP photo."

    def _sync_predict(self, image: Image.Image) -> Dict[str, Any]:
        """
        Runs PyTorch inference on the decoded PIL Image.
        """
        if not self.is_loaded or self.model is None:
            self.load_model()

        import torch

        input_tensor = self.transform(image).unsqueeze(0).to(self.device)

        with torch.no_grad():
            outputs = self.model(input_tensor)
            logits = outputs.logits
            probs = torch.softmax(logits, dim=-1)[0]
            top_prob, top_idx = torch.topk(probs, 5)

        predictions = []
        for p, idx in zip(top_prob, top_idx):
            label = self.model.config.id2label[idx.item()]
            predictions.append({
                "label": label,
                "score": float(p.item())
            })

        return {
            "top_label": predictions[0]["label"],
            "top_confidence": predictions[0]["score"],
            "all_predictions": predictions
        }

    async def analyze_leaf_image(
        self,
        image_data: str,
        target_language: str = "en",
        farmer_crop: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Full async pipeline: validates image, runs neural net prediction, looks up agronomic remedy,
        and generates structured diagnostic advisory in farmer's target language.
        """
        lang = target_language.lower().strip()
        if lang in ["telugu", "te-in", "te_in"]:
            lang = "te"
        elif lang in ["hindi", "hi-in", "hi_in"]:
            lang = "hi"
        else:
            lang = "en" if lang not in ["te", "hi"] else lang

        # 1. Decode & Validate Image
        img, err = self.decode_and_validate_image(image_data)
        if err or img is None:
            if lang == "te":
                user_msg = f"⚠️ ఫోటో స్పష్టంగా లేదు: {err} దయచేసి పంట లేదా మొక్క ఆకు ఫోటోను స్పష్టంగా తీసి అప్‌లోడ్ చేయండి."
            elif lang == "hi":
                user_msg = f"⚠️ फोटो स्पष्ट नहीं है: {err} कृपया पौधे की पत्ती की स्पष्ट फोटो अपलोड करें।"
            else:
                user_msg = f"⚠️ Image error: {err} Please upload a clear, focused photo of the affected plant leaf."

            return {
                "success": False,
                "error": err,
                "formatted_response": user_msg,
                "is_plant": False
            }

        # 2. Run inference in threadpool
        inference_result = await asyncio.to_thread(self._sync_predict, img)
        top_label = inference_result["top_label"]
        top_confidence = inference_result["top_confidence"]

        logger.info("[PLANT DISEASE AI] Prediction: %s (Confidence: %.2f%%)", top_label, top_confidence * 100)

        # 3. Check Confidence Threshold (< 0.28 means unclear or non-plant image)
        if top_confidence < 0.28:
            if lang == "te":
                unclear_msg = (
                    "⚠️ **స్పష్టమైన ఆకు ఫోటో అవసరం**\n\n"
                    "అప్‌లోడ్ చేసిన చిత్రం స్పష్టంగా లేదు లేదా మొక్క ఆకుగా గుర్తించబడలేదు. "
                    "ఖచ్చితమైన తెగులు నిర్ధారణ మరియు నివారణ సలహా కొరకు, దయచేసి ప్రభావితమైన మొక్క ఆకును దగ్గరగా, వెలుతురులో స్పష్టంగా ఫోటో తీసి పంపండి."
                )
            elif lang == "hi":
                unclear_msg = (
                    "⚠️ **स्पष्ट पत्ती की फोटो आवश्यक है**\n\n"
                    "अपलोड की गई फोटो स्पष्ट नहीं है या किसी पौधे की पत्ती की पहचान नहीं हो सकी। "
                    "सटीक रोग पहचान और उपचार के लिए कृपया प्रभावित पौधे की पत्ती की साफ और केंद्रित फोटो अपलोड करें।"
                )
            else:
                unclear_msg = (
                    "⚠️ **Clear Plant Leaf Photo Required**\n\n"
                    "The uploaded image is unclear or could not be reliably identified as a plant leaf. "
                    "For accurate disease diagnosis and treatment advice, please upload a clear, well-lit, close-up photo of the affected plant leaf."
                )

            return {
                "success": False,
                "error": "Low confidence / Unclear image",
                "formatted_response": unclear_msg,
                "top_label": top_label,
                "confidence": top_confidence,
                "is_plant": False
            }

        # 4. Fetch Knowledge Base Entry
        disease_info = DISEASE_KNOWLEDGE_BASE.get(top_label)
        if not disease_info:
            # Fallback formatting if exact key is slightly formatted differently
            parts = top_label.split("___")
            plant_raw = parts[0].replace("_", " ").strip()
            disease_raw = parts[1].replace("_", " ").strip() if len(parts) > 1 else "Unknown"
            disease_info = {
                "plant_en": plant_raw,
                "plant_te": plant_raw,
                "plant_hi": plant_raw,
                "disease_en": disease_raw,
                "disease_te": disease_raw,
                "disease_hi": disease_raw,
                "is_healthy": "healthy" in disease_raw.lower(),
                "causes_en": ["Microbial pathogen or nutritional stress."],
                "causes_te": ["వాతావరణంలో మార్పులు లేదా సూక్ష్మజీవుల వల్ల ఈ సమస్య రావచ్చు."],
                "causes_hi": ["मौसम में बदलाव या सूक्ष्मजीवों के कारण यह समस्या हो सकती है।"],
                "remedy_en": ["Spray Neem oil or broad-spectrum fungicide."],
                "remedy_te": ["వేపనూనె లేదా తగిన శిలీంధ్రనాశిని పిచికారీ చేయండి."],
                "remedy_hi": ["नीम तेल या उपयुक्त कवकनाशी का छिड़काव करें।"],
                "prevention_en": ["Practice crop sanitation."],
                "prevention_te": ["తోటను పరిశుభ్రంగా ఉంచండి."],
                "prevention_hi": ["खेत की सफाई रखें।"]
            }

        # 5. Format Structured Diagnosis according to required language
        plant_name = disease_info.get(f"plant_{lang}", disease_info["plant_en"])
        disease_name = disease_info.get(f"disease_{lang}", disease_info["disease_en"])
        causes_list = disease_info.get(f"causes_{lang}", disease_info["causes_en"])
        remedy_list = disease_info.get(f"remedy_{lang}", disease_info["remedy_en"])
        prevention_list = disease_info.get(f"prevention_{lang}", disease_info["prevention_en"])
        confidence_pct = round(top_confidence * 100, 1)

        # Build clean Markdown response
        if lang == "te":
            lines = [
                f"🌱 **మొక్క / పంట:** {plant_name}",
                f"🔬 **గుర్తించిన సమస్య / తెగులు:** {disease_name}",
                f"📊 **ఖచ్చితత్వ స్థాయి (Confidence):** {confidence_pct}%",
                "",
                "🔍 **ఇలా ఎందుకు జరుగుతుంది? (కారణాలు):**"
            ]
            for c in causes_list:
                lines.append(f"- {c}")

            lines.extend([
                "",
                "🛠️ **ఇప్పుడు ఏం చేయాలి? (నివారణ / చికిత్స):**"
            ])
            for r in remedy_list:
                lines.append(f"- {r}")

            lines.extend([
                "",
                "🛡️ **మళ్లీ రాకుండా ముందు జాగ్రత్తలు:**"
            ])
            for p in prevention_list:
                lines.append(f"- {p}")

        elif lang == "hi":
            lines = [
                f"🌱 **पौधा / फसल:** {plant_name}",
                f"🔬 **पहचाना गया रोग / स्थिति:** {disease_name}",
                f"📊 **सटीकता स्तर (Confidence):** {confidence_pct}%",
                "",
                "🔍 **संभावित कारण:**"
            ]
            for c in causes_list:
                lines.append(f"- {c}")

            lines.extend([
                "",
                "🛠️ **उपचार और समाधान:**"
            ])
            for r in remedy_list:
                lines.append(f"- {r}")

            lines.extend([
                "",
                "🛡️ **रोकथाम के उपाय:**"
            ])
            for p in prevention_list:
                lines.append(f"- {p}")

        else:  # English
            lines = [
                f"🌱 **Plant Name:** {plant_name}",
                f"🔬 **Detected Disease / Condition:** {disease_name}",
                f"📊 **Confidence Level:** {confidence_pct}%",
                "",
                "🔍 **Possible Causes:**"
            ]
            for c in causes_list:
                lines.append(f"- {c}")

            lines.extend([
                "",
                "🛠️ **Treatment & Remedy:**"
            ])
            for r in remedy_list:
                lines.append(f"- {r}")

            lines.extend([
                "",
                "🛡️ **Prevention Tips:**"
            ])
            for p in prevention_list:
                lines.append(f"- {p}")

        formatted_text = "\n".join(lines)

        return {
            "success": True,
            "plant_name": plant_name,
            "disease_name": disease_name,
            "is_healthy": disease_info.get("is_healthy", False),
            "confidence": confidence_pct,
            "causes": causes_list,
            "treatment": remedy_list,
            "prevention": prevention_list,
            "formatted_response": formatted_text,
            "is_plant": True
        }


def get_disease_detector() -> PlantDiseaseDetector:
    return PlantDiseaseDetector.get_instance()
