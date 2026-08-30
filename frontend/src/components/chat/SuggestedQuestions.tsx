import React from 'react';
import { Sprout, Droplets, TestTube, Bug, Wheat } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface SuggestedQuestionsProps {
  onSelectPrompt: (prompt: string) => void;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ onSelectPrompt }) => {
  const { getSuggestions } = useLanguage();
  const suggestions = getSuggestions();

  const iconMap: Record<string, any> = {
    disease: Sprout,
    water: Droplets,
    fertilizer: TestTube,
    pest: Bug,
    crops: Wheat,
  };

  const colorMap: Record<string, string> = {
    disease: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
    water: 'from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/30',
    fertilizer: 'from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/30',
    pest: 'from-rose-500/20 to-pink-500/10 text-rose-400 border-rose-500/30',
    crops: 'from-teal-500/20 to-emerald-500/10 text-teal-400 border-teal-500/30',
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full mx-auto my-6 px-4">
      {suggestions.map((item, index) => {
        const IconComponent = iconMap[item.category] || Sprout;
        const color = colorMap[item.category] || colorMap.disease;

        return (
          <button
            key={index}
            onClick={() => onSelectPrompt(item.prompt)}
            className={`
              p-4 rounded-2xl bg-gradient-to-br bg-slate-900/90 border border-slate-800
              hover:border-slate-700 hover:bg-slate-800/80 transition duration-200
              text-left flex flex-col justify-between space-y-2 group shadow-lg shadow-black/20
            `}
          >
            <div className="flex items-center space-x-2.5">
              <div className={`p-2 rounded-xl bg-slate-800 border ${color}`}>
                <IconComponent className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider">{item.title}</h3>
            </div>
            <p className="text-xs text-slate-400 group-hover:text-slate-200 transition line-clamp-2 leading-relaxed">
              "{item.prompt}"
            </p>
          </button>
        );
      })}
    </div>
  );
};
