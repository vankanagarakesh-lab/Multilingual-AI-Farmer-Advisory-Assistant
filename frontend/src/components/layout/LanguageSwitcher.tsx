import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage, SupportedLanguage } from '../../context/LanguageContext';

interface LanguageSwitcherProps {
  compact?: boolean;
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ compact = false, className = '' }) => {
  const { currentLanguage, currentLanguageOption, supportedLanguages, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectLanguage = (code: SupportedLanguage) => {
    setLanguage(code, true);
    setIsOpen(false);
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`
          group inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full
          bg-slate-800/90 hover:bg-slate-700/90 border border-slate-700/80 hover:border-emerald-500/50
          text-slate-200 text-xs font-semibold shadow-md shadow-black/20
          transition duration-150 active:scale-95 cursor-pointer
        `}
        title="Switch Application Language"
        aria-label="Switch Language"
        aria-expanded={isOpen}
      >
        <Globe className="w-3.5 h-3.5 text-emerald-400 group-hover:rotate-45 transition-transform duration-300" />
        <span className="font-bold text-emerald-300">
          {currentLanguageOption.nativeName}
        </span>
        {!compact && (
          <span className="hidden md:inline text-[10px] text-slate-400 uppercase tracking-wider">
            ({currentLanguageOption.code.toUpperCase()})
          </span>
        )}
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-400' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`
            absolute right-0 mt-2 w-48 rounded-2xl
            bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 shadow-2xl shadow-black/60
            py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150
          `}
          role="menu"
        >
          <div className="px-3 py-1.5 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center justify-between">
            <span>Select Language</span>
            <span className="text-emerald-400 font-semibold">భారతీయ భాషలు</span>
          </div>

          <div className="p-1 space-y-0.5 max-h-64 overflow-y-auto">
            {supportedLanguages.map((lang) => {
              const isSelected = currentLanguage === lang.code;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => handleSelectLanguage(lang.code)}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl
                    transition duration-150 text-left
                    ${
                      isSelected
                        ? 'bg-emerald-600/20 text-emerald-300 font-bold border border-emerald-500/30'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }
                  `}
                  role="menuitem"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{lang.flag}</span>
                    <span className="font-semibold">{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400">({lang.name})</span>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
