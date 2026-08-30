import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { MessageSquare, Menu, Calendar, ChevronRight, Loader2 } from 'lucide-react';
import { conversationService } from '../services/conversationService';
import { Conversation } from '../types';

import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import { useLanguage } from '../context/LanguageContext';

interface OutletContextType {
  onOpenMobileSidebar: () => void;
}

export const ConversationsPage: React.FC = () => {
  const { onOpenMobileSidebar } = useOutletContext<OutletContextType>();
  const { t } = useLanguage();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        const list = await conversationService.getConversations();
        setConversations(list);
      } catch (err) {
        console.error('Failed to fetch conversations:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 min-w-0 overflow-y-auto">
      <header className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h2 className="text-sm font-semibold text-slate-200">{t('sidebar.recent_chats', 'Conversation History Archive')}</h2>
        </div>
        <LanguageSwitcher />
      </header>

      <div className="max-w-3xl w-full mx-auto p-4 sm:p-6 space-y-4">
        {isLoading ? (
          <div className="py-12 flex justify-center items-center text-slate-400 space-x-2">
            <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
            <span className="text-sm">Loading conversations...</span>
          </div>
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-3xl text-slate-400">
            <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-white">No Conversations Found</h3>
            <p className="text-xs text-slate-400 mt-1">Start a new conversation with KRISHI AI from the main screen!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => navigate(`/chat/${conv.id}`)}
                className="p-4 bg-slate-900 border border-slate-800 rounded-2xl hover:border-emerald-500/40 hover:bg-slate-800/50 transition cursor-pointer flex items-center justify-between group shadow-md"
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div className="truncate">
                    <h3 className="text-sm font-semibold text-slate-100 group-hover:text-emerald-400 transition truncate">
                      {conv.title}
                    </h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      {new Date(conv.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-slate-300 transition shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
