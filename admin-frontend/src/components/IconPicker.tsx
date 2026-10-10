import { useMemo } from 'react';

export interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  autoGenerate?: string;
  /** Shown instead of the auto-generated preview when no icon is chosen. */
  emptyHint?: string;
  /** Allow typing any short glyph (e.g. "f(x)") in addition to the emoji grid. */
  allowCustom?: boolean;
}

const MATH_ICONS = [
  '➕', '➖', '✖️', '➗', '🔢', '📐', '📏', '🧮',
  '📊', '📈', '📉', '🔣', '💯', '🎯', '🧠', '💡',
  '✏️', '📝', '📚', '🎓', '⭐', '🏆', '🔺', '🔵',
];

const ICON_LABELS: Record<string, string> = {
  '➕': 'חיבור', '➖': 'חיסור', '✖️': 'כפל', '➗': 'חילוק',
  '🔢': 'מספרים', '📐': 'מד זווית', '📏': 'סרגל', '🧮': 'חשבונייה',
  '📊': 'תרשים', '📈': 'גרף עולה', '📉': 'גרף יורד', '🔣': 'סימנים',
  '💯': 'מאה', '🎯': 'מטרה', '🧠': 'מוח', '💡': 'רעיון',
  '✏️': 'עיפרון', '📝': 'רשימה', '📚': 'ספרים', '🎓': 'לימודים',
  '⭐': 'כוכב', '🏆': 'גביע', '🔺': 'משולש', '🔵': 'עיגול',
};

function hashToIcon(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return MATH_ICONS[Math.abs(hash) % MATH_ICONS.length];
}

export default function IconPicker({ value, onChange, autoGenerate, emptyHint, allowCustom }: IconPickerProps) {
  const autoIcon = useMemo(
    () => (autoGenerate ? hashToIcon(autoGenerate) : null),
    [autoGenerate],
  );

  const isAuto = !value && !!autoIcon;
  const displayValue = value || autoIcon || '';

  return (
    <div className="flex flex-col gap-2">
      {/* Selected preview */}
      <div className="flex items-center gap-2">
        <span className="text-2xl">{displayValue || (emptyHint ? '' : '❓')}</span>
        {!value && emptyHint && (
          <span className="text-xs text-[var(--ts)]">{emptyHint}</span>
        )}
        {isAuto && (
          <span className="text-xs text-[var(--ts)]">נוצר אוטומטית</span>
        )}
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-xs text-[var(--ts)] hover:text-red-500 transition-colors"
          >
            איפוס
          </button>
        )}
      </div>

      {allowCustom && (
        <input
          type="text"
          dir="ltr"
          maxLength={20}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="f(x), √, ∑ …"
          aria-label="אייקון מותאם אישית"
          className="w-40 border border-[var(--bd)] rounded px-3 py-1.5 text-sm focus:outline-none focus:border-[var(--g-green)]"
        />
      )}

      {/* Icon grid */}
      <div role="radiogroup" aria-label="בחירת אייקון" className="grid grid-cols-8 gap-1">
        {MATH_ICONS.map((icon) => (
          <button
            key={icon}
            type="button"
            role="radio"
            aria-checked={value === icon}
            aria-label={ICON_LABELS[icon] ?? icon}
            onClick={() => onChange(icon)}
            className={`h-9 w-9 flex items-center justify-center text-lg rounded transition-all ${
              value === icon
                ? 'bg-[var(--g-green)]/15 ring-2 ring-[var(--g-green)]'
                : 'hover:bg-gray-100'
            }`}
          >
            {icon}
          </button>
        ))}
      </div>
    </div>
  );
}
