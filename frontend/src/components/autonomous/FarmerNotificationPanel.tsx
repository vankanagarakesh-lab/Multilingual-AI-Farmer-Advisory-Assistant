import React, { useState } from 'react';
import { 
  Bell, 
  Droplets, 
  CloudRain, 
  Cpu, 
  CheckCircle2, 
  Trash2, 
  Filter, 
  Send,
  MessageSquare
} from 'lucide-react';
import { FarmNotification } from '../../types/autonomous';
import { useLanguage } from '../../context/LanguageContext';

interface FarmerNotificationPanelProps {
  notifications: FarmNotification[];
  onClearNotifications: () => void;
}

export const FarmerNotificationPanel: React.FC<FarmerNotificationPanelProps> = ({
  notifications,
  onClearNotifications,
}) => {
  const { t } = useLanguage();
  const [filterType, setFilterType] = useState<string>('all');

  const filtered = notifications.filter((n) => {
    if (filterType === 'all') return true;
    return n.type === filterType;
  });

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 md:p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl space-y-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-sky-900/40">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-base md:text-lg tracking-tight">
                {t('auto_farm.farmer_notifications', 'Farmer Notification Feed')}
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-500/30">
                4. SMS & APP ALERTS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live automated alerts dispatched to farmer's mobile device during autonomous irrigation cycles
            </p>
          </div>
        </div>

        {/* Clear Action */}
        <button
          type="button"
          onClick={onClearNotifications}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-300 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/30 transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear Feed</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterType('all')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition ${
            filterType === 'all'
              ? 'bg-slate-700 text-white shadow-sm'
              : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          All ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterType('ai_decision')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
            filterType === 'ai_decision'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          🤖 AI Decisions
        </button>
        <button
          type="button"
          onClick={() => setFilterType('moisture')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
            filterType === 'moisture'
              ? 'bg-sky-600 text-white shadow-sm'
              : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          💧 Moisture Checks
        </button>
        <button
          type="button"
          onClick={() => setFilterType('weather')}
          className={`px-3 py-1 rounded-xl text-xs font-semibold transition flex items-center gap-1 ${
            filterType === 'weather'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'bg-slate-950/60 text-slate-400 hover:bg-slate-800'
          }`}
        >
          🌧️ Weather Alerts
        </button>
      </div>

      {/* Notifications Timeline List */}
      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <div className="p-8 text-center bg-slate-950/50 rounded-2xl border border-slate-800/80 text-xs text-slate-500 italic">
            No notifications in this category yet. Run simulation or change soil moisture to generate alerts.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-2xl border transition-all duration-300 flex items-start space-x-3 group ${
                item.isNew
                  ? 'bg-slate-800/90 border-emerald-500/50 shadow-lg shadow-emerald-950/40 animate-in fade-in slide-in-from-top-2'
                  : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-900/90 hover:border-slate-700'
              }`}
            >
              {/* Icon avatar */}
              <div className="text-xl p-2 rounded-xl bg-slate-900 border border-slate-800 shrink-0 shadow-sm">
                {item.icon}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-xs font-bold text-slate-200 truncate">
                    {item.title}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400 shrink-0 bg-slate-900 px-2 py-0.5 rounded-md border border-slate-800">
                    {formatTime(item.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-slate-300 font-medium leading-relaxed">
                  {item.message}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer simulation status */}
      <div className="pt-2 text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80">
        <span className="flex items-center gap-1.5 text-emerald-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          Farmer GSM/SMS Notification Gateway: Active
        </span>
        <span className="text-slate-400">Push Delivery: &lt; 500ms</span>
      </div>
    </div>
  );
};
