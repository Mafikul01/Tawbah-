import React, { createContext, useContext, useState, ReactNode } from 'react';

type LangOption = 'en' | 'bn' | 'both';

interface LanguageContextType {
  lang: LangOption;
  setLang: (lang: LangOption) => void;
  t: (en: string, bn: string) => string | ReactNode;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LangOption>('both');

  const t = (en: string, bn: string) => {
    if (lang === 'en') return en;
    if (lang === 'bn') return bn;
    return (
      <span className="inline-flex flex-col sm:flex-row sm:gap-1 items-start sm:items-center">
        <span>{en}</span>
        <span className="text-[0.8em] opacity-80 font-normal">({bn})</span>
      </span>
    );
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
