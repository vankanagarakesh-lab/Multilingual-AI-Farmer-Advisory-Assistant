import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { translationService } from '../services/translationService';

export type SupportedLanguage = 'en' | 'te' | 'hi' | 'kn' | 'ta' | 'mr';

export interface LanguageOption {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  flag: string;
  bcp47: string;
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🌐', bcp47: 'en-IN' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🌾', bcp47: 'te-IN' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिंदी', flag: '🇮🇳', bcp47: 'hi-IN' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🌱', bcp47: 'kn-IN' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🌿', bcp47: 'ta-IN' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🚜', bcp47: 'mr-IN' },
];

// Helper to normalize language names from profile or string
export const normalizeLanguageCode = (lang?: string | null): SupportedLanguage => {
  if (!lang) return 'en';
  const clean = lang.toLowerCase().trim();
  if (clean.includes('te') || clean.includes('telugu')) return 'te';
  if (clean.includes('hi') || clean.includes('hindi')) return 'hi';
  if (clean.includes('kn') || clean.includes('kannada')) return 'kn';
  if (clean.includes('ta') || clean.includes('tamil')) return 'ta';
  if (clean.includes('mr') || clean.includes('marathi')) return 'mr';
  return 'en';
};

// UI Translations dictionary
export const TRANSLATIONS: Record<SupportedLanguage, Record<string, string>> = {
  en: {
    // Top Header & Nav
    'app.title': 'KRISHI AI',
    'app.subtitle': 'Intelligent Farm Advisor',
    'header.simulate': 'Simulate My Farm',
    'header.rag': 'RAG Knowledge',
    'header.voice': 'Voice AI Active',
    'header.context': 'Context:',
    'header.lang': 'Language',
    
    // Sidebar
    'sidebar.new_chat': 'New Conversation',
    'sidebar.simulator': 'Farm Future Simulator',
    'sidebar.profile': 'Farmer Profile',
    'sidebar.recent_chats': 'Recent Conversations',
    'sidebar.no_chats': 'No conversations yet',
    'sidebar.logout': 'Reset Device',
    'sidebar.confirm_delete': 'Delete this conversation?',
    'sidebar.delete': 'Delete',
    'sidebar.cancel': 'Cancel',
    
    // Chat Page & Input
    'chat.placeholder': 'Ask any farming question, crop disease, fertilizer, or soil problem...',
    'chat.listening': 'Listening to your voice...',
    'chat.processing_audio': 'Transcribing voice audio...',
    'chat.analyzing_leaf': 'Analyzing plant leaf image...',
    'chat.send': 'Send',
    'chat.stop': 'Stop',
    'chat.take_photo': 'Take Photo',
    'chat.upload_photo': 'Upload Image',
    'chat.voice_input': 'Voice Input',
    'chat.language_switch': 'Response Language',
    'chat.retry': 'Retry',
    'chat.suggested_title': 'Suggested Quick Questions',
    'chat.sources': 'Sources',
    'chat.disease_detected': 'Plant Disease Detected',
    'chat.confidence': 'Confidence',
    'chat.treatment': 'Treatment & Remedies',
    'chat.prevention': 'Prevention Tips',
    
    // Profile Page
    'profile.title': 'Farmer Agricultural Profile',
    'profile.details': 'Farmer & Agricultural Details',
    'profile.desc': 'Providing accurate details enables KRISHI AI to generate personalized agricultural advice tailored to your crop, land, and region.',
    'profile.name': 'Farmer Name',
    'profile.age': 'Age',
    'profile.pref_lang': 'Preferred Language',
    'profile.location': 'Location / Village / District',
    'profile.land_size': 'Farm Land Size (Acres)',
    'profile.primary_crop': 'Primary Crop',
    'profile.soil_type': 'Soil Classification',
    'profile.crop_stage': 'Current Crop Growth Stage',
    'profile.save': 'Save Profile',
    'profile.saving': 'Saving Profile...',
    'profile.success': 'Farmer profile updated successfully! KRISHI AI is now calibrated for your farm.',
    
    // Simulator
    'sim.title': 'KRISHI VISION — AI Farm Future Simulator',
    'sim.subtitle': "Don't just grow. Simulate your future before you invest.",
    'sim.water': 'Available Water Level',
    'sim.rain_delay': 'Rain Delay (Monsoon Lag)',
    'sim.temp': 'Temperature Anomaly',
    'sim.price_shift': 'Market Price Shift',
    'sim.budget': 'Farming Budget',
    'sim.best_choice': 'Best Recommendation',
    'sim.est_profit': 'Projected Net Profit',
    'sim.roi': 'Projected ROI',
    'sim.score': 'AI Score',
    'sim.discuss_chat': 'Discuss in KRISHI AI Chat',
    'sim.deep_plan': 'Get Deep AI Strategic Plan',
    'sim.export': 'Export Forecast',
    'sim.reset': 'Reset to Baseline',
    'sim.drought_preset': 'Drought Stress',
    'sim.rain_delay_preset': 'Rain Delay',
    'sim.market_boom_preset': 'Market Boom',
    'sim.low_budget_preset': 'Low Budget',
    
    // Intelligent Autonomous Farm
    'sidebar.auto_farm': 'Intelligent Autonomous Farm',
    'sidebar.future_badge': 'FUTURE AI',
    'auto_farm.title': 'Intelligent Autonomous Farm',
    'auto_farm.subtitle': 'AI + IoT Powered Smart Irrigation System',
    'auto_farm.simulated_badge': 'SIMULATED IOT TELEMETRY',
    'auto_farm.live_sensor_data': 'Live Sensor Data',
    'auto_farm.ai_decision_engine': 'KRISHI AI Decision Engine',
    'auto_farm.smart_motor_control': 'Smart Water Motor Control',
    'auto_farm.farmer_notifications': 'Farmer Notification Feed',
    'auto_farm.demo_controls': 'Simulate Farm Conditions',
    'auto_farm.start_live_demo': 'Start Live AI Demo',
    'auto_farm.running_demo': 'Executing AI Live Demo...',
    'auto_farm.reset_simulation': 'Reset Baseline',
    'auto_farm.soil_moisture': 'Soil Moisture',
    'auto_farm.soil_temp': 'Soil Temperature',
    'auto_farm.air_temp': 'Air Temperature',
    'auto_farm.humidity': 'Humidity',
    'auto_farm.tank_level': 'Water Tank Level',
    'auto_farm.sensor_status': 'Sensor Status',
    'auto_farm.online': 'Online',
    'auto_farm.offline': 'Offline',
    'auto_farm.analyzing': 'KRISHI AI is analyzing real-time farm conditions...',
    'auto_farm.motor_on': 'MOTOR ON',
    'auto_farm.motor_off': 'MOTOR OFF',
    'auto_farm.manual_slider': 'Interactive Soil Moisture Slider',
    'auto_farm.flow_rate': 'Water Flow Rate',
    'auto_farm.pressure': 'Line Pressure',
    'auto_farm.hardware_arch': 'Future Real Hardware Integration',
    'auto_farm.hardware_desc': 'Current version is a software simulation for hackathon demonstration. The architecture is designed for future integration with real ESP32 sensors, relay modules and water pumps.',
    'auto_farm.crop_field': 'Crop Field',
    'auto_farm.irrigation_active': 'Irrigation Active',
    'auto_farm.system_idle': 'System Standby',
    'auto_farm.rule1_title': 'Rule 1: Critical Dry + No Rain',
    'auto_farm.rule2_title': 'Rule 2: Dry + Rain Forecast',
    'auto_farm.rule3_title': 'Rule 3: Optimal Moisture',
    'auto_farm.rule4_title': 'Rule 4: Excess Saturation',

    // Common & Alerts
    'common.loading': 'Loading...',
    'common.error': 'An unexpected error occurred.',
    'common.connected': 'Connected',
    'common.offline': 'Offline Mode',
  },
  
  te: {
    // Top Header & Nav
    'app.title': 'కృషి AI',
    'app.subtitle': 'రైతు సలహా సహాయకుడు',
    'header.simulate': 'పంట భవిష్యత్తు అంచనా',
    'header.rag': 'వ్యవసాయ విజ్ఞానం',
    'header.voice': 'తెలుగు వాయిస్ సేవలు',
    'header.context': 'పంట వివరాలు:',
    'header.lang': 'భాష',
    
    // Sidebar
    'sidebar.new_chat': 'కొత్త సంభాషణ',
    'sidebar.simulator': 'ఫార్మ్ ఫ్యూచర్ సిమ్యులేటర్',
    'sidebar.auto_farm': 'ఇంటెలిజెంట్ అటానమస్ ఫార్మ్',
    'sidebar.future_badge': 'FUTURE AI',
    'sidebar.profile': 'రైతు ప్రొఫైల్',
    'sidebar.recent_chats': 'మునుపటి సంభాషణలు',
    'sidebar.no_chats': 'ఇంకా సంభాషణలు లేవు',
    'sidebar.logout': 'డివైస్ రీసెట్',
    'sidebar.confirm_delete': 'ఈ సంభాషణను తొలగించాలా?',
    'sidebar.delete': 'తొలగించు',
    'sidebar.cancel': 'రద్దు చేయి',
    
    // Chat Page & Input
    'chat.placeholder': 'పంటలు, తెగుళ్లు, ఎరువులు, నీటి యాజమాన్యం గురించి ఏదైనా అడగండి...',
    'chat.listening': 'మీ వాయిస్ వింటున్నాం...',
    'chat.processing_audio': 'ఆడియో ప్రాసెస్ అవుతోంది...',
    'chat.analyzing_leaf': 'ఆకు ఫోటోను పరిశీలిస్తున్నాం...',
    'chat.send': 'పంపండి',
    'chat.stop': 'ఆపండి',
    'chat.take_photo': 'కెమెరా ఫోటో తీయండి',
    'chat.upload_photo': 'ఫోటో అప్‌లోడ్ చేయండి',
    'chat.voice_input': 'వాయిస్ ద్వారా మాట్లాడండి',
    'chat.language_switch': 'సమాధానం భాష',
    'chat.retry': 'మళ్ళీ ప్రయత్నించండి',
    'chat.suggested_title': 'ముఖ్యమైన ప్రశ్నల సూచనలు',
    'chat.sources': 'ఆధారాలు',
    'chat.disease_detected': 'గుర్తించిన పంట తెగులు',
    'chat.confidence': 'ఖచ్చితత్వం',
    'chat.treatment': 'నివారణ చర్యలు & మందులు',
    'chat.prevention': 'ముందస్తు జాగ్రత్తలు',
    
    // Profile Page
    'profile.title': 'రైతు వ్యవసాయ ప్రొఫైల్',
    'profile.details': 'రైతు & వ్యవసాయ భూమి వివరాలు',
    'profile.desc': 'ఖచ్చితమైన వివరాలు అందించడం వల్ల కృషి AI మీ పంట, నేల మరియు ప్రాంతానికి తగినట్లుగా వ్యక్తిగతీకరించిన సలహాలను అందిస్తుంది.',
    'profile.name': 'రైతు పేరు',
    'profile.age': 'వయస్సు',
    'profile.pref_lang': 'ఇష్టమైన భాష',
    'profile.location': 'గ్రామం / జిల్లా / ప్రాంతం',
    'profile.land_size': 'వ్యవసాయ భూమి పరిమాణం (ఎకరాలు)',
    'profile.primary_crop': 'ప్రధాన పంట',
    'profile.soil_type': 'నేల రకం',
    'profile.crop_stage': 'ప్రస్తుత పంట దశ',
    'profile.save': 'వివరాలు సేవ్ చేయండి',
    'profile.saving': 'సేవ్ అవుతోంది...',
    'profile.success': 'రైతు ప్రొఫైల్ విజయవంతంగా అప్‌డేట్ చేయబడింది! కృషి AI ఇప్పుడు మీ పొలానికి తగిన సమాధానాలు ఇస్తుంది.',
    
    // Simulator
    'sim.title': 'కృషి విజన్ — వ్యవసాయ భవిష్యత్తు సిమ్యులేటర్',
    'sim.subtitle': 'పెట్టుబడి పెట్టే ముందు మీ పంట భవిష్యత్తును అంచనా వేయండి.',
    'sim.water': 'లభ్యమయ్యే నీటి శాతం',
    'sim.rain_delay': 'వర్షం ఆలస్యం (రోజులు)',
    'sim.temp': 'ఉష్ణోగ్రత మార్పు',
    'sim.price_shift': 'మార్కెట్ ధర మార్పు',
    'sim.budget': 'వ్యవసాయ బడ్జెట్ (₹)',
    'sim.best_choice': 'ఉత్తమ పంట సిఫార్సు',
    'sim.est_profit': 'అంచనా నికర లాభం',
    'sim.roi': 'పెట్టుబడిపై రాబడి (ROI)',
    'sim.score': 'AI స్కోర్',
    'sim.discuss_chat': 'కృషి AI చాట్‌లో చర్చించండి',
    'sim.deep_plan': 'లోతైన వ్యూహాత్మక ప్రణాళిక పొందండి',
    'sim.export': 'అంచనా డౌన్‌లోడ్ చేయండి',
    'sim.reset': 'సాధారణ స్థితికి రీసెట్ చేయండి',
    'sim.drought_preset': 'కరువు ఒత్తిడి',
    'sim.rain_delay_preset': 'వర్షం ఆలస్యం',
    'sim.market_boom_preset': 'మార్కెట్ డిమాండ్',
    'sim.low_budget_preset': 'తక్కువ బడ్జెట్',

    // Intelligent Autonomous Farm
    'auto_farm.title': 'ఇంటెలిజెంట్ అటానమస్ ఫార్మ్',
    'auto_farm.subtitle': 'AI + IoT ఆధారిత స్మార్ట్ నీటిపారుదల వ్యవస్థ',
    'auto_farm.simulated_badge': 'సిమ్యులేటెడ్ IoT డేటా',
    'auto_farm.live_sensor_data': 'లైవ్ సెన్సార్ డేటా',
    'auto_farm.ai_decision_engine': 'కృషి AI నిర్ణయ యంత్రం',
    'auto_farm.smart_motor_control': 'స్మార్ట్ వాటర్ మోటార్ కంట్రోల్',
    'auto_farm.farmer_notifications': 'రైతు నోటిఫికేషన్లు',
    'auto_farm.demo_controls': 'పొలం పరిస్థితులను సిమ్యులేట్ చేయండి',
    'auto_farm.start_live_demo': 'లైవ్ AI డెమో ప్రారంభించండి',
    'auto_farm.running_demo': 'లైవ్ AI డెమో నడుస్తోంది...',
    'auto_farm.reset_simulation': 'రీసెట్ చేయండి',
    'auto_farm.soil_moisture': 'నేల తేమ శాతం',
    'auto_farm.soil_temp': 'నేల ఉష్ణోగ్రత',
    'auto_farm.air_temp': 'గాలి ఉష్ణోగ్రత',
    'auto_farm.humidity': 'గాలిలో తేమ (హ్యుమిడిటీ)',
    'auto_farm.tank_level': 'నీటి ట్యాంక్ స్థాయి',
    'auto_farm.sensor_status': 'సెన్సార్ స్థితి',
    'auto_farm.online': 'ఆన్‌లైన్',
    'auto_farm.offline': 'ఆఫ్‌లైన్',
    'auto_farm.analyzing': 'కృషి AI ప్రస్తుత పొలం పరిస్థితులను విశ్లేషిస్తోంది...',
    'auto_farm.motor_on': 'మోటార్ ఆన్ (MOTOR ON)',
    'auto_farm.motor_off': 'మోటార్ ఆఫ్ (MOTOR OFF)',
    'auto_farm.manual_slider': 'తేమ శాతాన్ని సర్దుబాటు చేయండి',
    'auto_farm.flow_rate': 'నీటి ప్రవాహం వేగం',
    'auto_farm.pressure': 'పైపు ప్రెజర్',
    'auto_farm.hardware_arch': 'భవిష్యత్తు హార్డ్‌వేర్ ఇంటిగ్రేషన్ ఆర్కిటెక్చర్',
    'auto_farm.hardware_desc': 'ప్రస్తుత వెర్షన్ హ్యాకథాన్ ప్రదర్శన కొరకు రూపొందించిన సాఫ్ట్‌వేర్ సిమ్యులేషన్. వాస్తవ ESP32 సెన్సార్లు, రిలే మాడ్యూల్స్ మరియు వాటర్ మోటార్లతో అనుసంధానం చేయడానికి సిద్ధంగా ఉంది.',
    'auto_farm.crop_field': 'వ్యవసాయ పొలం',
    'auto_farm.irrigation_active': 'నీరు పారుతోంది',
    'auto_farm.system_idle': 'స్టాండ్‌బై స్థితి',
    'auto_farm.rule1_title': 'నియమం 1: తక్కువ తేమ + వర్షం లేదు',
    'auto_farm.rule2_title': 'నియమం 2: తక్కువ తేమ + త్వరలో వర్షం',
    'auto_farm.rule3_title': 'నియమం 3: సరిపడా తేమ',
    'auto_farm.rule4_title': 'నియమం 4: అధిక నీటి హెచ్చరిక',
    
    // Common & Alerts
    'common.loading': 'లోడ్ అవుతోంది...',
    'common.error': 'ఏదో లోపం జరిగింది.',
    'common.connected': 'కనెక్ట్ అయింది',
    'common.offline': 'ఆఫ్‌లైన్ మోడ్',
  },
  
  hi: {
    // Top Header & Nav
    'app.title': 'कृषि AI',
    'app.subtitle': 'स्मार्ट किसान सलाहकार',
    'header.simulate': 'फसल भविष्य सिमुलेटर',
    'header.rag': 'कृषि ज्ञान कोष',
    'header.voice': 'हिंदी वॉयस एक्टिव',
    'header.context': 'फसल विवरण:',
    'header.lang': 'भाषा',
    
    // Sidebar
    'sidebar.new_chat': 'नई बातचीत',
    'sidebar.simulator': 'फार्म फ्यूचर सिमुलेटर',
    'sidebar.auto_farm': 'इंटेलिजेंट ऑटोनॉमस फार्म',
    'sidebar.future_badge': 'FUTURE AI',
    'sidebar.profile': 'किसान प्रोफाइल',
    'sidebar.recent_chats': 'पिछली बातचीत',
    'sidebar.no_chats': 'कोई बातचीत नहीं है',
    'sidebar.logout': 'डिवाइस रीसेट',
    'sidebar.confirm_delete': 'क्या आप इस बातचीत को हटाना चाहते हैं?',
    'sidebar.delete': 'हटाएं',
    'sidebar.cancel': 'रद्द करें',
    
    // Chat Page & Input
    'chat.placeholder': 'फसल, रोग, खाद, मौसम या सिंचाई के बारे में कुछ भी पूछें...',
    'chat.listening': 'आपकी आवाज सुन रहे हैं...',
    'chat.processing_audio': 'आवाज प्रोसेस हो रही है...',
    'chat.analyzing_leaf': 'पत्ती की तस्वीर की जांच हो रही है...',
    'chat.send': 'भेजें',
    'chat.stop': 'रोकें',
    'chat.take_photo': 'फोटो खींचें',
    'chat.upload_photo': 'फोटो अपलोड करें',
    'chat.voice_input': 'बोलकर पूछें',
    'chat.language_switch': 'उत्तर की भाषा',
    'chat.retry': 'पुनः प्रयास करें',
    'chat.suggested_title': 'सुझाए गए मुख्य प्रश्न',
    'chat.sources': 'स्रोत',
    'chat.disease_detected': 'पहचाना गया फसल रोग',
    'chat.confidence': 'सटीकता',
    'chat.treatment': 'उपचार और रोकथाम उपाय',
    'chat.prevention': 'सावधानियां',
    
    // Profile Page
    'profile.title': 'किसान कृषि प्रोफाइल',
    'profile.details': 'किसान एवं कृषि भूमि विवरण',
    'profile.desc': 'सही जानकारी देने से कृषि AI आपकी फसल, मिट्टी और मौसम के अनुसार सटीक सलाह तैयार करता है।',
    'profile.name': 'किसान का नाम',
    'profile.age': 'उम्र',
    'profile.pref_lang': 'पसंदीदा भाषा',
    'profile.location': 'स्थान / गांव / जिला',
    'profile.land_size': 'खेत का आकार (एकड़)',
    'profile.primary_crop': 'मुख्य फसल',
    'profile.soil_type': 'मिट्टी का प्रकार',
    'profile.crop_stage': 'फसल की वर्तमान अवस्था',
    'profile.save': 'प्रोफाइल सेव करें',
    'profile.saving': 'सेव हो रहा है...',
    'profile.success': 'किसान प्रोफाइल सफलतापूर्वक अपडेट हो गया! कृषि AI अब आपके खेत के लिए तैयार है।',
    
    // Simulator
    'sim.title': 'कृषि विजन — फार्म फ्यूचर सिमुलेटर',
    'sim.subtitle': 'लागत लगाने से पहले फसल और मुनाफे का भविष्य परखें।',
    'sim.water': 'उपलब्ध पानी का स्तर',
    'sim.rain_delay': 'बारिश में देरी (दिन)',
    'sim.temp': 'तापमान बदलाव',
    'sim.price_shift': 'मंडी भाव बदलाव',
    'sim.budget': 'खेती का बजट (₹)',
    'sim.best_choice': 'सर्वोत्तम फसल सिफारिश',
    'sim.est_profit': 'अनुमानित शुद्ध मुनाफा',
    'sim.roi': 'निवेश पर लाभ (ROI)',
    'sim.score': 'AI स्कोर',
    'sim.discuss_chat': 'कृषि AI चैट में चर्चा करें',
    'sim.deep_plan': 'विस्तृत AI रणनीति प्राप्त करें',
    'sim.export': 'पूर्वानुमान एक्सपोर्ट करें',
    'sim.reset': 'रीसेट करें',
    'sim.drought_preset': 'सूखा तनाव',
    'sim.rain_delay_preset': 'मानसून देरी',
    'sim.market_boom_preset': 'मार्केट बूम',
    'sim.low_budget_preset': 'कम बजट',

    // Intelligent Autonomous Farm
    'auto_farm.title': 'इंटेलिजेंट ऑटोनॉमस फार्म',
    'auto_farm.subtitle': 'AI + IoT संचालित स्मार्ट सिंचाई प्रणाली',
    'auto_farm.simulated_badge': 'सिम्युलेटेड IoT डेटा',
    'auto_farm.live_sensor_data': 'लाइव सेंसर डेटा',
    'auto_farm.ai_decision_engine': 'कृषि AI निर्णय इंजन',
    'auto_farm.smart_motor_control': 'स्मार्ट वाटर मोटर कंट्रोल',
    'auto_farm.farmer_notifications': 'किसान नोटिफिकेशन पैनल',
    'auto_farm.demo_controls': 'खेत की स्थितियां सिम्युलेट करें',
    'auto_farm.start_live_demo': 'लाइव AI डेमो शुरू करें',
    'auto_farm.running_demo': 'लाइव AI डेमो चल रहा है...',
    'auto_farm.reset_simulation': 'रीसेट करें',
    'auto_farm.soil_moisture': 'मिट्टी की नमी',
    'auto_farm.soil_temp': 'मिट्टी का तापमान',
    'auto_farm.air_temp': 'हवा का तापमान',
    'auto_farm.humidity': 'हवा में नमी',
    'auto_farm.tank_level': 'पानी की टंकी का स्तर',
    'auto_farm.sensor_status': 'सेंसर स्थिति',
    'auto_farm.online': 'ऑनलाइन',
    'auto_farm.offline': 'ऑफलाइन',
    'auto_farm.analyzing': 'कृषि AI खेत की वास्तविक स्थिति का विश्लेषण कर रहा है...',
    'auto_farm.motor_on': 'मोटर चालू (MOTOR ON)',
    'auto_farm.motor_off': 'मोटर बंद (MOTOR OFF)',
    'auto_farm.manual_slider': 'नमी का स्तर बदलें',
    'auto_farm.flow_rate': 'पानी का बहाव',
    'auto_farm.pressure': 'पाइप का दबाव',
    'auto_farm.hardware_arch': 'भविष्य का वास्तविक हार्डवेयर आर्किटेक्चर',
    'auto_farm.hardware_desc': 'वर्तमान संस्करण हैकाथॉन प्रदर्शन के लिए सॉफ्टवेयर सिमुलेशन है। यह आर्किटेक्चर वास्तविक ESP32 सेंसर, रिले मॉड्यूल और पानी के पंप से जुड़ने के लिए तैयार है।',
    'auto_farm.crop_field': 'फसल का खेत',
    'auto_farm.irrigation_active': 'सिंचाई चालू है',
    'auto_farm.system_idle': 'स्टैंडबाय मोड',
    'auto_farm.rule1_title': 'नियम 1: कम नमी + बारिश नहीं',
    'auto_farm.rule2_title': 'नियम 2: कम नमी + बारिश का अनुमान',
    'auto_farm.rule3_title': 'नियम 3: पर्याप्त नमी',
    'auto_farm.rule4_title': 'नियम 4: अत्यधिक पानी चेतावनी',
    
    // Common & Alerts
    'common.loading': 'लोड हो रहा है...',
    'common.error': 'कोई त्रुटि हुई।',
    'common.connected': 'कनेक्टेड',
    'common.offline': 'ऑफलाइन मोड',
  },
  
  kn: {
    // Top Header & Nav
    'app.title': 'ಕೃಷಿ AI',
    'app.subtitle': 'ಬುದ್ಧಿವಂತ ರೈತ ಸಲಹೆಗಾರ',
    'header.simulate': 'ಬೆಳೆ ಭವಿಷ್ಯ ಸಿಮ್ಯುಲೇಟರ್',
    'header.rag': 'ಕೃಷಿ ಜ್ಞಾನ',
    'header.voice': 'ಧ್ವನಿ ಸಕ್ರಿಯ',
    'header.context': 'ಬೆಳೆ ವಿವರ:',
    'header.lang': 'ಭಾಷೆ',
    
    // Sidebar
    'sidebar.new_chat': 'ಹೊಸ ಸಂಭಾಷಣೆ',
    'sidebar.simulator': 'ಕೃಷಿ ಭವಿಷ್ಯ ಸಿಮ್ಯುಲೇಟರ್',
    'sidebar.auto_farm': 'ಇಂಟೆಲಿಜೆಂಟ್ ಸ್ವಾಯತ್ತ ಫಾರ್ಮ್',
    'sidebar.future_badge': 'FUTURE AI',
    'sidebar.profile': 'ರೈತ ವಿವರ',
    'sidebar.recent_chats': 'ಹಿಂದಿನ ಸಂಭಾಷಣೆಗಳು',
    'sidebar.no_chats': 'ಯಾವುದೇ ಸಂಭಾಷಣೆ ಇಲ್ಲ',
    'sidebar.logout': 'ರೀಸೆಟ್ ಮಾಡಿ',
    'sidebar.confirm_delete': 'ಈ ಸಂಭಾಷಣೆ ಅಳಿಸಬೇಕೇ?',
    'sidebar.delete': 'ಅಳಿಸಿ',
    'sidebar.cancel': 'ರದ್ದುಮಾಡಿ',
    
    // Chat Page & Input
    'chat.placeholder': 'ಬೆಳೆ, ರೋಗ, ಗೊಬ್ಬರ ಅಥವಾ ನೀರಿನ ಬಗ್ಗೆ ಯಾವುದೇ ಪ್ರಶ್ನೆ ಕೇಳಿ...',
    'chat.listening': 'ನಿಮ್ಮ ಧ್ವನಿ ಆಲಿಸಲಾಗುತ್ತಿದೆ...',
    'chat.processing_audio': 'ಆಡಿಯೋ ಪ್ರಕ್ರಿಯೆಗೊಳಿಸಲಾಗುತ್ತಿದೆ...',
    'chat.analyzing_leaf': 'ಎಲೆ ಚಿತ್ರವನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ...',
    'chat.send': 'ಕಳುಹಿಸಿ',
    'chat.stop': 'ನಿಲ್ಲಿಸಿ',
    'chat.take_photo': 'ಫೋಟೋ ತೆಗೆಯಿರಿ',
    'chat.upload_photo': 'ಚಿತ್ರ ಅಪ್ಲೋಡ್ ಮಾಡಿ',
    'chat.voice_input': 'ಧ್ವನಿಯ ಮೂಲಕ ಮಾತನಾಡಿ',
    'chat.language_switch': 'ಉತ್ತರದ ಭಾಷೆ',
    'chat.retry': 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
    'chat.suggested_title': 'ಸೂಚಿಸಲಾದ ಪ್ರಶ್ನೆಗಳು',
    'chat.sources': 'ಮೂಲಗಳು',
    'chat.disease_detected': 'ಪತ್ತೆಯಾದ ಬೆಳೆ ರೋಗ',
    'chat.confidence': 'ನಿಖರತೆ',
    'chat.treatment': 'ಚಿಕಿತ್ಸೆ ಮತ್ತು ಪರಿಹಾರಗಳು',
    'chat.prevention': 'ಮುನ್ನೆಚ್ಚರಿಕೆ ಕ್ರಮಗಳು',
    
    // Profile Page
    'profile.title': 'ರೈತ ಕೃಷಿ ಪ್ರೊಫೈಲ್',
    'profile.details': 'ರೈತ ಮತ್ತು ಕೃಷಿ ಭೂಮಿ ವಿವರಗಳು',
    'profile.desc': 'ನಿಖರ ಮಾಹಿತಿ ನೀಡುವುದರಿಂದ ಕೃಷಿ AI ನಿಮ್ಮ ಬೆಳೆ ಮತ್ತು ಮಣ್ಣಿಗೆ ಸೂಕ್ತವಾದ ಸಲಹೆ ನೀಡುತ್ತದೆ.',
    'profile.name': 'ರೈತನ ಹೆಸರು',
    'profile.age': 'ವಯಸ್ಸು',
    'profile.pref_lang': 'ಆದ್ಯತೆಯ ಭಾಷೆ',
    'profile.location': 'ಸ್ಥಳ / ಗ್ರಾಮ / ಜಿಲ್ಲೆ',
    'profile.land_size': 'ಭೂಮಿ ವಿಸ್ತೀರ್ಣ (ಎಕರೆ)',
    'profile.primary_crop': 'ಮುಖ್ಯ ಬೆಳೆ',
    'profile.soil_type': 'ಮಣ್ಣಿನ ವಿಧ',
    'profile.crop_stage': 'ಪ್ರಸ್ತುತ ಬೆಳೆ ಹಂತ',
    'profile.save': 'ಪ್ರೊಫೈಲ್ ಉಳಿಸಿ',
    'profile.saving': 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...',
    'profile.success': 'ರೈತ ಪ್ರೊಫೈಲ್ ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ!',
    
    // Simulator
    'sim.title': 'ಕೃಷಿ ವಿಷನ್ — ಕೃಷಿ ಭವಿಷ್ಯ ಸಿಮ್ಯುಲೇಟರ್',
    'sim.subtitle': 'ಹಣ ಹೂಡುವ ಮುನ್ನ ನಿಮ್ಮ ಬೆಳೆಯ ಭವಿಷ್ಯ ಅಂದಾಜಿಸಿ.',
    'sim.water': 'ಲಭ್ಯವಿರುವ ನೀರಿನ ಮಟ್ಟ',
    'sim.rain_delay': 'ಮಳೆ ವಿಳಂಬ (ದಿನಗಳು)',
    'sim.temp': 'ತಾಪಮಾನ ಬದಲಾವಣೆ',
    'sim.price_shift': 'ಮಾರುಕಟ್ಟೆ ಬೆಲೆ ಬದಲಾವಣೆ',
    'sim.budget': 'ಕೃಷಿ ಬಜೆಟ್ (₹)',
    'sim.best_choice': 'ಅತ್ಯುತ್ತಮ ಬೆಳೆ ಶಿಫಾರಸು',
    'sim.est_profit': 'ಅಂದಾಜು ನಿವ್ವಳ ಲಾಭ',
    'sim.roi': 'ಹೂಡಿಕೆಯ ಮೇಲಿನ ಲಾಭ (ROI)',
    'sim.score': 'AI ಸ್ಕೋರ್',
    'sim.discuss_chat': 'ಕೃಷಿ AI ಚಾಟ್‌ನಲ್ಲಿ ಚರ್ಚಿಸಿ',
    'sim.deep_plan': 'ಆಳವಾದ AI ಯೋಜನೆ ಪಡೆಯಿರಿ',
    'sim.export': 'ಅಂದಾಜು ರಫ್ತು ಮಾಡಿ',
    'sim.reset': 'ಮರುಹೊಂದಿಸಿ',
    'sim.drought_preset': 'ಬರಗಾಲ ಒತ್ತಡ',
    'sim.rain_delay_preset': 'ಮಳೆ ವಿಳಂಬ',
    'sim.market_boom_preset': 'ಮಾರುಕಟ್ಟೆ ಬೇಡಿಕೆ',
    'sim.low_budget_preset': 'ಕಡಿಮೆ ಬಜೆಟ್',

    // Intelligent Autonomous Farm
    'auto_farm.title': 'ಇಂಟೆಲಿಜೆಂಟ್ ಸ್ವಾಯತ್ತ ಫಾರ್ಮ್',
    'auto_farm.subtitle': 'AI + IoT ಚಾಲಿತ ಸ್ಮಾರ್ಟ್ ನೀರಾವರಿ ವ್ಯವಸ್ಥೆ',
    'auto_farm.simulated_badge': 'ಸಿಮ್ಯುಲೇಟೆಡ್ IoT ಡೇಟಾ',
    'auto_farm.live_sensor_data': 'ಲೈವ್ ಸಂವೇದಕ ಡೇಟಾ',
    'auto_farm.ai_decision_engine': 'ಕೃಷಿ AI ನಿರ್ಧಾರ ಎಂಜಿನ್',
    'auto_farm.smart_motor_control': 'ಸ್ಮಾರ್ಟ್ ವಾಟರ್ ಮೋಟರ್ ನಿಯಂತ್ರಣ',
    'auto_farm.farmer_notifications': 'ರೈತ ಅಧಿಸೂಚನೆಗಳು',
    'auto_farm.demo_controls': 'ಕೃಷಿ ಪರಿಸ್ಥಿತಿಗಳನ್ನು ಅನುಕರಿಸಿ',
    'auto_farm.start_live_demo': 'ಲೈವ್ AI ಡೆಮೊ ಪ್ರಾರಂಭಿಸಿ',
    'auto_farm.running_demo': 'ಲೈವ್ AI ಡೆಮೊ ಚಾಲನೆಯಲ್ಲಿದೆ...',
    'auto_farm.reset_simulation': 'ಮರುಹೊಂದಿಸಿ',
    'auto_farm.soil_moisture': 'ಮಣ್ಣಿನ ತೇವಾಂಶ',
    'auto_farm.soil_temp': 'ಮಣ್ಣಿನ ತಾಪಮಾನ',
    'auto_farm.air_temp': 'ಗಾಳಿಯ ತಾಪಮಾನ',
    'auto_farm.humidity': 'ಗಾಳಿಯಲ್ಲಿ ತೇವಾಂಶ',
    'auto_farm.tank_level': 'ನೀರಿನ ಟ್ಯಾಂಕ್ ಮಟ್ಟ',
    'auto_farm.sensor_status': 'ಸಂವೇದಕ ಸ್ಥಿತಿ',
    'auto_farm.online': 'ಆನ್‌ಲೈನ್',
    'auto_farm.offline': 'ಆಫ್‌ಲೈನ್',
    'auto_farm.analyzing': 'ಕೃಷಿ AI ನೈಜ-ಸಮಯದ ಕೃಷಿ ಪರಿಸ್ಥಿತಿಗಳನ್ನು ವಿಶ್ಲೇಷಿಸುತ್ತಿದೆ...',
    'auto_farm.motor_on': 'ಮೋಟರ್ ಆನ್ (MOTOR ON)',
    'auto_farm.motor_off': 'ಮೋಟರ್ ಆಫ್ (MOTOR OFF)',
    'auto_farm.manual_slider': 'ತೇವಾಂಶ ಬದಲಾಯಿಸಿ',
    'auto_farm.flow_rate': 'ನೀರಿನ ಹರಿವಿನ ದರ',
    'auto_farm.pressure': 'ಪೈಪ್ ಒತ್ತಡ',
    'auto_farm.hardware_arch': 'ಭವಿಷ್ಯದ ಹಾರ್ಡ್‌ವೇರ್ ಆರ್ಕಿಟೆಕ್ಚರ್',
    'auto_farm.hardware_desc': 'ಪ್ರಸ್ತುತ ಆವೃತ್ತಿಯು ಹ್ಯಾಕಥಾನ್ ಪ್ರದರ್ಶನಕ್ಕಾಗಿ ಸಾಫ್ಟ್‌ವೇರ್ ಸಿಮ್ಯುಲೇಶನ್ ಆಗಿದೆ. ಭವಿಷ್ಯದಲ್ಲಿ ನೈಜ ESP32 ಸಂವೇದಕಗಳು ಮತ್ತು ನೀರಿನ ಪಂಪ್‌ಗಳೊಂದಿಗೆ ಸಂಯೋಜಿಸಲು ಸಿದ್ಧವಾಗಿದೆ.',
    'auto_farm.crop_field': 'ಬೆಳೆ ಜಮೀನು',
    'auto_farm.irrigation_active': 'ನೀರಾವರಿ ಸಕ್ರಿಯವಾಗಿದೆ',
    'auto_farm.system_idle': 'ಸ್ಟ್ಯಾಂಡ್‌ಬೈ ಸ್ಥಿತಿ',
    'auto_farm.rule1_title': 'ನಿಯಮ 1: ಕಡಿಮೆ ತೇವಾಂಶ + ಮಳೆ ಇಲ್ಲ',
    'auto_farm.rule2_title': 'ನಿಯಮ 2: ಕಡಿಮೆ ತೇವಾಂಶ + ಶೀಘ್ರದಲ್ಲೇ ಮಳೆ',
    'auto_farm.rule3_title': 'ನಿಯಮ 3: ಸೂಕ್ತ ತೇವಾಂಶ',
    'auto_farm.rule4_title': 'ನಿಯಮ 4: ಹೆಚ್ಚಿನ ನೀರಿನ ಎಚ್ಚರಿಕೆ',
    
    // Common & Alerts
    'common.loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ...',
    'common.error': 'ದೋಷ ಸಂಭವಿಸಿದೆ.',
    'common.connected': 'ಸಂಪರ್ಕಗೊಂಡಿದೆ',
    'common.offline': 'ಆಫ್‌ಲೈನ್ ಮೋಡ್',
  },
  
  ta: {
    // Top Header & Nav
    'app.title': 'கிருஷி AI',
    'app.subtitle': 'விவசாய நுண்ணறிவு ஆலோசகர்',
    'header.simulate': 'பயிர் எதிர்கால கணிப்பு',
    'header.rag': 'விவசாய அறிவுக்களஞ்சியம்',
    'header.voice': 'குரல் சேவை தயார்',
    'header.context': 'பயிர் விவரம்:',
    'header.lang': 'மொழி',
    
    // Sidebar
    'sidebar.new_chat': 'புதிய உரையாடல்',
    'sidebar.simulator': 'பயிர் எதிர்கால சிமுலேட்டர்',
    'sidebar.auto_farm': 'நுண்ணறிவு தன்னாட்சி பண்ணை',
    'sidebar.future_badge': 'FUTURE AI',
    'sidebar.profile': 'விவசாயி சுயவிவரம்',
    'sidebar.recent_chats': 'முந்தைய உரையாடல்கள்',
    'sidebar.no_chats': 'உரையாடல்கள் இல்லை',
    'sidebar.logout': 'ரீசெட் செய்',
    'sidebar.confirm_delete': 'இந்த உரையாடலை நீக்கவா?',
    'sidebar.delete': 'நீக்கு',
    'sidebar.cancel': 'ரத்து செய்',
    
    // Chat Page & Input
    'chat.placeholder': 'பயிர், பூச்சிகள், உரம் அல்லது பாசனம் பற்றி எதையும் கேளுங்கள்...',
    'chat.listening': 'உங்கள் குரல் கேட்கப்படுகிறது...',
    'chat.processing_audio': 'குரல் பதிவு செயலாக்கப்படுகிறது...',
    'chat.analyzing_leaf': 'இலை படம் பகுப்பாய்வு செய்யப்படுகிறது...',
    'chat.send': 'அனுப்பு',
    'chat.stop': 'நிறுத்து',
    'chat.take_photo': 'புகைப்படம் எடு',
    'chat.upload_photo': 'படம் பதிவேற்று',
    'chat.voice_input': 'பேசி கேளுங்கள்',
    'chat.language_switch': 'பதில் மொழி',
    'chat.retry': 'மீண்டும் முயற்சி செய்',
    'chat.suggested_title': 'பரிந்துரைக்கப்பட்ட கேள்விகள்',
    'chat.sources': 'ஆதாரங்கள்',
    'chat.disease_detected': 'கண்டறியப்பட்ட பயிர் நோய்',
    'chat.confidence': 'துல்லியம்',
    'chat.treatment': 'சிகிச்சை மற்றும் தீர்வுகள்',
    'chat.prevention': 'தடுப்பு முறைகள்',
    
    // Profile Page
    'profile.title': 'விவசாயி விவரம்',
    'profile.details': 'விவசாயி மற்றும் நில விவரங்கள்',
    'profile.desc': 'துல்லியமான விவரங்களை வழங்குவது கிருஷி AI உங்கள் நிலத்திற்கு ஏற்ற ஆலோசனையை வழங்க உதவும்.',
    'profile.name': 'விவசாயி பெயர்',
    'profile.age': 'வயது',
    'profile.pref_lang': 'விருப்பமான மொழி',
    'profile.location': 'இடம் / கிராமம் / மாவட்டம்',
    'profile.land_size': 'நிலப்பரப்பு (ஏக்கர்)',
    'profile.primary_crop': 'முக்கிய பயிர்',
    'profile.soil_type': 'மண் வகை',
    'profile.crop_stage': 'தற்போதைய பயிர் நிலை',
    'profile.save': 'விவரங்களை சேமி',
    'profile.saving': 'சேமிக்கப்படுகிறது...',
    'profile.success': 'விவசாயி சுயவிவரம் வெற்றிகரமாக புதுப்பிக்கப்பட்டது!',
    
    // Simulator
    'sim.title': 'கிருஷி விஷன் — பயிர் எதிர்கால சிமுலேட்டர்',
    'sim.subtitle': 'முதலீடு செய்வதற்கு முன் உங்கள் பயிரின் எதிர்காலத்தை கணிக்கவும்.',
    'sim.water': 'கிடைக்கும் நீர் அளவு',
    'sim.rain_delay': 'மழை தாமதம் (நாட்கள்)',
    'sim.temp': 'வெப்பநிலை மாற்றம்',
    'sim.price_shift': 'சந்தை விலை மாற்றம்',
    'sim.budget': 'விவசாய பட்ஜெட் (₹)',
    'sim.best_choice': 'சிறந்த பயிர் பரிந்துரை',
    'sim.est_profit': 'மதிப்பிடப்பட்ட நிகர லாபம்',
    'sim.roi': 'முதலீட்டின் மீதான லாபம் (ROI)',
    'sim.score': 'AI மதிப்பெண்',
    'sim.discuss_chat': 'கிருஷி AI சாட்டில் விவாதிக்கவும்',
    'sim.deep_plan': 'முழுமையான திட்டத்தை பெறுங்கள்',
    'sim.export': 'கணிப்பை பதிவிறக்கு',
    'sim.reset': 'இயல்பு நிலைக்கு மாற்று',
    'sim.drought_preset': 'வறட்சி அழுத்தம்',
    'sim.rain_delay_preset': 'மழை தாமதம்',
    'sim.market_boom_preset': 'சந்தை தேவை',
    'sim.low_budget_preset': 'குறைந்த பட்ஜெட்',

    // Intelligent Autonomous Farm
    'auto_farm.title': 'நுண்ணறிவு தன்னாட்சி பண்ணை',
    'auto_farm.subtitle': 'AI + IoT இயங்கும் ஸ்மார்ட் பாசன அமைப்பு',
    'auto_farm.simulated_badge': 'சிமுலேட்டட் IoT தரவு',
    'auto_farm.live_sensor_data': 'நேரலை சென்சார் தரவு',
    'auto_farm.ai_decision_engine': 'கிருஷி AI முடிவு இயந்திரம்',
    'auto_farm.smart_motor_control': 'ஸ்மார்ட் வாட்டர் மோட்டார் கட்டுப்பாடு',
    'auto_farm.farmer_notifications': 'விவசாயி அறிவிப்புகள்',
    'auto_farm.demo_controls': 'பண்ணை நிலைமைகளை சிமுலேட் செய்க',
    'auto_farm.start_live_demo': 'நேரலை AI டெமோ தொடங்கு',
    'auto_farm.running_demo': 'நேரலை AI டெமோ இயங்குகிறது...',
    'auto_farm.reset_simulation': 'மீட்டமைக்க',
    'auto_farm.soil_moisture': 'மண் ஈரப்பதம்',
    'auto_farm.soil_temp': 'மண் வெப்பநிலை',
    'auto_farm.air_temp': 'காற்று வெப்பநிலை',
    'auto_farm.humidity': 'காற்றின் ஈரப்பதம்',
    'auto_farm.tank_level': 'நீர் தொட்டி நிலை',
    'auto_farm.sensor_status': 'சென்சார் நிலை',
    'auto_farm.online': 'ஆன்லைன்',
    'auto_farm.offline': 'ஆஃப்லைன்',
    'auto_farm.analyzing': 'கிருஷி AI பண்ணை நிலைமைகளை ஆய்வு செய்கிறது...',
    'auto_farm.motor_on': 'மோட்டார் ஆன் (MOTOR ON)',
    'auto_farm.motor_off': 'மோட்டார் ஆஃப் (MOTOR OFF)',
    'auto_farm.manual_slider': 'ஈரப்பதத்தை மாற்றுக',
    'auto_farm.flow_rate': 'நீர் பாயும் வேகம்',
    'auto_farm.pressure': 'பைப் அழுத்தம்',
    'auto_farm.hardware_arch': 'எதிர்கால ஹார்டுவேர் கட்டமைப்பு',
    'auto_farm.hardware_desc': 'தற்போதைய பதிப்பு ஹேக்கத்தான் செயல்விளக்கத்திற்கான மென்பொருள் உருவகப்படுத்துதலாகும். எதிர்காலத்தில் உண்மையான ESP32 சென்சார்கள் மற்றும் நீர் பம்ப்களுடன் இணைக்க வடிவமைக்கப்பட்டுள்ளது.',
    'auto_farm.crop_field': 'பயிர் நிலம்',
    'auto_farm.irrigation_active': 'பாசனம் இயக்கத்தில் உள்ளது',
    'auto_farm.system_idle': 'காத்திருப்பு நிலை',
    'auto_farm.rule1_title': 'விதி 1: குறைந்த ஈரப்பதம் + மழை இல்லை',
    'auto_farm.rule2_title': 'விதி 2: குறைந்த ஈரப்பதம் + மழை வாய்ப்பு',
    'auto_farm.rule3_title': 'விதி 3: உகந்த ஈரப்பதம்',
    'auto_farm.rule4_title': 'விதி 4: அதிக நீர் எச்சரிக்கை',
    
    // Common & Alerts
    'common.loading': 'ஏற்றப்படுகிறது...',
    'common.error': 'பிழை ஏற்பட்டது.',
    'common.connected': 'இணைக்கப்பட்டது',
    'common.offline': 'ஆஃப்லைன் முறை',
  },
  
  mr: {
    // Top Header & Nav
    'app.title': 'कृषी AI',
    'app.subtitle': 'स्मार्ट शेतकरी सल्लागार',
    'header.simulate': 'पीक भविष्य सिम्युलेटर',
    'header.rag': 'कृषी ज्ञान कोष',
    'header.voice': 'व्हॉइस सक्रिय',
    'header.context': 'पीक तपशील:',
    'header.lang': 'भाषा',
    
    // Sidebar
    'sidebar.new_chat': 'नवीन संवाद',
    'sidebar.simulator': 'फार्म फ्युचर सिम्युलेटर',
    'sidebar.auto_farm': 'स्मार्ट स्वायत्त शेती',
    'sidebar.future_badge': 'FUTURE AI',
    'sidebar.profile': 'शेतकरी प्रोफाइल',
    'sidebar.recent_chats': 'मागील संवाद',
    'sidebar.no_chats': 'कोणताही संवाद नाही',
    'sidebar.logout': 'डिव्हाइस रीसेट करा',
    'sidebar.confirm_delete': 'हा संवाद हटवायचा आहे का?',
    'sidebar.delete': 'हटवा',
    'sidebar.cancel': 'रद्द करा',
    
    // Chat Page & Input
    'chat.placeholder': 'पीक, रोग, खत किंवा हवामानाबद्दल काहीही विचारा...',
    'chat.listening': 'तुमचा आवाज ऐकत आहे...',
    'chat.processing_audio': 'आवाज प्रक्रिया होत आहे...',
    'chat.analyzing_leaf': 'पानाच्या फोटोचे विश्लेषण सुरू आहे...',
    'chat.send': 'पाठवा',
    'chat.stop': 'थांबवा',
    'chat.take_photo': 'फोटो काढा',
    'chat.upload_photo': 'फोटो अपलोड करा',
    'chat.voice_input': 'बोलून विचारा',
    'chat.language_switch': 'उत्तराची भाषा',
    'chat.retry': 'पुन्हा प्रयत्न करा',
    'chat.suggested_title': 'सुचवलेले महत्त्वाचे प्रश्न',
    'chat.sources': 'संदर्भ',
    'chat.disease_detected': 'आढळलेला पीक रोग',
    'chat.confidence': 'अचूकता',
    'chat.treatment': 'उपचार व उपाय',
    'chat.prevention': 'प्रतिबंधक काळजी',
    
    // Profile Page
    'profile.title': 'शेतकरी कृषी प्रोफाइल',
    'profile.details': 'शेतकरी व शेतजमीन तपशील',
    'profile.desc': 'अचूक माहिती दिल्यास कृषी AI तुमच्या पिकासाठी आणि जमिनीसाठी योग्य सल्ला तयार करेल.',
    'profile.name': 'शेतकऱ्याचे नाव',
    'profile.age': 'वय',
    'profile.pref_lang': 'पसंतीची भाषा',
    'profile.location': 'ठिकाण / गाव / जिल्हा',
    'profile.land_size': 'शेती क्षेत्र (एकर)',
    'profile.primary_crop': 'मुख्य पीक',
    'profile.soil_type': 'मातीचा प्रकार',
    'profile.crop_stage': 'सध्याची पीक अवस्था',
    'profile.save': 'माहिती सेव्ह करा',
    'profile.saving': 'सेव्ह होत आहे...',
    'profile.success': 'शेतकरी प्रोफाइल यशस्वीरित्या अपडेट केले!',
    
    // Simulator
    'sim.title': 'कृषी व्हिजन — फार्म फ्युचर सिम्युलेटर',
    'sim.subtitle': 'खर्च करण्यापूर्वी तुमच्या पिकाचे भविष्य तपासा.',
    'sim.water': 'उपलब्ध पाणी पातळी',
    'sim.rain_delay': 'पावसाचा उशीर (दिवस)',
    'sim.temp': 'तापमान बदल',
    'sim.price_shift': 'बाजारभाव बदल',
    'sim.budget': 'शेतीचे बजेट (₹)',
    'sim.best_choice': 'सर्वोत्तम पीक शिफारस',
    'sim.est_profit': 'अंदाजे निव्वळ नफा',
    'sim.roi': 'गुंतवणुकीवरील नफा (ROI)',
    'sim.score': 'AI स्कोअर',
    'sim.discuss_chat': 'कृषी AI चॅटमध्ये चर्चा करा',
    'sim.deep_plan': 'सखोल AI योजना मिळवा',
    'sim.export': 'अंदाज एक्सपोर्ट करा',
    'sim.reset': 'रीसेट करा',
    'sim.drought_preset': 'दुष्काळ ताण',
    'sim.rain_delay_preset': 'पावसाचा उशीर',
    'sim.market_boom_preset': 'मार्केट बूम',
    'sim.low_budget_preset': 'कमी बजेट',

    // Intelligent Autonomous Farm
    'auto_farm.title': 'स्मार्ट स्वायत्त शेती',
    'auto_farm.subtitle': 'AI + IoT आधारित स्मार्ट सिंचन प्रणाली',
    'auto_farm.simulated_badge': 'सिम्युलेटेड IoT डेटा',
    'auto_farm.live_sensor_data': 'थेट सेन्सर डेटा',
    'auto_farm.ai_decision_engine': 'कृषी AI निर्णय इंजिन',
    'auto_farm.smart_motor_control': 'स्मार्ट वॉटर मोटर नियंत्रण',
    'auto_farm.farmer_notifications': 'शेतकरी सूचना पॅनेल',
    'auto_farm.demo_controls': 'शेतातील परिस्थिती सिम्युलेट करा',
    'auto_farm.start_live_demo': 'थेट AI डेमो सुरू करा',
    'auto_farm.running_demo': 'थेट AI डेमो सुरू आहे...',
    'auto_farm.reset_simulation': 'रीसेट करा',
    'auto_farm.soil_moisture': 'मातीतील ओलावा',
    'auto_farm.soil_temp': 'मातीचे तापमान',
    'auto_farm.air_temp': 'हवेचे तापमान',
    'auto_farm.humidity': 'हवेतील आर्द्रता',
    'auto_farm.tank_level': 'पाण्याच्या टाकीची पातळी',
    'auto_farm.sensor_status': 'सेन्सर स्थिती',
    'auto_farm.online': 'ऑनलाइन',
    'auto_farm.offline': 'ऑफलाइन',
    'auto_farm.analyzing': 'कृषी AI शेतातील परिस्थितीचे विश्लेषण करत आहे...',
    'auto_farm.motor_on': 'मोटर चालू (MOTOR ON)',
    'auto_farm.motor_off': 'मोटर बंद (MOTOR OFF)',
    'auto_farm.manual_slider': 'ओलावा पातळी बदला',
    'auto_farm.flow_rate': 'पाण्याचा प्रवाह दर',
    'auto_farm.pressure': 'पाईपचा दाब',
    'auto_farm.hardware_arch': 'भविष्यातील हार्डवेअर आर्किटेक्चर',
    'auto_farm.hardware_desc': 'सध्याची आवृत्ती हॅकाथॉन सादरीकरणासाठी सॉफ्टवेअर सिम्युलेशन आहे. हे आर्किटेक्चर वास्तविक ESP32 सेन्सर्स आणि वॉटर पंपांशी जोडण्यासाठी डिझाइन केलेले आहे.',
    'auto_farm.crop_field': 'पिकांचे शेत',
    'auto_farm.irrigation_active': 'सिंचन सुरू आहे',
    'auto_farm.system_idle': 'स्टँडबाय मोड',
    'auto_farm.rule1_title': 'नियम 1: कमी ओलावा + पाऊस नाही',
    'auto_farm.rule2_title': 'నియम 2: कमी ओलावा + पावसाचा अंदाज',
    'auto_farm.rule3_title': 'नियम 3: पुरेसा ओलावा',
    'auto_farm.rule4_title': 'नियम 4: अति पाणी चेतावणी',
    
    // Common & Alerts
    'common.loading': 'लोड होत आहे...',
    'common.error': 'त्रुटी आढळली.',
    'common.connected': 'कनेक्ट झाले',
    'common.offline': 'ऑफलाइन मोड',
  }
};

// Localized Quick Suggestions
export const LOCALIZED_SUGGESTIONS: Record<SupportedLanguage, Array<{ title: string; prompt: string; category: string }>> = {
  en: [
    { title: '🌱 Crop Pathology', prompt: 'My tomato leaves are turning yellow with brown spots. What could be the cause and cure?', category: 'disease' },
    { title: '💧 Irrigation & Yield', prompt: 'How much water does Groundnut need during the pod development stage?', category: 'water' },
    { title: '🧪 Fertilizer Schedule', prompt: 'What is the optimal N-P-K fertilizer ratio for paddy rice in black soil?', category: 'fertilizer' },
    { title: '🌾 Pest Management', prompt: 'What biological pesticides can I use to prevent fall armyworm in maize?', category: 'pest' },
  ],
  te: [
    { title: '🌱 తెగుళ్ల నివారణ', prompt: 'నా టమాటా మొక్కల ఆకులు పసుపు రంగులోకి మారి ఎండిపోతున్నాయి. నివారణ చర్యలు చెప్పండి.', category: 'disease' },
    { title: '💧 నీటి యాజమాన్యం', prompt: 'వరి సాగులో నీటి యాజమాన్యం మరియు పసుపు మచ్చల నివారణ గురించి చెప్పండి.', category: 'water' },
    { title: '🧪 ఎరువుల యాజమాన్యం', prompt: 'నల్లరేగడి నేలలో వేరుశనగ పంటకు ఏ ఎరువులు ఎప్పుడు వేయాలి?', category: 'fertilizer' },
    { title: '🌾 కరువు తట్టుకునే పంటలు', prompt: 'తక్కువ వర్షపాతం ఉన్నప్పుడు సాగు చేయడానికి అనువైన లాభదాయక పంటలు ఏవి?', category: 'crops' },
  ],
  hi: [
    { title: '🌱 फसल रोग निदान', prompt: 'मेरे टमाटर के पत्तों पर पीले धब्बे आ रहे हैं, इसका क्या कारण और उपचार है?', category: 'disease' },
    { title: '💧 सिंचाई प्रबंधन', prompt: 'धान की फसल में बालियां निकलते समय पानी का प्रबंधन कैसे करें?', category: 'water' },
    { title: '🧪 खाद एवं पोषण', prompt: 'काली मिट्टी में मूंगफली की खेती के लिए सबसे उपयुक्त खाद कौन सी है?', category: 'fertilizer' },
    { title: '🌾 कीट रोकथाम', prompt: 'मक्के में फॉल आर्मीवॉर्म की रोकथाम के लिए जैविक कीटनाशक बताएं।', category: 'pest' },
  ],
  kn: [
    { title: '🌱 ಬೆಳೆ ರೋಗ ಪರಿಹಾರ', prompt: 'ನನ್ನ ಟೊಮೆಟೊ ಎಲೆಗಳು ಹಳದಿಯಾಗುತ್ತಿವೆ, ಇದಕ್ಕೆ ಕಾರಣ ಮತ್ತು ಔಷಧ ಏನು?', category: 'disease' },
    { title: '💧 ನೀರಾವರಿ ನಿರ್ವಹಣೆ', prompt: 'ಭತ್ತದ ಬೆಳೆಯಲ್ಲಿ ನೀರು ನಿರ್ವಹಣೆ ಮತ್ತು ರೋಗ ನಿಯಂತ್ರಣ ಹೇಗೆ ಮಾಡಬೇಕು?', category: 'water' },
    { title: '🧪 ಗೊಬ್ಬರ ಬಳಕೆ', prompt: 'ಕಪ್ಪು ಮಣ್ಣಿನಲ್ಲಿ ಶೇಂಗಾ ಬೆಳೆಗೆ ಸೂಕ್ತವಾದ ಗೊಬ್ಬರಗಳು ಯಾವುವು?', category: 'fertilizer' },
    { title: '🌾 ಕೀಟ ನಿಯಂತ್ರಣ', prompt: 'ಮೆಕ್ಕೆಜೋಳದ ಸೈನಿಕ ಹುಳು ನಿಯಂತ್ರಣಕ್ಕೆ ಜೈವಿಕ ಕೀಟನಾಶಕಗಳು ಯಾವುವು?', category: 'pest' },
  ],
  ta: [
    { title: '🌱 பயிர் நோய் தடுப்பு', prompt: 'என் தக்காளி இலைகள் மஞ்சள் நிறமாக மாறுகின்றன, இதற்கு என்ன காரணம் மற்றும் தீர்வு?', category: 'disease' },
    { title: '💧 நீர் மேலாண்மை', prompt: 'நெல் சாகுபடியில் நீர் மேலாண்மை மற்றும் இலைக்கருகல் நோய் கட்டுப்பாடு எப்படி?', category: 'water' },
    { title: '🧪 உர பயன்பாடு', prompt: 'கரிசல் மண்ணில் நிலக்கடலை சாகுபடிக்கு சிறந்த உரம் எது?', category: 'fertilizer' },
    { title: '🌾 பூச்சி கட்டுப்பாடு', prompt: 'மக்காச்சோளத்தில் படைப்புழு தாக்குதலை இயற்கை முறையில் தடுப்பது எப்படி?', category: 'pest' },
  ],
  mr: [
    { title: '🌱 पीक रोग नियंत्रण', prompt: 'माझ्या टोमॅटोची पाने पिवळी पडत आहेत, यावर काय उपाय करावा?', category: 'disease' },
    { title: '💧 पाणी व्यवस्थापन', prompt: 'भात शेतीमध्ये पाणी व्यवस्थापन आणि रोगांचे नियंत्रण कसे करावे?', category: 'water' },
    { title: '🧪 खत व्यवस्थापन', prompt: 'काळ्या जमिनीत भुईमुगासाठी कोणते खत योग्य आहे?', category: 'fertilizer' },
    { title: '🌾 कीड नियंत्रण', prompt: 'मक्यावरील लष्करी अळी रोखण्यासाठी कोणते जैविक कीटकनाशक वापरावे?', category: 'pest' },
  ],
};
export interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  currentLanguageOption: LanguageOption;
  supportedLanguages: LanguageOption[];
  setLanguage: (lang: SupportedLanguage, isManual?: boolean) => void;
  cycleNextLanguage: () => SupportedLanguage;
  t: (key: string, defaultText?: string) => string;
  getSuggestions: () => Array<{ title: string; prompt: string; category: string }>;
  isManualSelection: boolean;
  translateText: (text: string, targetLang?: SupportedLanguage) => Promise<string>;
  translateBatch: (texts: string[], targetLang?: SupportedLanguage) => Promise<string[]>;
  translateWeather: (weatherString: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { farmerProfile } = useAuth();

  const [currentLanguage, setCurrentLanguageState] = useState<SupportedLanguage>(() => {
    // 1. Check localStorage first
    const savedLang = localStorage.getItem('krishi_selected_language');
    if (savedLang && ['en', 'te', 'hi', 'kn', 'ta', 'mr'].includes(savedLang)) {
      return savedLang as SupportedLanguage;
    }
    // 2. Otherwise default to 'en' (or profile when loaded)
    return 'en';
  });

  const [isManualSelection, setIsManualSelection] = useState<boolean>(() => {
    return localStorage.getItem('krishi_manual_lang_set') === 'true';
  });

  // Sync with farmer profile default if not manually overridden by user
  useEffect(() => {
    if (farmerProfile?.preferred_language && !isManualSelection) {
      const normalized = normalizeLanguageCode(farmerProfile.preferred_language);
      if (normalized !== currentLanguage) {
        setCurrentLanguageState(normalized);
        localStorage.setItem('krishi_selected_language', normalized);
      }
    }
  }, [farmerProfile?.preferred_language, isManualSelection]);

  const setLanguage = (lang: SupportedLanguage, isManual: boolean = true) => {
    setCurrentLanguageState(lang);
    localStorage.setItem('krishi_selected_language', lang);
    if (isManual) {
      setIsManualSelection(true);
      localStorage.setItem('krishi_manual_lang_set', 'true');
    }
  };

  const cycleNextLanguage = (): SupportedLanguage => {
    const currentIndex = SUPPORTED_LANGUAGES.findIndex((l) => l.code === currentLanguage);
    const nextIndex = (currentIndex + 1) % SUPPORTED_LANGUAGES.length;
    const nextLang = SUPPORTED_LANGUAGES[nextIndex].code;
    setLanguage(nextLang, true);
    return nextLang;
  };

  const t = (key: string, defaultText?: string): string => {
    const langDict = TRANSLATIONS[currentLanguage] || TRANSLATIONS.en;
    if (langDict[key]) return langDict[key];
    const fallbackDict = TRANSLATIONS.en;
    if (fallbackDict[key]) return fallbackDict[key];
    return defaultText || key;
  };

  const getSuggestions = () => {
    return LOCALIZED_SUGGESTIONS[currentLanguage] || LOCALIZED_SUGGESTIONS.en;
  };

  const translateText = async (text: string, targetLang?: SupportedLanguage): Promise<string> => {
    const lang = targetLang || currentLanguage;
    return await translationService.translateText(text, lang);
  };

  const translateBatch = async (texts: string[], targetLang?: SupportedLanguage): Promise<string[]> => {
    const lang = targetLang || currentLanguage;
    return await translationService.translateBatch(texts, lang);
  };

  const translateWeather = (weatherString: string): string => {
    if (!weatherString) return '';
    const quick = translationService.getQuickTranslation(weatherString, currentLanguage);
    if (quick) return quick;

    // Handle compound phrases like "Rain in 3 hours"
    if (currentLanguage === 'te') {
      let res = weatherString;
      res = res.replace(/Rain:\s*In\s*(\d+)\s*hours/i, '$1 గంటల్లో వర్షం');
      res = res.replace(/Rain in\s*(\d+)\s*hours/i, '$1 గంటల్లో వర్షం');
      res = res.replace(/Rain likely in\s*(\d+)\s*hours/i, '$1 గంటల్లో వర్షం');
      res = res.replace(/Rain expected tomorrow/i, 'రేపు వర్షం');
      res = res.replace(/Clear weather in upcoming 48 hours/i, '48 గంటల్లో నిర్మలమైన వాతావరణం');
      res = res.replace(/Partly Cloudy/i, 'పాక్షికంగా మేఘావృతం');
      res = res.replace(/Clear Sky/i, 'నిర్మలమైన ఆకాశం');
      res = res.replace(/Mainly Clear/i, 'స్పష్టమైన ఆకాశం');
      res = res.replace(/Overcast/i, 'దట్టమైన మేఘాలు');
      res = res.replace(/Heavy Rainfall/i, 'భారీ వర్షం');
      return res;
    } else if (currentLanguage === 'hi') {
      let res = weatherString;
      res = res.replace(/Rain:\s*In\s*(\d+)\s*hours/i, '$1 घंटों में बारिश');
      res = res.replace(/Rain in\s*(\d+)\s*hours/i, '$1 घंटों में बारिश');
      res = res.replace(/Rain likely in\s*(\d+)\s*hours/i, '$1 घंटों में बारिश');
      res = res.replace(/Rain expected tomorrow/i, 'कल बारिश');
      res = res.replace(/Clear weather in upcoming 48 hours/i, 'अगले 48 घंटे साफ मौसम');
      res = res.replace(/Partly Cloudy/i, 'आंशिक बादल');
      res = res.replace(/Clear Sky/i, 'साफ आसमान');
      res = res.replace(/Heavy Rainfall/i, 'भारी बारिश');
      return res;
    }
    return weatherString;
  };

  const currentLanguageOption =
    SUPPORTED_LANGUAGES.find((l) => l.code === currentLanguage) || SUPPORTED_LANGUAGES[0];

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        currentLanguageOption,
        supportedLanguages: SUPPORTED_LANGUAGES,
        setLanguage,
        cycleNextLanguage,
        t,
        getSuggestions,
        isManualSelection,
        translateText,
        translateBatch,
        translateWeather,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
