import api from './api';
import { SupportedLanguage } from '../context/LanguageContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// In-Memory Translation Cache: `${lang}_${text}` -> translatedText
const translationCache = new Map<string, string>();

// Instant Local Dictionary for common weather terms, titles, and agronomic phrases
const QUICK_AGRI_TERMS: Record<SupportedLanguage, Record<string, string>> = {
  en: {},
  te: {
    'Partly Cloudy': 'పాక్షికంగా మేఘావృతం',
    'Clear Sky': 'నిర్మలమైన ఆకాశం',
    'Clear Sunny Sky': 'ఎండతో కూడిన ఆకాశం',
    'Mainly Clear': 'చాలా వరకు స్పష్టమైన ఆకాశం',
    'Overcast': 'దట్టమైన మేఘాలు',
    'Foggy': 'పొగమంచు',
    'Light Drizzle': 'తేలికపాటి జల్లులు',
    'Moderate Drizzle': 'చిరుజల్లులు',
    'Slight Rain': 'తేలికపాటి వర్షం',
    'Moderate Rain': 'మోస్తరు వర్షం',
    'Heavy Rainfall': 'భారీ వర్షం',
    'Thunderstorm': 'ఉరుములతో కూడిన వర్షం',
    'Rain': 'వర్షం',
    'Rain in': 'వర్షం:',
    'hours': 'గంటల్లో',
    'days': 'రోజుల్లో',
    'tomorrow': 'రేపు',
    'New Conversation': 'కొత్త సంభాషణ',
    'What is the optimal N-P-K fertilizer ratio for paddy rice in black soil?': 'నల్లరేగడి నేలలో వరి పంటకు సరైన N-P-K ఎరువుల నిష్పత్తి ఎంత?',
    'What crop you suggest for me': 'నాకు ఏ పంటలు అనుకూలంగా ఉంటాయి?',
    'Give me some crop names for me': 'నాకు అనుకూలమైన కొన్ని పంటల పేర్లు చెప్పండి',
    'Can you predict the plant disease?': 'మొక్కల తెగుళ్లను గుర్తించగలరా?',
    'What fertilizer is suitable': 'ఏ ఎరువులు అనుకూలమైనవి?',
  },
  hi: {
    'Partly Cloudy': 'आंशिक रूप से बादल',
    'Clear Sky': 'साफ आसमान',
    'Clear Sunny Sky': 'धूप वाला आसमान',
    'Mainly Clear': 'मुख्यतः साफ',
    'Overcast': 'घने बादल',
    'Foggy': 'कोहरा',
    'Light Drizzle': 'हल्की बूंदाबांदी',
    'Moderate Drizzle': 'मध्यम बूंदाबांदी',
    'Slight Rain': 'हल्की बारिश',
    'Moderate Rain': 'मध्यम बारिश',
    'Heavy Rainfall': 'भारी बारिश',
    'Thunderstorm': 'आंधी तूफान',
    'Rain': 'बारिश',
    'Rain in': 'बारिश:',
    'hours': 'घंटों में',
    'days': 'दिनों में',
    'tomorrow': 'कल',
    'New Conversation': 'नई बातचीत',
    'What is the optimal N-P-K fertilizer ratio for paddy rice in black soil?': 'काली मिट्टी में धान के लिए सर्वोत्तम N-P-K उर्वरक अनुपात क्या है?',
    'What crop you suggest for me': 'आप मेरे लिए कौन सी फसल सुझाते हैं?',
    'Give me some crop names for me': 'मेरे लिए कुछ उपयुक्त फसलों के नाम बताएं',
  },
  kn: {
    'Partly Cloudy': 'ಭಾಗಶಃ ಮೋಡ',
    'Clear Sky': 'ಸ್ವಚ್ಛ ಆಕಾಶ',
    'Heavy Rainfall': 'ಭಾರೀ ಮಳೆ',
    'New Conversation': 'ಹೊಸ ಸಂಭಾಷಣೆ',
  },
  ta: {
    'Partly Cloudy': 'பகுதி மேகமூட்டம்',
    'Clear Sky': 'தெளிவான வானம்',
    'Heavy Rainfall': 'கனமழை',
    'New Conversation': 'புதிய உரையாடல்',
  },
  mr: {
    'Partly Cloudy': 'अंशतः ढगाळ',
    'Clear Sky': 'निरभ्र आकाश',
    'Heavy Rainfall': 'मुसळधार पाऊस',
    'New Conversation': 'नवीन संवाद',
  }
};

export const translationService = {
  /**
   * Fast synchronous lookup for common terms
   */
  getQuickTranslation(text: string, targetLang: SupportedLanguage): string | null {
    if (!text) return text;
    if (targetLang === 'en') return text;
    const dict = QUICK_AGRI_TERMS[targetLang];
    if (dict && dict[text]) {
      return dict[text];
    }
    const cacheKey = `${targetLang}_${text.trim()}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }
    return null;
  },

  /**
   * Translates a single string into target language
   */
  async translateText(text: string, targetLang: SupportedLanguage): Promise<string> {
    if (!text || !text.trim()) return text;
    if (targetLang === 'en') return text;

    const quick = this.getQuickTranslation(text, targetLang);
    if (quick) return quick;

    const cacheKey = `${targetLang}_${text.trim()}`;
    if (translationCache.has(cacheKey)) {
      return translationCache.get(cacheKey)!;
    }

    try {
      const res = await api.post<{ translated_text: string; target_language: string }>('/api/translate/single', {
        text,
        target_language: targetLang
      });

      const translated = res.data.translated_text || text;
      translationCache.set(cacheKey, translated);
      return translated;
    } catch (err) {
      console.warn('Backend translation failed, returning original text:', err);
      return text;
    }
  },

  /**
   * Translates a batch of strings in a single call
   */
  async translateBatch(texts: string[], targetLang: SupportedLanguage): Promise<string[]> {
    if (!texts || texts.length === 0) return [];
    if (targetLang === 'en') return texts;

    const results: string[] = new Array(texts.length);
    const missingIndices: number[] = [];
    const missingTexts: string[] = [];

    for (let i = 0; i < texts.length; i++) {
      const t = texts[i];
      if (!t || !t.trim()) {
        results[i] = t;
        continue;
      }
      const quick = this.getQuickTranslation(t, targetLang);
      if (quick) {
        results[i] = quick;
      } else {
        missingIndices.push(i);
        missingTexts.push(t);
      }
    }

    if (missingTexts.length === 0) {
      return results;
    }

    try {
      const res = await api.post<{ translations: string[]; target_language: string }>('/api/translate/batch', {
        texts: missingTexts,
        target_language: targetLang
      });

      const translatedList = res.data.translations || missingTexts;
      for (let j = 0; j < missingIndices.length; j++) {
        const originalIndex = missingIndices[j];
        const translatedText = translatedList[j] || missingTexts[j];
        results[originalIndex] = translatedText;
        translationCache.set(`${targetLang}_${missingTexts[j].trim()}`, translatedText);
      }
    } catch (err) {
      console.warn('Batch translation error:', err);
      for (let j = 0; j < missingIndices.length; j++) {
        results[missingIndices[j]] = missingTexts[j];
      }
    }

    return results;
  }
};
