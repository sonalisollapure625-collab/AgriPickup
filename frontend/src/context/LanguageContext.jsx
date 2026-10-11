import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../config/translations.js';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('agripickup_lang') || 'en';
  });

  const setLanguage = (lang) => {
    if (translations[lang]) {
      setLanguageState(lang);
      localStorage.setItem('agripickup_lang', lang);
    }
  };

  // Helper translation lookup function
  const t = (key, fallback = '') => {
    return translations[language]?.[key] || translations['en']?.[key] || fallback || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
