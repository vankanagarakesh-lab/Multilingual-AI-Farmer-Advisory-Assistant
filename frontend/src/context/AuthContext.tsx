import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, FarmerProfile, FarmerOnboardRequest } from '../types';
import { authService } from '../services/authService';
import { farmerService } from '../services/farmerService';

interface AuthContextType {
  user: User | null;
  farmerProfile: FarmerProfile | null;
  farmerUuid: string | null;
  isLoading: boolean;
  onboardFarmer: (data: Omit<FarmerOnboardRequest, 'uuid'>) => Promise<void>;
  updateFarmerProfile: (data: Partial<FarmerProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
  resetDeviceProfile: () => void;
  // Legacy aliases if needed
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Generate robust UUID v4
const generateUUID = (): string => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [farmerProfile, setFarmerProfile] = useState<FarmerProfile | null>(null);
  const [farmerUuid, setFarmerUuid] = useState<string | null>(localStorage.getItem('krishi_farmer_uuid'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initSession = async () => {
    setIsLoading(true);
    const savedUuid = localStorage.getItem('krishi_farmer_uuid');
    const savedToken = localStorage.getItem('krishi_token');

    try {
      if (savedUuid) {
        // Resume session by saved UUID
        const res = await authService.resumeSession(savedUuid);
        setUser(res.user);
        setFarmerProfile(res.profile);
        setFarmerUuid(savedUuid);
      } else if (savedToken) {
        // Resume by token if present
        const userData = await authService.getMe();
        setUser(userData);
        const profileData = await farmerService.getProfile();
        setFarmerProfile(profileData);
      } else {
        setUser(null);
        setFarmerProfile(null);
      }
    } catch (err) {
      console.warn("Session resume notice:", err);
      // If server doesn't find UUID yet, keep user null so Onboarding Form shows
      setUser(null);
      setFarmerProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    initSession();
  }, []);

  const onboardFarmer = async (formData: Omit<FarmerOnboardRequest, 'uuid'>) => {
    setIsLoading(true);
    try {
      const uuid = farmerUuid || generateUUID();
      const payload: FarmerOnboardRequest = {
        ...formData,
        uuid
      };

      const res = await authService.onboard(payload);
      setUser(res.user);
      setFarmerProfile(res.profile);
      setFarmerUuid(uuid);
    } catch (err) {
      console.error("Onboarding failed:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const updateFarmerProfile = async (data: Partial<FarmerProfile>) => {
    try {
      const updated = await farmerService.updateProfile(data);
      setFarmerProfile(updated);
      if (data.name && user) {
        setUser({ ...user, name: data.name });
      }
    } catch (err) {
      console.error("Failed to update profile:", err);
      throw err;
    }
  };

  const refreshProfile = async () => {
    try {
      const profileData = await farmerService.getProfile();
      setFarmerProfile(profileData);
    } catch (err) {
      console.error("Failed to refresh profile:", err);
    }
  };

  const resetDeviceProfile = () => {
    authService.logout();
    setUser(null);
    setFarmerProfile(null);
    setFarmerUuid(null);
  };

  return (
    <AuthContext.Provider value={{
      user,
      farmerProfile,
      farmerUuid,
      isLoading,
      onboardFarmer,
      updateFarmerProfile,
      refreshProfile,
      resetDeviceProfile,
      logout: resetDeviceProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

