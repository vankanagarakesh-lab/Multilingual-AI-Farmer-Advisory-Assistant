import React, { useState, useRef } from 'react';
import { Sprout, User, AlertTriangle, Volume2, Loader2, BookOpen, Pause } from 'lucide-react';
import { Message } from '../../types';
import { synthesizeVoice } from '../../services/api';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopAllAudio = () => {
    if (audioRef.current) {
      try {
        audioRef.current.pause();
        audioRef.current = null;
      } catch (e) {}
    }
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    setIsPlayingAudio(false);
  };

  const handleToggleAudio = async () => {
    if (isPlayingAudio) {
      stopAllAudio();
      return;
    }

    setIsLoadingAudio(true);

    try {
      // 1. Synthesize audio via Backend gTTS service (Generates clear Telugu/Hindi/English MP3 bytes)
      const audioBlob = await synthesizeVoice(message.content, message.language || 'en');
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlayingAudio(false);
      };

      audio.onerror = (e) => {
        console.warn("Backend audio playback failed, falling back to Web Speech API:", e);
        fallbackToWebSpeechAPI();
      };

      await audio.play();
      setIsPlayingAudio(true);
    } catch (err) {
      console.warn("Backend audio synthesis error, falling back to Web Speech API:", err);
      fallbackToWebSpeechAPI();
    } finally {
      setIsLoadingAudio(false);
    }
  };

  const fallbackToWebSpeechAPI = () => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const speechText = message.content
          .replace(/#+\s*/g, '')
          .replace(/\*+|_+/g, '')
          .replace(/[-•*]\s*/g, '')
          .replace(/⚠️|🌾|🎙|🔊|📚|🌱|🔍|🛠️|🛡️/g, '')
          .replace(/\n+/g, ' ')
          .trim();

        const langCode = message.language === 'te' ? 'te-IN' : message.language === 'hi' ? 'hi-IN' : 'en-IN';
        const utterance = new SpeechSynthesisUtterance(speechText);
        utterance.lang = langCode;

        utterance.onend = () => {
          setIsPlayingAudio(false);
        };

        utterance.onerror = () => {
          setIsPlayingAudio(false);
        };

        window.speechSynthesis.speak(utterance);
        setIsPlayingAudio(true);
      } catch (e) {
        console.error("Web Speech API fallback failed:", e);
        setIsPlayingAudio(false);
      }
    } else {
      setIsPlayingAudio(false);
    }
  };

  const getLanguageLabel = (lang?: string) => {
    if (!lang) return null;
    if (lang === 'te') return 'తెలుగు';
    if (lang === 'hi') return 'हिंदी';
    if (lang === 'mixed') return 'తెలుగు + English';
    return 'English';
  };

  // Helper function to format AI structured responses cleanly
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    const elements: React.ReactNode[] = [];
    let currentList: React.ReactNode[] = [];
    let isNumbered = false;

    const flushList = (keyPrefix: string) => {
      if (currentList.length > 0) {
        if (isNumbered) {
          elements.push(
            <ol key={`${keyPrefix}-ol`} className="list-decimal list-inside space-y-1.5 my-2 text-slate-300 text-sm pl-2">
              {currentList}
            </ol>
          );
        } else {
          elements.push(
            <ul key={`${keyPrefix}-ul`} className="list-disc list-inside space-y-1.5 my-2 text-slate-300 text-sm pl-2">
              {currentList}
            </ul>
          );
        }
        currentList = [];
      }
    };

    lines.forEach((line, idx) => {
      const trimmed = line.trim();

      // Heading 2 (## Title)
      if (trimmed.startsWith('## ')) {
        flushList(`flush-${idx}`);
        const titleText = trimmed.replace(/^##\s+/, '');
        elements.push(
          <h3 key={`h2-${idx}`} className="text-emerald-400 font-bold text-base mt-4 mb-2 flex items-center gap-2 border-b border-emerald-500/20 pb-1">
            <span className="w-1.5 h-4 bg-emerald-500 rounded-full inline-block"></span>
            {titleText}
          </h3>
        );
      }
      // Plant Name (🌱)
      else if (trimmed.startsWith('🌱')) {
        flushList(`flush-${idx}`);
        elements.push(
          <div key={`plant-${idx}`} className="mt-3 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/50 flex items-center space-x-2.5">
            <span className="text-xl">🌱</span>
            <span className="text-sm font-bold text-emerald-300">{trimmed.replace(/^🌱\s*/, '')}</span>
          </div>
        );
      }
      // Detected Disease / Condition (🔬)
      else if (trimmed.startsWith('🔬')) {
        flushList(`flush-${idx}`);
        elements.push(
          <div key={`disease-${idx}`} className="mt-2 p-3 rounded-xl bg-slate-900 border border-amber-500/30 flex items-center space-x-2.5 shadow-sm">
            <span className="text-xl">🔬</span>
            <div className="text-sm font-bold text-amber-300">{trimmed.replace(/^🔬\s*/, '')}</div>
          </div>
        );
      }
      // Confidence Level (📊)
      else if (trimmed.startsWith('📊')) {
        flushList(`flush-${idx}`);
        elements.push(
          <div key={`conf-${idx}`} className="mt-2 mb-3 inline-flex items-center space-x-2 px-3 py-1 rounded-lg bg-sky-950/50 border border-sky-800/50 text-xs font-semibold text-sky-300">
            <span>📊</span>
            <span>{trimmed.replace(/^📊\s*/, '')}</span>
          </div>
        );
      }
      // Possible Causes (🔍)
      else if (trimmed.startsWith('🔍')) {
        flushList(`flush-${idx}`);
        elements.push(
          <h4 key={`causes-${idx}`} className="text-amber-300 font-bold text-sm mt-3.5 mb-1.5 flex items-center gap-1.5">
            {trimmed}
          </h4>
        );
      }
      // What You Can Do / Treatment (🛠️)
      else if (trimmed.startsWith('🛠️')) {
        flushList(`flush-${idx}`);
        elements.push(
          <h4 key={`actions-${idx}`} className="text-emerald-300 font-bold text-sm mt-3.5 mb-1.5 flex items-center gap-1.5">
            {trimmed}
          </h4>
        );
      }
      // Prevention (🛡️)
      else if (trimmed.startsWith('🛡️')) {
        flushList(`flush-${idx}`);
        elements.push(
          <h4 key={`prevent-${idx}`} className="text-teal-300 font-bold text-sm mt-3.5 mb-1.5 flex items-center gap-1.5">
            {trimmed}
          </h4>
        );
      }
      // Heading 3 (### Title)
      else if (trimmed.startsWith('### ')) {
        flushList(`flush-${idx}`);
        const titleText = trimmed.replace(/^###\s+/, '');
        elements.push(
          <h4 key={`h3-${idx}`} className="text-slate-200 font-semibold text-sm mt-3 mb-1">
            {titleText}
          </h4>
        );
      }
      // Warning/Important Callout (⚠️ or Important Note)
      else if (trimmed.startsWith('⚠️') || trimmed.toLowerCase().includes('important note') || trimmed.includes('ముఖ్యమైన గమనిక') || trimmed.includes('महत्वपूर्ण सूचना')) {
        flushList(`flush-${idx}`);
        const bodyText = trimmed.replace(/^⚠️\s*(Important Note|Important|ముఖ్యమైన గమనిక|महत्वपूर्ण सूचना)?[:\s-]*/i, '');
        elements.push(
          <div key={`warn-${idx}`} className="my-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs leading-relaxed flex items-start space-x-2.5 shadow-sm">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-300 mb-0.5">Agricultural Note</p>
              <span>{bodyText || trimmed}</span>
            </div>
          </div>
        );
      }
      // Bullet list item (- or • or *)
      else if (trimmed.startsWith('- ') || trimmed.startsWith('• ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.replace(/^[-•*]\s+/, '');
        if (isNumbered) {
          flushList(`flush-${idx}`);
          isNumbered = false;
        }
        currentList.push(
          <li key={`li-${idx}`} className="leading-relaxed">
            {itemText}
          </li>
        );
      }
      // Numbered list item (1., 2., etc)
      else if (/^\d+\.\s+/.test(trimmed)) {
        const itemText = trimmed.replace(/^\d+\.\s+/, '');
        if (!isNumbered && currentList.length > 0) {
          flushList(`flush-${idx}`);
        }
        isNumbered = true;
        currentList.push(
          <li key={`nli-${idx}`} className="leading-relaxed">
            {itemText}
          </li>
        );
      }
      // Standard paragraph line
      else if (trimmed.length > 0) {
        flushList(`flush-${idx}`);
        elements.push(
          <p key={`p-${idx}`} className="my-1.5 text-slate-300 text-sm leading-relaxed">
            {trimmed}
          </p>
        );
      }
    });

    flushList('flush-end');
    return elements;
  };

  const langLabel = getLanguageLabel(message.language);

  return (
    <div className={`py-4 px-4 md:px-6 transition ${isUser ? 'bg-slate-950' : 'bg-slate-900/60 border-y border-slate-800/40'}`}>
      <div className="max-w-3xl mx-auto flex items-start space-x-3.5 md:space-x-4">
        {/* Avatar */}
        <div className={`
          w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-md
          ${isUser 
            ? 'bg-slate-800 border border-slate-700 text-slate-300' 
            : 'bg-emerald-600 text-white shadow-emerald-900/40'}
        `}>
          {isUser ? <User className="w-4 h-4" /> : <Sprout className="w-4.5 h-4.5" />}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-slate-300">
                {isUser ? 'You' : 'KRISHI AI'}
              </span>
              <span className="text-[10px] text-slate-500">
                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {/* Language Badge */}
            {langLabel && (
              <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700/80 text-emerald-400 font-medium">
                {langLabel}
              </span>
            )}
          </div>

          <div className="prose prose-invert max-w-none text-slate-200">
            {isUser ? (
              <div className="space-y-2">
                {message.imageUrl && (
                  <div className="relative inline-block max-w-xs sm:max-w-sm rounded-2xl overflow-hidden border border-slate-700 shadow-lg">
                    <img 
                      src={message.imageUrl} 
                      alt="Crop attachment" 
                      className="w-full h-auto max-h-64 object-cover" 
                    />
                  </div>
                )}
                <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">{message.content}</p>
              </div>
            ) : (
              <>
                {renderFormattedContent(message.content)}

                {/* Sources UI Section */}
                {message.sources && message.sources.length > 0 && (
                  <div className="mt-4 p-3 rounded-xl bg-slate-800/80 border border-slate-700/70 text-xs">
                    <div className="flex items-center space-x-1.5 font-semibold text-emerald-400 mb-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>📚 Sources Used</span>
                    </div>
                    <ul className="space-y-1 text-slate-300 pl-4 list-disc">
                      {message.sources.map((src, sIdx) => (
                        <li key={sIdx} className="leading-tight">
                          <span className="font-medium text-slate-200">{src.title}</span>
                          {src.source && <span className="text-slate-400 ml-1">({src.source})</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Voice Response Playback Button */}
                <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center">
                  <button
                    onClick={handleToggleAudio}
                    disabled={isLoadingAudio}
                    className="
                      inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg
                      bg-slate-800 hover:bg-emerald-600/20 border border-slate-700 hover:border-emerald-500/40
                      text-xs text-emerald-300 font-medium transition active:scale-95 disabled:opacity-50
                    "
                  >
                    {isLoadingAudio ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                        <span>Generating voice...</span>
                      </>
                    ) : isPlayingAudio ? (
                      <>
                        <Pause className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                        <span>Pause Voice</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>🔊 Listen</span>
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
