import { useLocale } from '../../hooks/useLocale';
import type { Locale } from '../../types';

const LANGUAGES: { code: Locale; label: string }[] = [
  { code: 'he', label: 'HE' },
  { code: 'en', label: 'EN' },
  { code: 'ar', label: 'AR' },
];

export function LanguageSwitcher() {
  const { locale, changeLocale } = useLocale();

  return (
    <div className="lang-switcher">
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          className={`lang-btn ${locale === lang.code ? 'active' : ''}`}
          onClick={() => changeLocale(lang.code)}
          aria-current={locale === lang.code ? 'true' : undefined}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
