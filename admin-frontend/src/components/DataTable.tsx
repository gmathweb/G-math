import { useState, useCallback } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  width?: string;
}

export interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  actions?: (item: T, index: number) => React.ReactNode;
  emptyIcon?: string;
  emptyMessage?: string;
  loading?: boolean;
  caption?: string;
}

type SortDir = 'asc' | 'desc';

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  actions,
  emptyIcon = '📭',
  emptyMessage = 'אין נתונים להצגה',
  loading = false,
  caption,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
    },
    [sortKey],
  );

  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = a[sortKey];
        const bv = b[sortKey];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp =
          typeof av === 'number' && typeof bv === 'number'
            ? av - bv
            : String(av).localeCompare(String(bv), 'he');
        return sortDir === 'asc' ? cmp : -cmp;
      })
    : data;

  const skeletonRows = 5;

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse text-sm" role="table">
        {caption && <caption className="sr-only">{caption}</caption>}
        <thead>
          <tr className="border-y border-[var(--bd)] bg-[var(--bg2)]">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={`px-4 py-3 text-start font-semibold text-[var(--ts)] ${
                  col.sortable ? 'cursor-pointer select-none hover:text-[var(--tp)]' : ''
                }`}
                onClick={col.sortable ? () => handleSort(col.key) : undefined}
                aria-sort={col.sortable ? (sortKey === col.key ? (sortDir === 'asc' ? 'ascending' : 'descending') : 'none') : undefined}
              >
                <span className="inline-flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    <span className="text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
                  )}
                </span>
              </th>
            ))}
            {actions && (
              <th scope="col" className="px-4 py-3 text-start font-semibold text-[var(--ts)]">
                <span className="sr-only">פעולות</span>
              </th>
            )}
          </tr>
        </thead>

        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }).map((_, i) => (
                <tr
                  key={`skel-${i}`}
                  className="border-b border-[var(--bd)]"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3">
                      <div className="h-4 w-16 animate-pulse rounded bg-gray-200" />
                    </td>
                  )}
                </tr>
              ))
            : sorted.length === 0
              ? (
                <tr>
                  <td
                    colSpan={columns.length + (actions ? 1 : 0)}
                    className="py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-[var(--ts)]">
                      <span className="text-4xl">{emptyIcon}</span>
                      <span>{emptyMessage}</span>
                    </div>
                  </td>
                </tr>
              )
              : sorted.map((item, idx) => (
                <tr
                  key={String(item['id'] ?? idx)}
                  className="border-b border-[var(--bd)] bg-white transition-colors hover:bg-gray-50"
                >
                  {columns.map((col) => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render
                        ? col.render(item, idx)
                        : (String(item[col.key] ?? ''))}
                    </td>
                  ))}
                  {actions && (
                    <td className="px-4 py-3">{actions(item, idx)}</td>
                  )}
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  );
}
