import React from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { Menu, Sprout, Sparkles, MessageSquare, ArrowLeft } from 'lucide-react';
import { WeatherWidget } from '../components/weather/WeatherWidget';
import { LanguageSwitcher } from '../components/layout/LanguageSwitcher';
import { AutonomousFarmDashboard } from '../components/autonomous/AutonomousFarmDashboard';
import { useLanguage } from '../context/LanguageContext';

interface OutletContextType {
  onOpenMobileSidebar: () => void;
}

export const AutonomousFarmPage: React.FC = () => {
  const { onOpenMobileSidebar } = useOutletContext<OutletContextType>();
  const { t } = useLanguage();
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 overflow-y-auto">
      {/* Top Header */}
      <header className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30 shrink-0">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Live Weather Widget */}
          <WeatherWidget />

          <div className="hidden sm:flex items-center space-x-2 truncate">
            <span className="text-sm">🌾</span>
            <h2 className="text-xs font-bold text-slate-200 truncate">
              {t('auto_farm.title', 'Intelligent Autonomous Farm')}
            </h2>
            <span className="text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              FUTURE AI
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Quick Chat Link */}
          <button
            onClick={() => navigate('/')}
            className="hidden md:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 hover:text-white transition"
          >
            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
            <span>Open KRISHI AI Chat</span>
          </button>

          {/* Language Switcher */}
          <LanguageSwitcher />
        </div>
      </header>

      {/* Main Page Content */}
      <main className="flex-1 p-3 sm:p-5 md:p-6 max-w-7xl w-full mx-auto">
        <AutonomousFarmDashboard />
      </main>
    </div>
  );
};
