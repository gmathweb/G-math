import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import heCommon from './locales/he/common.json';
import enCommon from './locales/en/common.json';
import arCommon from './locales/ar/common.json';

const resources = {
  he: { common: heCommon },
  en: { common: enCommon },
  ar: { common: arCommon },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'he',
    supportedLngs: ['he', 'en', 'ar'],
    load: 'languageOnly',
    defaultNS: 'common',
    ns: ['common'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
