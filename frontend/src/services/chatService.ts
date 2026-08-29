import api from './api';
import { ChatMessageRequest, ChatMessageResponse, DiseaseDetectionResponse } from '../types';

export const chatService = {
  async sendMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    const response = await api.post<ChatMessageResponse>('/api/chat/message', request);
    return response.data;
  },

  async detectDisease(imageData: string, language: string = 'en', conversationId?: number): Promise<DiseaseDetectionResponse> {
    const response = await api.post<DiseaseDetectionResponse>('/api/chat/detect-disease', {
      image_data: imageData,
      language,
      conversation_id: conversationId
    });
    return response.data;
  }
};
