import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { ChatPage } from './pages/ChatPage';
import { ProfilePage } from './pages/ProfilePage';
import { ConversationsPage } from './pages/ConversationsPage';
import { FarmerOnboardingForm } from './components/onboarding/FarmerOnboardingForm';
import { Loader2 } from 'lucide-react';

import { LanguageProvider } from './context/LanguageContext';
import { SimulatorPage } from './pages/SimulatorPage';
import { AutonomousFarmPage } from './pages/AutonomousFarmPage';

export const AppContent: React.FC = () => {
  const { user, farmerProfile, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 text-slate-400 space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
        <span className="text-sm font-semibold text-slate-300">Loading KRISHI AI...</span>
      </div>
    );
  }

  // If farmer is not yet onboarded on this device, directly show Farmer Information Form
  if (!user && !farmerProfile) {
    return <FarmerOnboardingForm />;
  }

  // Otherwise, directly open KRISHI AI main chat interface
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<ChatPage />} />
        <Route path="/chat/:conversationId" element={<ChatPage />} />
        <Route path="/simulator" element={<SimulatorPage />} />
        <Route path="/autonomous-farm" element={<AutonomousFarmPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/conversations" element={<ConversationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;

