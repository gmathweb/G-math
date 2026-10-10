import type { Locale } from '../types';

const LOCALE_DIRECTION: Record<Locale, 'rtl' | 'ltr'> = {
  he: 'rtl',
  en: 'ltr',
  ar: 'rtl',
};

export function getDirection(locale: Locale): 'rtl' | 'ltr' {
  return LOCALE_DIRECTION[locale] ?? 'ltr';
}

export function isRTL(locale: Locale): boolean {
  return getDirection(locale) === 'rtl';
}

export function applyDirection(locale: Locale): void {
  const dir = getDirection(locale);
  document.documentElement.setAttribute('dir', dir);
  document.documentElement.setAttribute('lang', locale);
}
