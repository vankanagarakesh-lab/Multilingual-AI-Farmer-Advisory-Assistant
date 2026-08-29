import React from 'react';
import { Sprout, Droplets, TestTube, Bug } from 'lucide-react';

interface SuggestedQuestionsProps {
  onSelectPrompt: (prompt: string) => void;
}

export const SuggestedQuestions: React.FC<SuggestedQuestionsProps> = ({ onSelectPrompt }) => {
  const suggestions = [
    {
      icon: Sprout,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-400 border-emerald-500/30',
      title: '🌱 English Query',
      prompt: 'My tomato leaves are turning yellow. What could be the cause and recommended actions?',
    },
    {
      icon: Droplets,
      color: 'from-blue-500/20 to-cyan-500/10 text-blue-400 border-blue-500/30',
      title: '🌾 తెలుగు ప్రశ్న (Telugu Query)',
      prompt: 'నా టమాటా మొక్కల ఆకులు పసుపు రంగులోకి మారుతున్నాయి. ఏమి చేయాలి?',
    },
    {
      icon: TestTube,
      color: 'from-amber-500/20 to-yellow-500/10 text-amber-400 border-amber-500/30',
      title: '🧪 Mixed Language Query',
      prompt: 'నా tomato leaves yellow అవుతున్నాయి, ఏమి చేయాలి?',
    },
    {
      icon: Bug,
      color: 'from-rose-500/20 to-pink-500/10 text-rose-400 border-rose-500/30',
      title: '🐛 Rice Paddy Irrigation',
      prompt: 'వరి సాగులో నీటి యాజమాన్యం మరియు పసుపు మచ్చల నివారణ గురించి చెప్పండి.',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl w-full mx-auto my-6 px-4">
      {suggestions.map((item, index) => {
        const IconComponent = item.icon;
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
              <div className={`p-2 rounded-xl bg-slate-800 border ${item.color}`}>
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
