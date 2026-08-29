import api from './api';
import { Conversation, ConversationDetail } from '../types';

export const conversationService = {
  async getConversations(): Promise<Conversation[]> {
    const response = await api.get<Conversation[]>('/api/conversations');
    return response.data;
  },

  async createConversation(title?: string): Promise<Conversation> {
    const response = await api.post<Conversation>('/api/conversations', { title });
    return response.data;
  },

  async getConversationById(id: number): Promise<ConversationDetail> {
    const response = await api.get<ConversationDetail>(`/api/conversations/${id}`);
    return response.data;
  },

  async deleteConversation(id: number): Promise<{ success: boolean; id: number }> {
    const response = await api.delete<{ success: boolean; id: number }>(`/api/conversations/${id}`);
    return response.data;
  }
};
