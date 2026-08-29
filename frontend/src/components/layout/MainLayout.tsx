import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { conversationService } from '../../services/conversationService';
import { Conversation } from '../../types';
import { useAuth } from '../../context/AuthContext';

export const MainLayout: React.FC = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<number | null>(null);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const fetchConversations = async () => {
    try {
      const data = await conversationService.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchConversations();
    }
  }, [user]);

  // Sync activeConversationId with URL route
  useEffect(() => {
    const match = location.pathname.match(/\/chat\/(\d+)/);
    if (match) {
      setActiveConversationId(parseInt(match[1], 10));
    } else if (location.pathname === '/') {
      setActiveConversationId(null);
    }
  }, [location.pathname]);

  const handleSelectConversation = (id: number) => {
    setActiveConversationId(id);
    navigate(`/chat/${id}`);
  };

  const handleNewConversation = () => {
    setActiveConversationId(null);
    navigate('/');
  };

  const handleDeleteConversation = async (id: number) => {
    await conversationService.deleteConversation(id);
    await fetchConversations();
    if (activeConversationId === id) {
      setActiveConversationId(null);
      navigate('/');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100">
      {/* Left Sidebar */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <Outlet context={{ 
          onOpenMobileSidebar: () => setIsMobileSidebarOpen(true),
          refreshConversations: fetchConversations
        }} />
      </div>
    </div>
  );
};
