'use client';
// src/lib/langContext.tsx

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type { Lang } from './i18n';
import { translations } from './i18n';

interface LangContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof translations['es']) => string;
  months: string[];
}

const LangContext = createContext<LangContextType | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('aquadash-lang') as Lang;
      if (saved === 'es' || saved === 'eu') setLangState(saved);
    } catch { /* ignorar */ }
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('aquadash-lang', l); } catch { /* ignorar */ }
  };

  const t = (key: keyof typeof translations['es']): string => {
    const val = translations[lang][key];
    if (Array.isArray(val)) return (val as string[]).join(',');
    return val as string;
  };

  const months = [...translations[lang].months];

  return (
    <LangContext.Provider value={{ lang, setLang, t, months }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error('useLang must be inside LangProvider');
  return ctx;
}
