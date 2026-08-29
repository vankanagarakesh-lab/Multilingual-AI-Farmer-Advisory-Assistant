import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useOutletContext } from 'react-router-dom';
import { Sprout, Loader2, Wheat, MapPin } from 'lucide-react';
import { ChatHeader } from '../components/chat/ChatHeader';
import { ChatMessage } from '../components/chat/ChatMessage';
import { ChatInput } from '../components/chat/ChatInput';
import { SuggestedQuestions } from '../components/chat/SuggestedQuestions';
import { conversationService } from '../services/conversationService';
import { chatService } from '../services/chatService';
import { Message, ConversationDetail } from '../types';
import { useAuth } from '../context/AuthContext';

interface OutletContextType {
  onOpenMobileSidebar: () => void;
  refreshConversations: () => Promise<void>;
}

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId?: string }>();
  const navigate = useNavigate();
  const { onOpenMobileSidebar, refreshConversations } = useOutletContext<OutletContextType>();
  const { farmerProfile, user } = useAuth();

  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFetchingHistory, setIsFetchingHistory] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastFailedPayload, setLastFailedPayload] = useState<{ text: string; lang?: string; image?: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

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

    const currentConvId = conversationId ? parseInt(conversationId, 10) : undefined;

    // Optimistically render user message
    const tempUserMsg: Message = {
      id: Date.now(),
      conversation_id: currentConvId || 0,
      role: 'user',
      content: text,
      language: responseLang,
      imageUrl: attachedImage,
      created_at: new Date().toISOString()
    };
    setMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await chatService.sendMessage({
        message: text,
        conversation_id: currentConvId,
        response_language: responseLang,
        image_data: attachedImage
      });

      // Update state with confirmed messages, preserving attached image on user message
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMsg.id);
        const confirmedUserMsg = { ...res.user_message, imageUrl: attachedImage || res.user_message.image_url || res.user_message.imageUrl };
        return [...filtered, confirmedUserMsg, res.ai_message];
      });

      // If new conversation, update URL and refresh sidebar
      if (!currentConvId && res.conversation_id) {
        await refreshConversations();
        navigate(`/chat/${res.conversation_id}`, { replace: true });
      } else {
        await refreshConversations();
      }
    } catch (err: any) {
      console.error('Failed to send message:', err);
      const detail = err.response?.data?.detail || 'KRISHI AI is temporarily unavailable. Please check backend connection.';
      setErrorMessage(detail);
      setLastFailedPayload({ text, lang: responseLang, image: attachedImage });
    } finally {
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
            <span className="text-sm">Loading conversation...</span>
          </div>
        ) : messages.length === 0 ? (
          <div className="min-h-full flex flex-col items-center justify-center px-4 py-8 text-center max-w-3xl mx-auto">
            {/* Hero Branding */}
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-xl shadow-emerald-900/40 mb-4">
              <Sprout className="w-9 h-9 text-white" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
              Hello, {user?.name || 'Farmer'}! 👋
            </h1>
            <p className="text-sm text-slate-400 mt-2 max-w-lg leading-relaxed">
              What would you like to know about your farm today? KRISHI AI provides intelligent agricultural decision support for crop, soil, and irrigation management.
            </p>

            {/* Farmer Profile Context Summary Card */}
            {farmerProfile && (farmerProfile.primary_crop || farmerProfile.location) && (
              <div className="mt-4 p-3 rounded-2xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-300">
                <span className="font-semibold text-emerald-400">Active Profile Context:</span>
                {farmerProfile.primary_crop && (
                  <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    🌱 Crop: <strong>{farmerProfile.primary_crop}</strong>
                  </span>
                )}
                {farmerProfile.location && (
                  <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    📍 Location: <strong>{farmerProfile.location}</strong>
                  </span>
                )}
                {farmerProfile.current_crop_stage && (
                  <span className="bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                    🌾 Stage: <strong>{farmerProfile.current_crop_stage}</strong>
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
    </div>
  );
};
