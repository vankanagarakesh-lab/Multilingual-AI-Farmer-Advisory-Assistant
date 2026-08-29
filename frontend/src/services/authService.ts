import api from './api';
import { AuthResponse, User, FarmerProfile, FarmerOnboardRequest } from '../types';

export interface OnboardResponse {
  access_token: string;
  token_type: string;
  user: User;
  profile: FarmerProfile;
}

export const authService = {
  async onboard(data: FarmerOnboardRequest): Promise<OnboardResponse> {
    const response = await api.post<OnboardResponse>('/api/auth/onboard', data);
    if (response.data.access_token) {
      localStorage.setItem('krishi_token', response.data.access_token);
      localStorage.setItem('krishi_farmer_uuid', data.uuid);
    }
    return response.data;
  },

  async resumeSession(uuid: string): Promise<OnboardResponse> {
    const response = await api.get<OnboardResponse>(`/api/auth/session/${uuid}`);
    if (response.data.access_token) {
      localStorage.setItem('krishi_token', response.data.access_token);
      localStorage.setItem('krishi_farmer_uuid', uuid);
    }
    return response.data;
  },

  async register(data: { name: string; email: string; password: string }): Promise<User> {
    const response = await api.post<User>('/api/auth/register', data);
    return response.data;
  },

  async login(data: { email: string; password: string }): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>('/api/auth/login', data);
    if (response.data.access_token) {
      localStorage.setItem('krishi_token', response.data.access_token);
    }
    return response.data;
  },

  async getMe(): Promise<User> {
    const response = await api.get<User>('/api/auth/me');
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('krishi_token');
    localStorage.removeItem('krishi_farmer_uuid');
  }
};

