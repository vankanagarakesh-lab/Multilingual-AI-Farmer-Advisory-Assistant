import axios from 'axios';
import { VoiceTranscribeResponse, KnowledgeStatusResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Inject JWT Token and Farmer UUID
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('krishi_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const farmerUuid = localStorage.getItem('krishi_farmer_uuid');
    if (farmerUuid) {
      config.headers['X-Farmer-UUID'] = farmerUuid;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle 401 Unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If token expired or invalid, clear token
      localStorage.removeItem('krishi_token');
    }
    return Promise.reject(error);
  }
);

// Voice Services
export const transcribeVoice = async (audioBlob: Blob): Promise<VoiceTranscribeResponse> => {
  const formData = new FormData();
  formData.append('file', audioBlob, 'recording.webm');
  const response = await api.post<VoiceTranscribeResponse>('/api/voice/transcribe', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const synthesizeVoice = async (text: string, language: string = 'en'): Promise<Blob> => {
  const response = await api.post('/api/voice/synthesize', { text, language }, {
    responseType: 'blob',
  });
  return response.data;
};

// Knowledge Services
export const getKnowledgeStatus = async (): Promise<KnowledgeStatusResponse> => {
  const response = await api.get<KnowledgeStatusResponse>('/api/knowledge/status');
  return response.data;
};

export const ingestKnowledge = async (): Promise<KnowledgeStatusResponse> => {
  const response = await api.post('/api/knowledge/ingest');
  return response.data;
};

export default api;
