import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { AppLanguage } from '../i18n/translations';

interface LanguageSelectorProps {
  variant?: 'compact' | 'pills' | 'full';
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  variant = 'compact',
  className = '',
}) => {
  const { language, setLanguage, supportedLanguages, currentLanguageInfo } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (variant === 'pills') {
    return (
      <div className={`inline-flex items-center gap-1 p-1 bg-stone-100 rounded-xl border border-stone-200 ${className}`}>
        {supportedLanguages.map((lang) => {
          const isActive = language === lang.code;
          return (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-emerald-900 shadow-xs border border-stone-200/80 font-black'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-stone-200/60'
              }`}
              title={lang.name}
            >
              <span>{lang.flag}</span>
              <span>{lang.nativeName}</span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/90 hover:bg-white border border-stone-200 text-xs font-bold text-slate-700 hover:text-slate-900 shadow-2xs transition-all cursor-pointer active:scale-95"
        title="Select App Language / اختر اللغة / Zaɓi Harshe"
      >
        <Globe className="w-3.5 h-3.5 text-emerald-700" />
        <span className="text-sm">{currentLanguageInfo.flag}</span>
        <span className="hidden sm:inline font-semibold">{currentLanguageInfo.nativeName}</span>
        <ChevronDown className="w-3 h-3 text-slate-400" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-48 rounded-2xl bg-white border border-stone-200 shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1.5 border-b border-stone-100 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
            App Language / Yare / اللغة
          </div>
          {supportedLanguages.map((lang) => {
            const isActive = language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code as AppLanguage);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 text-xs font-bold flex items-center justify-between transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-emerald-50 text-emerald-900'
                    : 'text-slate-700 hover:bg-stone-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">{lang.flag}</span>
                  <div>
                    <span className="block leading-tight">{lang.nativeName}</span>
                    <span className="text-[10px] text-slate-400 font-normal">{lang.name}</span>
                  </div>
                </div>
                {isActive && <Check className="w-4 h-4 text-emerald-700" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
