import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Sprout, 
  Plus, 
  MessageSquare, 
  User as UserIcon, 
  LogOut, 
  X,
  ChevronRight,
  Sparkles,
  Trash2,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Conversation } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: number | null;
  onSelectConversation: (id: number) => void;
  onNewConversation: () => void;
  onDeleteConversation?: (id: number) => Promise<void>;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isOpen,
  onClose,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, farmerProfile, logout } = useAuth();
  const { t } = useLanguage();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const isProfileActive = location.pathname === '/profile';

  const confirmDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!onDeleteConversation) return;
    setIsDeleting(true);
    try {
      await onDeleteConversation(id);
      setDeletingId(null);
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50
        w-72 bg-slate-900 border-r border-slate-800/80
        flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Header & Brand */}
        <div className="p-4 border-b border-slate-800/60">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <Sprout className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg text-white tracking-tight flex items-center gap-1.5">
                  {t('app.title', 'KRISHI AI')}
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">v1.0</span>
                </h1>
                <p className="text-xs text-slate-400 font-medium">{t('app.subtitle', 'Intelligent Farm Advisor')}</p>
              </div>
            </div>

            <button 
              onClick={onClose}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={() => {
                onNewConversation();
                onClose();
              }}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-emerald-900/30 transition duration-150 active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              <span>{t('sidebar.new_chat', 'New Conversation')}</span>
            </button>

            <button
              onClick={() => {
                navigate('/simulator');
                onClose();
              }}
              className={`w-full py-2 px-3 rounded-xl flex items-center justify-between text-xs font-semibold transition border ${
                location.pathname === '/simulator'
                  ? 'bg-gradient-to-r from-emerald-600/30 to-teal-500/20 text-emerald-300 border-emerald-500/40 shadow-inner'
                  : 'bg-slate-950/70 hover:bg-slate-800/80 text-slate-300 hover:text-emerald-400 border-slate-800'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span className="text-sm">🌾</span>
                <span>{t('sidebar.simulator', 'Farm Simulator')}</span>
              </div>
              <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-extrabold">
                VISION
              </span>
            </button>
          </div>
        </div>

        {/* Conversations History List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          <div className="px-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>{t('sidebar.recent_chats', 'Recent Conversations')}</span>
            <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
          </div>

          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-500 italic">
              {t('sidebar.no_chats', 'No previous conversations. Ask KRISHI AI a question to get started!')}
            </div>
          ) : (
            conversations.map((conv) => {
              const isActive = conv.id === activeConversationId && !isProfileActive;
              return (
                <div
                  key={conv.id}
                  className={`
                    group relative rounded-xl transition flex items-center justify-between
                    ${isActive 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium' 
                      : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'}
                  `}
                >
                  <button
                    onClick={() => {
                      onSelectConversation(conv.id);
                      onClose();
                    }}
                    className="flex-1 text-left px-3 py-2.5 text-sm flex items-center space-x-3 min-w-0"
                  >
                    <MessageSquare className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-500 group-hover:text-slate-400'}`} />
                    <span className="truncate flex-1">{conv.title}</span>
                  </button>

                  {/* Delete Button */}
                  {onDeleteConversation && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeletingId(conv.id);
                      }}
                      title="Delete conversation"
                      className="p-1.5 mr-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 opacity-0 group-hover:opacity-100 focus:opacity-100 transition shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {deletingId !== null && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center space-x-3 text-rose-400">
                <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-sm">{t('sidebar.confirm_delete', 'Delete Conversation?')}</h3>
                  <p className="text-xs text-slate-400">{t('sidebar.desc_delete', 'This action cannot be undone.')}</p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setDeletingId(null)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800 transition"
                >
                  {t('sidebar.cancel', 'Cancel')}
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={(e) => confirmDelete(e, deletingId)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white transition flex items-center space-x-1.5 shadow-lg shadow-rose-900/30"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>{t('common.loading', 'Deleting...')}</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3 h-3" />
                      <span>{t('sidebar.delete', 'Delete')}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Bottom User & Profile Panel */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-900/50 space-y-1">
          {/* Farmer Profile Link */}
          <button
            onClick={() => {
              navigate('/profile');
              onClose();
            }}
            className={`
              w-full text-left px-3 py-2.5 rounded-xl text-sm transition flex items-center justify-between group
              ${isProfileActive 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium' 
                : 'text-slate-300 hover:bg-slate-800/60 hover:text-slate-100'}
            `}
          >
            <div className="flex items-center space-x-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shrink-0">
                <UserIcon className="w-4 h-4" />
              </div>
              <div className="truncate">
                <p className="text-xs font-semibold text-slate-200 truncate">{user?.name || t('sidebar.profile', 'Farmer Profile')}</p>
                <p className="text-[11px] text-emerald-400/80 truncate">
                  {farmerProfile?.primary_crop ? `${farmerProfile.primary_crop} • ${farmerProfile?.farm_size || 'Farm'}` : t('sidebar.profile', 'View & Edit Profile')}
                </p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
};
