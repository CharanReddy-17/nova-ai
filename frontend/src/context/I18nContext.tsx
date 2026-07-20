'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';
import en from '@/i18n/en.json';
import hi from '@/i18n/hi.json';
import te from '@/i18n/te.json';
import es from '@/i18n/es.json';

type LangCode = 'en' | 'hi' | 'te' | 'es';

const LANGS: Record<LangCode, Record<string, string>> = { en, hi, te, es };

const LANG_NAMES: Record<LangCode, string> = {
  en: 'English', hi: 'हिंदी', te: 'తెలుగు', es: 'Español',
};

interface I18nContextType {
  lang: LangCode;
  t: (key: string) => string;
  setLang: (lang: LangCode) => void;
  langName: string;
  allLangs: { code: LangCode; name: string }[];
}

const I18nContext = createContext<I18nContextType | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<LangCode>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('cosmic_lang') as LangCode) || 'en';
    }
    return 'en';
  });

  const setLang = useCallback((code: LangCode) => {
    setLangState(code);
    localStorage.setItem('cosmic_lang', code);
  }, []);

  const t = useCallback((key: string): string => {
    return LANGS[lang]?.[key] || LANGS.en?.[key] || key;
  }, [lang]);

  return (
    <I18nContext.Provider value={{
      lang, t, setLang,
      langName: LANG_NAMES[lang],
      allLangs: (Object.keys(LANGS) as LangCode[]).map(code => ({ code, name: LANG_NAMES[code] })),
    }}>
      {children}
    </I18nContext.Provider>
  );
}

export const useI18n = () => {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be inside I18nProvider');
  return ctx;
};
