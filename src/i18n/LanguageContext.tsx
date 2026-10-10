import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppLanguage, translations, SUPPORTED_LANGUAGES, LanguageInfo } from './translations';
import { safeGetItem, safeSetItem } from '../utils/storage';

const STORAGE_LANG_KEY = 'kulliyyat_tatbiq_lang';

interface LanguageContextType {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  t: (key: string, fallback?: string) => string;
  dir: 'ltr' | 'rtl';
  isArabic: boolean;
  isHausa: boolean;
  isEnglish: boolean;
  supportedLanguages: LanguageInfo[];
  currentLanguageInfo: LanguageInfo;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<AppLanguage>(() => {
    const saved = safeGetItem(STORAGE_LANG_KEY);
    if (saved === 'en' || saved === 'ar' || saved === 'ha') {
      return saved;
    }
    return 'en';
  });

  const currentLanguageInfo =
    SUPPORTED_LANGUAGES.find((l) => l.code === language) || SUPPORTED_LANGUAGES[0];

  const dir = currentLanguageInfo.dir;

  useEffect(() => {
    // Update HTML root attributes for direction and language
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
    safeSetItem(STORAGE_LANG_KEY, language);
  }, [language, dir]);

  const setLanguage = (lang: AppLanguage) => {
    setLanguageState(lang);
    safeSetItem(STORAGE_LANG_KEY, lang);
  };

  const t = (key: string, fallback?: string): string => {
    const langDict = translations[language] || translations.en;
    if (langDict[key]) return langDict[key];
    if (translations.en[key]) return translations.en[key];
    return fallback || key;
  };

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    dir,
    isArabic: language === 'ar',
    isHausa: language === 'ha',
    isEnglish: language === 'en',
    supportedLanguages: SUPPORTED_LANGUAGES,
    currentLanguageInfo,
  };

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
