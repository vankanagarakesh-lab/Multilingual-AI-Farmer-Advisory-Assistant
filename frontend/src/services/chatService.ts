import api from './api';
import { ChatMessageRequest, ChatMessageResponse, DiseaseDetectionResponse, Message } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export interface StreamHandlers {
  onInit?: (data: { conversation_id: number; user_message: Message }) => void;
  onToken: (chunk: string) => void;
  onDone: (data: { conversation_id: number; ai_message: Message; sources?: any[] }) => void;
  onError: (error: any) => void;
}

export const chatService = {
  async sendMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    const response = await api.post<ChatMessageResponse>('/api/chat/message', request);
    return response.data;
  },

  async sendMessageStream(request: ChatMessageRequest, handlers: StreamHandlers): Promise<void> {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      const token = localStorage.getItem('krishi_token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const farmerUuid = localStorage.getItem('krishi_farmer_uuid');
      if (farmerUuid) {
        headers['X-Farmer-UUID'] = farmerUuid;
      }

      const response = await fetch(`${API_BASE_URL}/api/chat/message/stream`, {
        method: 'POST',
        headers,
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error(`Streaming failed with status ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported by response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.replace(/^data:\s*/, '');
          if (!jsonStr) continue;

          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.type === 'init') {
              if (handlers.onInit) handlers.onInit(parsed);
            } else if (parsed.type === 'token') {
              if (parsed.chunk) handlers.onToken(parsed.chunk);
            } else if (parsed.type === 'done') {
              handlers.onDone(parsed);
            }
          } catch (jsonErr) {
            console.debug('SSE parse chunk note:', jsonErr);
          }
        }
      }
    } catch (err) {
      console.warn('Streaming error, falling back to sync API:', err);
      try {
        const fallbackRes = await chatService.sendMessage(request);
        if (handlers.onInit) handlers.onInit({ conversation_id: fallbackRes.conversation_id, user_message: fallbackRes.user_message });
        handlers.onToken(fallbackRes.ai_message.content);
        handlers.onDone({
          conversation_id: fallbackRes.conversation_id,
          ai_message: fallbackRes.ai_message,
          sources: fallbackRes.ai_message.sources
        });
      } catch (fallbackErr) {
        handlers.onError(fallbackErr);
      }
    }
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
