import React from 'react';
import { Menu, Sprout, MapPin, Layers, Wheat, BookOpen, Mic } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { WeatherWidget } from '../weather/WeatherWidget';

interface ChatHeaderProps {
  title?: string;
  onOpenMobileSidebar: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ title, onOpenMobileSidebar }) => {
  const { farmerProfile } = useAuth();

  const hasContext = farmerProfile && (
    farmerProfile.primary_crop || farmerProfile.location || farmerProfile.current_crop_stage
  );

  return (
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

        <div className="hidden lg:flex items-center space-x-2 truncate">
          <Sprout className="w-4 h-4 text-emerald-500 shrink-0" />
          <h2 className="text-xs font-semibold text-slate-300 truncate">
            {title || 'KRISHI AI Multilingual Assistant'}
          </h2>
        </div>
      </div>

      <div className="flex items-center space-x-2">
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
          <div className="hidden md:flex items-center space-x-2 text-xs bg-slate-800/80 border border-slate-700/60 text-slate-300 px-3 py-1 rounded-full">
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
            {farmerProfile.location && (
              <span className="text-slate-400 hidden lg:inline">• {farmerProfile.location}</span>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
