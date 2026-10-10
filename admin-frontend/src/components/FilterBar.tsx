import { useState, useEffect, useRef, useCallback } from 'react';

export interface FilterBarProps {
  filters?: {
    name: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
  searchPlaceholder?: string;
  onFilterChange: (filters: Record<string, string>) => void;
  resultCount?: number;
  resultLabel?: string;
}

export default function FilterBar({
  filters = [],
  searchPlaceholder = 'חיפוש…',
  onFilterChange,
  resultCount,
  resultLabel = 'תוצאות',
}: FilterBarProps) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = { search: '' };
    for (const f of filters) init[f.name] = '';
    return init;
  });

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const onFilterChangeRef = useRef(onFilterChange);
  onFilterChangeRef.current = onFilterChange;

  const emitChange = useCallback((next: Record<string, string>) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      onFilterChangeRef.current(next);
    }, 300);
  }, []);

  // Emit on select changes immediately
  const handleSelectChange = (name: string, value: string) => {
    const next = { ...values, [name]: value };
    setValues(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    onFilterChangeRef.current(next);
  };

  const handleSearchChange = (value: string) => {
    const next = { ...values, search: value };
    setValues(next);
    emitChange(next);
  };

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return (
    <div className="flex flex-wrap items-center gap-3 bg-white border-y border-[var(--bd)] px-4 py-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <span className="absolute start-3 top-1/2 -translate-y-1/2 text-[var(--ts)] text-sm pointer-events-none">
          🔍
        </span>
        <input
          type="text"
          value={values.search}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="w-full border border-[var(--bd)] rounded ps-9 pe-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--g-green)]"
        />
      </div>

      {/* Dropdowns */}
      {filters.map((filter) => (
        <select
          key={filter.name}
          value={values[filter.name] ?? ''}
          onChange={(e) => handleSelectChange(filter.name, e.target.value)}
          aria-label={filter.label}
          className="border border-[var(--bd)] rounded px-3 py-2 text-sm bg-white focus:outline-none focus:border-[var(--g-green)]"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}

      {/* Result count */}
      {resultCount != null && (
        <span className="text-sm text-[var(--ts)] ms-auto whitespace-nowrap" role="status" aria-live="polite">
          {resultCount} {resultLabel}
        </span>
      )}
    </div>
  );
}
