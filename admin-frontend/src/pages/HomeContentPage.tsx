import { useState } from 'react';
import type { FormEvent } from 'react';
import { useSiteSettings, useSaveSiteSettings } from '../api/settings';

const LANGS = [
  { code: 'he', label: 'עברית', dir: 'rtl' },
  { code: 'en', label: 'אנגלית', dir: 'ltr' },
  { code: 'ar', label: 'ערבית', dir: 'rtl' },
] as const;

const TRUST_CARDS = [1, 2, 3] as const;
const ABOUT_FIELDS = ['title', 'body', 'button'] as const;
const BUTTON_LINK_KEY = 'home.about.button_link';

const KEYS = [
  ...TRUST_CARDS.flatMap((n) => [
    `home.trust.${n}.icon`,
    ...LANGS.map((l) => `home.trust.${n}.text_${l.code}`),
  ]),
  ...ABOUT_FIELDS.flatMap((field) => LANGS.map((l) => `home.about.${field}_${l.code}`)),
  BUTTON_LINK_KEY,
];

const inputClass =
  'w-full border border-[var(--bd)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--g-green)]';
const labelClass = 'text-sm font-medium text-[var(--tp)]';

function HomeContentForm({ initial }: { initial: Record<string, string> }) {
  const save = useSaveSiteSettings();
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(KEYS.map((key) => [key, initial[key] ?? ''])),
  );

  const set = (key: string, value: string) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    save.mutate(values);
  };

  const field = (key: string, label: string, dir: 'rtl' | 'ltr', options?: { rows?: number; hint?: string }) => (
    <div key={key} className="flex flex-col gap-1">
      <label htmlFor={key} className={labelClass}>{label}</label>
      {options?.rows ? (
        <textarea
          id={key}
          rows={options.rows}
          dir={dir}
          value={values[key]}
          onChange={(e) => set(key, e.target.value)}
          className={`${inputClass} resize-y`}
        />
      ) : (
        <input
          id={key}
          type="text"
          dir={dir}
          value={values[key]}
          onChange={(e) => set(key, e.target.value)}
          className={inputClass}
        />
      )}
      {options?.hint && <span className="text-xs text-[var(--ts)]">{options.hint}</span>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {/* Trust cards */}
      <div className="bg-white border border-[var(--bd)] rounded-lg">
        <div className="border-b border-[var(--bd)] px-6 py-4">
          <h2 className="text-lg font-bold">🤝 כרטיסי אמון</h2>
          <p className="text-sm text-[var(--ts)]">שלושת הכרטיסים שמתחת לבאנר. ריק באנגלית/ערבית = כמו בעברית</p>
        </div>
        <div className="p-6 grid gap-4 md:grid-cols-3">
          {TRUST_CARDS.map((n) => (
            <fieldset key={n} className="flex flex-col gap-3 border border-[var(--bd)] rounded p-4">
              <legend className="px-1 text-sm font-semibold">כרטיס {n}</legend>
              {field(`home.trust.${n}.icon`, 'אייקון', 'ltr')}
              {LANGS.map((l) => field(`home.trust.${n}.text_${l.code}`, `טקסט (${l.label})`, l.dir))}
            </fieldset>
          ))}
        </div>
      </div>

      {/* About */}
      <div className="bg-white border border-[var(--bd)] rounded-lg">
        <div className="border-b border-[var(--bd)] px-6 py-4">
          <h2 className="text-lg font-bold">🌳 אודות</h2>
          <p className="text-sm text-[var(--ts)]">אזור "אודות" בדף הבית. ריק באנגלית/ערבית = כמו בעברית</p>
        </div>
        <div className="p-6 flex flex-col gap-4">
          {LANGS.map((l) => (
            <fieldset key={l.code} className="flex flex-col gap-3 border border-[var(--bd)] rounded p-4">
              <legend className="px-1 text-sm font-semibold">{l.label}</legend>
              {field(`home.about.title_${l.code}`, 'כותרת', l.dir)}
              {field(`home.about.body_${l.code}`, 'תוכן', l.dir, { rows: 6, hint: 'שורה ריקה = פסקה חדשה' })}
              {field(`home.about.button_${l.code}`, 'טקסט הכפתור', l.dir)}
            </fieldset>
          ))}
          {field(BUTTON_LINK_KEY, 'קישור הכפתור', 'ltr')}
        </div>
      </div>

      <div>
        <button
          type="submit"
          disabled={save.isPending}
          className="px-5 py-2 text-sm font-semibold text-white bg-[var(--g-green)] hover:bg-[var(--g-green)]/90 rounded transition-colors disabled:opacity-50"
        >
          {save.isPending ? (
            <span className="inline-flex items-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              שומר…
            </span>
          ) : (
            'שמירת תוכן דף הבית'
          )}
        </button>
      </div>
    </form>
  );
}

export default function HomeContentPage() {
  const { data, isLoading, dataUpdatedAt } = useSiteSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">תוכן דף הבית</h1>
        <p className="text-sm text-[var(--ts)]">כרטיסי אמון וטקסט "אודות"</p>
      </div>
      {isLoading ? (
        <div className="bg-white border border-[var(--bd)] rounded-lg p-6 animate-pulse">
          <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
          <div className="flex flex-col gap-4">
            <div className="h-10 w-full max-w-md bg-gray-200 rounded" />
            <div className="h-10 w-full max-w-md bg-gray-200 rounded" />
          </div>
        </div>
      ) : !data ? (
        <div role="alert" className="bg-white border border-[var(--bd)] rounded-lg p-6 text-sm text-red-500">
          שגיאה בטעינת תוכן דף הבית
        </div>
      ) : (
        <HomeContentForm key={dataUpdatedAt} initial={data} />
      )}
    </div>
  );
}
