import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation, useOutletContext } from 'react-router-dom';
import { Sprout, Loader2, Wheat, MapPin, Sparkles, TrendingUp, Droplets } from 'lucide-react';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { SuggestedQuestions } from '../components/chat/SuggestedQuestions';
import { FarmSimulatorModal } from '../components/simulator/FarmSimulatorModal';
import { conversationService } from '../services/conversationService';
import { chatService } from '../services/chatService';
import { Message, ConversationDetail } from '../types';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface OutletContextType {
  onOpenMobileSidebar: () => void;
  refreshConversations: () => Promise<void>;
}

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { onOpenMobileSidebar, refreshConversations } = useOutletContext<OutletContextType>();
  const { farmerProfile, user } = useAuth();
  const { currentLanguage, t, translateBatch, translateText } = useLanguage();

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedPayload, setLastFailedPayload] = useState<{ text: string; lang?: string; image?: string } | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Check if routed with an initial prompt from Simulator
  useEffect(() => {
    const state = location.state as { initialPrompt?: string } | null;
    if (state?.initialPrompt) {
      handleSendMessage(state.initialPrompt);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  useEffect(() => {
    if (conversationId) {
      const id = parseInt(conversationId, 10);
      loadConversation(id);
    } else {
      setConversation(null);
      setMessages([]);
      setErrorMessage(null);
    }
  }, [conversationId]);

  // Translate all currently displayed messages immediately when the language is switched
  useEffect(() => {
    if (messages.length === 0) return;

    let isMounted = true;
    const translateExistingMessages = async () => {
      try {
        const textList = messages.map((m) => m.content);
        const translatedList = await translateBatch(textList, currentLanguage);
        if (!isMounted) return;

        setMessages((prevMessages) =>
          prevMessages.map((msg, idx) => ({
            ...msg,
            content: translatedList[idx] || msg.content,
            language: currentLanguage
          }))
        );

        if (conversation?.title) {
          const translatedTitle = await translateText(conversation.title, currentLanguage);
          if (isMounted) {
            setConversation((prev) => (prev ? { ...prev, title: translatedTitle } : null));
          }
        }
      } catch (err) {
        console.warn('On-screen message translation note:', err);
      }
    };

    translateExistingMessages();
    return () => {
      isMounted = false;
    };
  }, [currentLanguage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const loadConversation = async (id: number) => {
    setIsFetchingHistory(true);
    setErrorMessage(null);
    try {
      const data = await conversationService.getConversationById(id);
      setConversation(data);
      setMessages(data.messages || []);
    } catch (err: any) {
      console.error('Failed to load conversation:', err);
      if (err.response?.status === 404) {
        setConversation(null);
        setMessages([]);
        navigate('/', { replace: true });
      } else {
        setErrorMessage('Could not load conversation history.');
      }
    } finally {
      setIsFetchingHistory(false);
    }
  };

  const handleSendMessage = async (text: string, responseLang?: string, attachedImage?: string) => {
    setErrorMessage(null);
    setLastFailedPayload(null);
    setIsLoading(true);

    const activeLanguage = responseLang || currentLanguage;
    const currentConvId = conversationId ? parseInt(conversationId, 10) : undefined;
    const tempUserMsgId = Date.now();
    const tempAiMsgId = Date.now() + 1;

    // Optimistically render user message & thinking placeholder
    const tempUserMsg: Message = {
      id: tempUserMsgId,
      conversation_id: currentConvId || 0,
      role: 'user',
      content: text,
      language: activeLanguage,
      imageUrl: attachedImage,
      created_at: new Date().toISOString()
    };

    const tempAiMsg: Message = {
      id: tempAiMsgId,
      conversation_id: currentConvId || 0,
      role: 'assistant',
      content: '',
      language: activeLanguage,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempUserMsg, tempAiMsg]);

    // Read real-time weather cache if available
    let clientWeatherData = undefined;
    try {
      const cachedWeatherStr = localStorage.getItem('krishi_last_weather');
      if (cachedWeatherStr) {
        clientWeatherData = JSON.parse(cachedWeatherStr);
      }
    } catch (e) {
      // ignore
    }

    try {
      await chatService.sendMessageStream(
        {
          message: text,
          conversation_id: currentConvId,
          response_language: activeLanguage,
          image_data: attachedImage,
          weather_data: clientWeatherData
        },
        {
          onInit: (initData) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempUserMsgId
                  ? { ...initData.user_message, imageUrl: attachedImage || initData.user_message.image_url || initData.user_message.imageUrl }
                  : m
              )
            );
          },
          onToken: (chunk) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAiMsgId ? { ...m, content: m.content + chunk } : m
              )
            );
          },
          onDone: async (doneData) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === tempAiMsgId
                  ? {
                      ...doneData.ai_message,
                      id: doneData.ai_message.id || tempAiMsgId,
                      sources: doneData.ai_message.sources || (doneData as any).sources
                    }
                  : m
              )
            );
            setIsLoading(false);

            if (!conversationId && doneData.conversation_id) {
              await refreshConversations();
              navigate(`/chat/${doneData.conversation_id}`, { replace: true });
            } else {
              await refreshConversations();
            }
          },
          onError: (err) => {
            console.error('Streaming chat error:', err);
            setMessages((prev) => prev.filter((m) => m.id !== tempAiMsgId));
            setErrorMessage(err || t('common.error', 'Failed to generate advisory response. Please retry.'));
            setLastFailedPayload({ text, lang: activeLanguage, image: attachedImage });
            setIsLoading(false);
          }
        }
      );
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setMessages((prev) => prev.filter((m) => m.id !== tempAiMsgId));
      const detail = err.response?.data?.detail || t('common.error', 'KRISHI AI is temporarily unavailable. Please check backend connection.');
      setErrorMessage(detail);
      setLastFailedPayload({ text, lang: activeLanguage, image: attachedImage });
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    if (lastFailedPayload) {
      handleSendMessage(lastFailedPayload.text, lastFailedPayload.lang, lastFailedPayload.image);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 min-w-0">
      {/* Header */}
      <ChatHeader
        title={conversation?.title}
        onOpenMobileSidebar={onOpenMobileSidebar}
      />

      {/* Main Messages & Welcome View */}
      <div className="flex-1 overflow-y-auto">
        {isFetchingHistory ? (
          <div className="h-full flex items-center justify-center text-slate-400 space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            <span className="text-sm">{t('common.loading', 'Loading conversation...')}</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="min-h-full flex flex-col items-center justify-center px-4 py-8 text-center max-w-3xl mx-auto">
            {/* Hero Branding */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-xl shadow-emerald-900/40 mb-4">
              <Sprout className="w-9 h-9 text-white" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Hello, {user?.name || t('sidebar.profile', 'Farmer')}! 👋
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-lg leading-relaxed">
              {t('profile.desc', 'What would you like to know about your farm today? KRISHI AI provides intelligent agricultural decision support for crop, soil, and irrigation management.')}
            </p>

            {/* KRISHI VISION – AI Farm Future Simulator Hero Feature Banner */}
            <div className="mt-5 w-full max-w-2xl bg-gradient-to-r from-emerald-950/80 via-slate-900 to-teal-950/80 border border-emerald-500/40 rounded-3xl p-5 text-left shadow-xl shadow-emerald-950/40 relative overflow-hidden group">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-emerald-500/10 rounded-full blur-xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      ★ {t('header.rag', 'FEATURE')}
                    </span>
                    <span className="text-xs font-bold text-emerald-400">KRISHI VISION</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                    {t('sim.title', 'AI Farm Future Simulator')}
                  </h3>
                  <p className="text-xs text-slate-300 italic">
                    &ldquo;{t('sim.subtitle', "Don't just grow. Simulate your future before you invest.")}&rdquo;
                  </p>
                  <p className="text-[11px] text-slate-400 max-w-md">
                    {t('sim.desc', 'Simulate rainfall delay, water shortage, temperature anomalies, and market price volatility in real time to find the most profitable, lowest-risk crop.')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsSimulatorOpen(true)}
                  className="px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs shadow-lg shadow-emerald-900/50 flex items-center justify-center space-x-2 transition transform active:scale-95 shrink-0"
                >
                  <span className="text-base">🌾</span>
                  <span>{t('header.simulate', 'Simulate My Farm')}</span>
                  <Sparkles className="w-3.5 h-3.5 text-slate-950" />
                </button>
              </div>
            </div>

            {/* Farmer Profile Context Summary Card */}
            {farmerProfile && (farmerProfile.primary_crop || farmerProfile.location) && (
              <div className="mt-4 p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300">
                <span className="font-semibold text-emerald-400">{t('header.context', 'Active Profile Context:')}</span>
                {farmerProfile.primary_crop && (
                  <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    🌱 {t('profile.primary_crop', 'Crop')}: <strong>{farmerProfile.primary_crop}</strong>
                  </span>
                )}
                {farmerProfile.location && (
                  <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    📍 {t('profile.location', 'Location')}: <strong>{farmerProfile.location}</strong>
                  </span>
                )}
                {farmerProfile.current_crop_stage && (
                  <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    🌾 {t('profile.crop_stage', 'Stage')}: <strong>{farmerProfile.current_crop_stage}</strong>
                  </span>
                )}
              </div>
            )}

            {/* Suggested Starter Cards */}
            <SuggestedQuestions onSelectPrompt={(prompt) => handleSendMessage(prompt)} />
          </div>
        ) : (
          <div className="py-4 space-y-1">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Field */}
      <ChatInput
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        errorMessage={errorMessage}
        onRetry={lastFailedPayload ? handleRetry : undefined}
        initialLanguage={farmerProfile?.preferred_language || 'en'}
      />

      {/* Simulator Modal */}
      <FarmSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </div>
  );
};
