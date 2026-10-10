import { useTranslation } from 'react-i18next';

interface ContentNotAvailableProps {
  availableLocales?: string[];
}

export function ContentNotAvailable({ availableLocales }: ContentNotAvailableProps) {
  const { t } = useTranslation();

  return (
    <div className="content-not-available">
      <p>{t('not_available')}</p>
      {availableLocales && availableLocales.length > 0 && (
        <p>Available in: {availableLocales.join(', ')}</p>
      )}
    </div>
  );
}
