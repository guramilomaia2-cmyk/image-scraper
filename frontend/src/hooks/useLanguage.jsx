import { createContext, useContext, useMemo, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TRANSLATIONS } from '../utils/translations';

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const { lang } = useParams();
  const navigate = useNavigate();
  const currentLang = lang === 'en' ? 'en' : 'ka';

  const t = useCallback(
    (key) => {
      const val = TRANSLATIONS[currentLang]?.[key];
      return typeof val === 'string' ? val : val;
    },
    [currentLang]
  );

  const toggleLanguage = useCallback(() => {
    const newLang = currentLang === 'ka' ? 'en' : 'ka';
    navigate(`/${newLang}`, { replace: true });
  }, [currentLang, navigate]);

  const value = useMemo(
    () => ({ lang: currentLang, t, toggleLanguage }),
    [currentLang, t, toggleLanguage]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be inside LanguageProvider');
  return ctx;
}
