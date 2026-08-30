import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

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

interface LanguageContextType {
  currentLanguage: SupportedLanguage;
  currentLanguageOption: LanguageOption;
  supportedLanguages: LanguageOption[];
  setLanguage: (lang: SupportedLanguage, isManual?: boolean) => void;
  cycleNextLanguage: () => SupportedLanguage;
  t: (key: string, defaultText?: string) => string;
  getSuggestions: () => Array<{ title: string; prompt: string; category: string }>;
  isManualSelection: boolean;
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
