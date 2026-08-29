export interface User {
  id: number;
  uuid?: string;
  name: string;
  email?: string;
  created_at: string;
}

export interface FarmerProfile {
  id?: number;
  user_id?: number;
  name?: string;
  age?: number;
  preferred_language: string;
  location: string;
  farm_size: string;
  primary_crop: string;
  soil_type?: string;
  current_crop_stage?: string;
  voice_response_enabled?: boolean;
  updated_at?: string;
}

export interface FarmerOnboardRequest {
  uuid: string;
  name: string;
  age?: number;
  location?: string;
  farm_size?: string;
  primary_crop?: string;
  preferred_language?: string;
}

export interface KnowledgeSource {
  title: string;
  source: string;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant';
  content: string;
  language?: string;
  imageUrl?: string;
  image_url?: string;
  sources?: KnowledgeSource[];
  created_at: string;
}

export interface Conversation {
  id: number;
  user_id: number;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: Message[];
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface ChatMessageRequest {
  message: string;
  conversation_id?: number;
  response_language?: string;
  image_data?: string;
}

export interface ChatMessageResponse {
  conversation_id: number;
  user_message: Message;
  ai_message: Message;
}

export interface DiseaseDetectionResponse {
  success: boolean;
  plant_name?: string;
  disease_name?: string;
  confidence?: number;
  is_healthy?: boolean;
  is_plant?: boolean;
  causes?: string[];
  treatment?: string[];
  prevention?: string[];
  formatted_response: string;
}

export interface VoiceTranscribeResponse {
  text: string;
  language: string;
  confidence?: number | null;
}

export interface KnowledgeStatusResponse {
  document_count: number;
  chunk_count: number;
}
