import React, { useState } from 'react';
import { Menu, Sprout, MapPin, Layers, Wheat, BookOpen, Mic, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WeatherWidget } from '../weather/WeatherWidget';
import { FarmSimulatorModal } from '../simulator/FarmSimulatorModal';

interface ChatHeaderProps {
  title?: string;
  onOpenMobileSidebar: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ title, onOpenMobileSidebar }) => {
  const { farmerProfile } = useAuth();
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const hasContext = farmerProfile && (
    farmerProfile.primary_crop || farmerProfile.location || farmerProfile.current_crop_stage
  );

  return (
    <>
      <header className="h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            aria-label="Open sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Live Weather Widget in Top Header */}
          <WeatherWidget />

          <div className="hidden xl:flex items-center space-x-2 truncate">
            <Sprout className="w-4 h-4 text-emerald-500 shrink-0" />
            <h2 className="text-xs font-semibold text-slate-300 truncate">
              {title || 'KRISHI AI Multilingual Assistant'}
            </h2>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Prominent "Simulate My Farm" Button */}
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="group relative inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-400 text-white text-xs font-bold shadow-lg shadow-emerald-950/60 border border-emerald-400/30 transition duration-200 active:scale-95 animate-pulse hover:animate-none"
          >
            <span className="text-sm">🌾</span>
            <span className="tracking-tight">Simulate My Farm</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-300 group-hover:rotate-12 transition-transform" />
          </button>

          {/* RAG & Multilingual Active Badges */}
          <div className="hidden sm:flex items-center space-x-1.5 text-[11px] bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 px-2.5 py-1 rounded-full">
            <BookOpen className="w-3 h-3 text-emerald-400" />
            <span className="font-semibold">RAG Knowledge</span>
            <span className="text-emerald-500">•</span>
            <Mic className="w-3 h-3 text-emerald-400" />
            <span>Telugu / English Voice</span>
          </div>

          {/* Active Context Indicators */}
          {hasContext && (
            <div className="hidden lg:flex items-center space-x-2 text-xs bg-slate-800/80 border border-slate-700/60 text-slate-300 px-3 py-1 rounded-full">
              <span className="text-emerald-400 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Context:
              </span>
              {farmerProfile.primary_crop && (
                <span className="flex items-center gap-1 text-slate-300">
                  <Wheat className="w-3 h-3 text-amber-400" />
                  {farmerProfile.primary_crop}
                </span>
              )}
              {farmerProfile.current_crop_stage && (
                <span className="text-slate-400">• {farmerProfile.current_crop_stage}</span>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Simulator Modal */}
      <FarmSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
    </>
  );
};
