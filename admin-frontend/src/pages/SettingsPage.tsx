import { useEffect, useRef, useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useSettings, useUpdateSettings } from '../api/settings';
import type { SiteSettings, DesignSettings } from '../types';

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api';

const LANGUAGES = [
  { value: 'he', label: 'עברית' },
  { value: 'en', label: 'אנגלית' },
  { value: 'ar', label: 'ערבית' },
] as const;

// ── Site Settings Section ────────────────────────────────────────────

function SiteSettingsSection({
  defaults,
  onSave,
  saving,
}: {
  defaults?: SiteSettings;
  onSave: (data: SiteSettings) => void;
  saving: boolean;
}) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<SiteSettings>({
    defaultValues: defaults ?? {
      site_name: '',
      site_description: '',
      active_languages: ['he'],
    },
  });

  useEffect(() => {
    if (defaults) reset(defaults);
  }, [defaults, reset]);

  const activeLangs = watch('active_languages') ?? [];

  const toggleLang = useCallback(
    (lang: string) => {
      const current = watch('active_languages') ?? [];
      const next = current.includes(lang)
        ? current.filter((l) => l !== lang)
        : [...current, lang];
      setValue('active_languages', next, { shouldDirty: true });
    },
    [watch, setValue],
  );

  return (
    <div className="bg-white border border-[var(--bd)] rounded-lg">
      <div className="border-b border-[var(--bd)] px-6 py-4">
        <h2 className="text-lg font-bold">⚙️ הגדרות אתר</h2>
        <p className="text-sm text-[var(--ts)]">הגדרות בסיסיות של האתר</p>
      </div>
      <form onSubmit={handleSubmit(onSave)} className="p-6 flex flex-col gap-5">
        {/* Site name */}
        <div className="flex flex-col gap-1">
          <label htmlFor="site_name" className="text-sm font-medium text-[var(--tp)]">
            שם האתר
          </label>
          <input
            id="site_name"
            type="text"
            {...register('site_name', { required: true })}
            placeholder="למשל: G-math"
            className="w-full max-w-md border border-[var(--bd)] rounded px-3 py-2 text-sm focus:outline-none focus:border-[var(--g-green)]"
          />
        </div>

        {/* Site description */}
        <div className="flex flex-col gap-1">
          <label htmlFor="site_description" className="text-sm font-medium text-[var(--tp)]">
            תיאור האתר
          </label>
          <textarea
            id="site_description"
            rows={3}
            {...register('site_description')}
            placeholder="תיאור קצר של האתר"
            className="w-full max-w-md border border-[var(--bd)] rounded px-3 py-2 text-sm resize-y focus:outline-none focus:border-[var(--g-green)]"
          />
        </div>

        {/* Active languages */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--tp)]">שפות פעילות</span>
          <div className="flex gap-4">
            {LANGUAGES.map((lang) => (
              <label
                key={lang.value}
                className="inline-flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={activeLangs.includes(lang.value)}
                  onChange={() => toggleLang(lang.value)}
                  className="h-4 w-4 rounded border-[var(--bd)] text-[var(--g-green)] accent-[var(--g-green)]"
                />
                <span className="text-sm">{lang.label}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white bg-[var(--g-green)] hover:bg-[var(--g-green)]/90 rounded transition-colors disabled:opacity-50"
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                שומר…
              </span>
            ) : (
              'שמירת הגדרות אתר'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Design Settings Section ──────────────────────────────────────────

function DesignSettingsSection({
  defaults,
  onSave,
  saving,
}: {
  defaults?: DesignSettings;
  onSave: (data: DesignSettings) => void;
  saving: boolean;
}) {
  const { register, handleSubmit, reset, setValue, watch } = useForm<DesignSettings>({
    defaultValues: defaults ?? {
      primary_color: '#4CAF50',
      secondary_color: '#1565C0',
      logo_url: '',
    },
  });

  useEffect(() => {
    if (defaults) reset(defaults);
  }, [defaults, reset]);

  const [uploading, setUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const logoUrl = watch('logo_url');

  const handleLogoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('admin_token');
        const res = await fetch(`${BASE_URL}/admin/files`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: formData,
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setValue('logo_url', data.url ?? data.filename ?? '', { shouldDirty: true });
        toast.success('הלוגו הועלה בהצלחה');
      } catch {
        toast.error('שגיאה בהעלאת הלוגו');
      } finally {
        setUploading(false);
      }
    },
    [setValue],
  );

  return (
    <div className="bg-white border border-[var(--bd)] rounded-lg">
      <div className="border-b border-[var(--bd)] px-6 py-4">
        <h2 className="text-lg font-bold">🎨 הגדרות עיצוב</h2>
        <p className="text-sm text-[var(--ts)]">התאמת צבעים ולוגו</p>
      </div>
      <form onSubmit={handleSubmit(onSave)} className="p-6 flex flex-col gap-5">
        {/* Primary color */}
        <div className="flex flex-col gap-1">
          <label htmlFor="primary_color" className="text-sm font-medium text-[var(--tp)]">
            צבע ראשי
          </label>
          <div className="flex items-center gap-3">
            <input
              id="primary_color"
              type="color"
              {...register('primary_color')}
              className="h-10 w-14 cursor-pointer border border-[var(--bd)] rounded"
            />
            <span className="text-xs text-[var(--ts)] font-mono">
              {watch('primary_color')}
            </span>
          </div>
        </div>

        {/* Secondary color */}
        <div className="flex flex-col gap-1">
          <label htmlFor="secondary_color" className="text-sm font-medium text-[var(--tp)]">
            צבע משני
          </label>
          <div className="flex items-center gap-3">
            <input
              id="secondary_color"
              type="color"
              {...register('secondary_color')}
              className="h-10 w-14 cursor-pointer border border-[var(--bd)] rounded"
            />
            <span className="text-xs text-[var(--ts)] font-mono">
              {watch('secondary_color')}
            </span>
          </div>
        </div>

        {/* Logo upload */}
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-[var(--tp)]">לוגו</span>
          <div
            onClick={() => logoInputRef.current?.click()}
            className="flex items-center gap-4 border border-dashed border-[var(--bd)] rounded-lg p-4 cursor-pointer hover:border-[var(--g-green)] hover:bg-gray-50 transition-colors max-w-md"
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="לוגו"
                className="h-12 w-12 object-contain rounded"
              />
            ) : (
              <div className="h-12 w-12 flex items-center justify-center rounded bg-gray-100 text-2xl">
                🖼️
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-sm text-[var(--tp)]">
                {uploading ? 'מעלה…' : 'לחצו להעלאת לוגו'}
              </span>
              <span className="text-xs text-[var(--ts)]">PNG, JPG, SVG</span>
            </div>
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleLogoUpload}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 text-sm font-semibold text-white bg-[var(--g-green)] hover:bg-[var(--g-green)]/90 rounded transition-colors disabled:opacity-50"
          >
            {saving ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                שומר…
              </span>
            ) : (
              'שמירת הגדרות עיצוב'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();

  const handleSiteSave = useCallback(
    (site: SiteSettings) => {
      if (!settings) return;
      updateSettings.mutate({ ...settings, site });
    },
    [settings, updateSettings],
  );

  const handleDesignSave = useCallback(
    (design: DesignSettings) => {
      if (!settings) return;
      updateSettings.mutate({ ...settings, design });
    },
    [settings, updateSettings],
  );

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">הגדרות</h1>
          <p className="text-sm text-[var(--ts)]">הגדרות כלליות ועיצוב</p>
        </div>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="bg-white border border-[var(--bd)] rounded-lg p-6 animate-pulse"
          >
            <div className="h-6 w-40 bg-gray-200 rounded mb-4" />
            <div className="h-4 w-60 bg-gray-200 rounded mb-6" />
            <div className="flex flex-col gap-4">
              <div className="h-10 w-full max-w-md bg-gray-200 rounded" />
              <div className="h-10 w-full max-w-md bg-gray-200 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">הגדרות</h1>
        <p className="text-sm text-[var(--ts)]">הגדרות כלליות ועיצוב</p>
      </div>

      <SiteSettingsSection
        defaults={settings?.site}
        onSave={handleSiteSave}
        saving={updateSettings.isPending}
      />

      <DesignSettingsSection
        defaults={settings?.design}
        onSave={handleDesignSave}
        saving={updateSettings.isPending}
      />
    </div>
  );
}
