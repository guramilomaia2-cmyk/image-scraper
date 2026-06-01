import { createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { TRANSLATIONS } from '../utils/translations';

const BASE_URL = 'https://image-scraper-rqhl.onrender.com';
const LanguageContext = createContext();

const SEO = {
  ka: {
    title: 'Product Image Extractor — სურათების ამოღება',
    description: 'ამოიღეთ და გადმოწერეთ სურათები ნებისმიერი ვებსაიტიდან ერთი კლიკით. უფასო ონლაინ სურათების ამომღები Shopify, WooCommerce, Magento და სხვა პლატფორმებისთვის.',
    htmlLang: 'ka',
  },
  en: {
    title: 'Product Image Extractor — Extract Images from Any Website',
    description: 'Extract and download all images from any website in one click. Free online product image extractor for Shopify, WooCommerce, Magento, Salesforce and more.',
    htmlLang: 'en',
  },
};

export function LanguageProvider({ children }) {
  const { lang } = useParams();
  const navigate = useNavigate();
  const currentLang = lang === 'en' ? 'en' : 'ka';

  // Dynamic SEO: update <head> tags based on language
  useEffect(() => {
    const seo = SEO[currentLang];

    // html lang attribute
    document.documentElement.setAttribute('lang', seo.htmlLang);

    // title
    document.title = seo.title;

    // meta description
    let descMeta = document.querySelector('meta[name="description"]');
    if (descMeta) descMeta.setAttribute('content', seo.description);

    // canonical
    let canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) {
      canonical.setAttribute('href', `${BASE_URL}/${currentLang}`);
    }

    // hreflang alternates
    // Remove old ones first
    document.querySelectorAll('link[hreflang]').forEach(el => el.remove());

    // Add ka alternate
    const kaLink = document.createElement('link');
    kaLink.rel = 'alternate';
    kaLink.hreflang = 'ka';
    kaLink.href = `${BASE_URL}/ka`;
    document.head.appendChild(kaLink);

    // Add en alternate
    const enLink = document.createElement('link');
    enLink.rel = 'alternate';
    enLink.hreflang = 'en';
    enLink.href = `${BASE_URL}/en`;
    document.head.appendChild(enLink);

    // Add x-default alternate
    const defaultLink = document.createElement('link');
    defaultLink.rel = 'alternate';
    defaultLink.hreflang = 'x-default';
    defaultLink.href = `${BASE_URL}/ka`;
    document.head.appendChild(defaultLink);
  }, [currentLang]);

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

