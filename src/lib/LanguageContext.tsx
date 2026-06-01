import React, { createContext, useContext, useState, ReactNode } from 'react';

type LangOption = 'en' | 'bn';

interface LanguageContextType {
  lang: LangOption;
  setLang: (lang: LangOption) => void;
  t: (en: string, bn: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LangOption>('bn');

  const t = (en: string, bn: string) => {
    return lang === 'en' ? en : bn;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
