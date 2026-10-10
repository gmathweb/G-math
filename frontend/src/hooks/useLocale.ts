import { useTranslation } from 'react-i18next';
import type { Locale } from '../types';

const SUPPORTED: Locale[] = ['he', 'en', 'ar'];

function normalizeLocale(lang: string | undefined): Locale {
  const base = (lang || 'he').split('-')[0] as Locale;
  return SUPPORTED.includes(base) ? base : 'he';
}

export function useLocale() {
  const { i18n } = useTranslation();
  const locale = normalizeLocale(i18n.language);

  const changeLocale = (newLocale: Locale) => {
    i18n.changeLanguage(newLocale);
  };

  return { locale, changeLocale };
}
