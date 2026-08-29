import api from './api';
import { FarmerProfile } from '../types';

export const farmerService = {
  async getProfile(): Promise<FarmerProfile> {
    const response = await api.get<FarmerProfile>('/api/farmer/profile');
    return response.data;
  },

  async updateProfile(data: Partial<FarmerProfile>): Promise<FarmerProfile> {
    const response = await api.put<FarmerProfile>('/api/farmer/profile', data);
    return response.data;
  }
};
