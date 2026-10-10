import { useTranslation } from 'react-i18next';
import { useTextSize, type TextSize } from '../../hooks/useTextSize';

const SIZES: { key: TextSize; label: string }[] = [
  { key: 'normal', label: 'A' },
  { key: 'large', label: 'A' },
  { key: 'xl', label: 'A' },
];

export function TextSizeControl() {
  const { t } = useTranslation();
  const { textSize, setTextSize } = useTextSize();

  return (
    <div
      className="text-size-control"
      role="group"
      aria-label={t('text_size_label')}
    >
      <span className="zl" aria-hidden="true">🔍</span>
      {SIZES.map((size) => (
        <button
          key={size.key}
          type="button"
          className={`text-size-btn text-size-btn--${size.key}${textSize === size.key ? ' active' : ''}`}
          onClick={() => setTextSize(size.key)}
          aria-pressed={textSize === size.key}
          aria-label={t(`text_size_${size.key}`)}
          title={t(`text_size_${size.key}`)}
        >
          {size.label}
        </button>
      ))}
    </div>
  );
}
