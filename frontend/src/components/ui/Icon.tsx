import './Button.css';

export type IconName =
  | 'home' | 'chevron' | 'arrow-start' | 'arrow-end' | 'list' | 'panel' | 'presentation'
  | 'file' | 'expand' | 'exit' | 'check' | 'close' | 'previous' | 'next';

const paths: Record<IconName, string> = {
  home: 'M3 11 12 3l9 8M5 9.5V21h5v-6h4v6h5V9.5',
  chevron: 'm9 6 6 6-6 6',
  'arrow-start': 'M19 12H5m6-6-6 6 6 6',
  'arrow-end': 'M5 12h14m-6-6 6 6-6 6',
  list: 'M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01',
  panel: 'M3 4h18v16H3zM9 4v16',
  presentation: 'M4 6h13v13H4zM8 2h13v13',
  file: 'M14 3H6v18h12V7zM14 3v4h4M9 13h6M9 17h6',
  expand: 'M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5',
  exit: 'M9 3v6H3m12-6v6h6M3 15h6v6m12-6h-6v6',
  check: 'm5 12 4 4L19 6',
  close: 'm6 6 12 12M18 6 6 18',
  previous: 'M5 5v14M18 5l-9 7 9 7V5',
  next: 'M19 5v14M6 5l9 7-9 7V5',
};

/** Icons drawn for LTR that must flip under dir="rtl". */
const directional: ReadonlySet<IconName> = new Set<IconName>(['chevron', 'arrow-start', 'arrow-end', 'panel']);

interface IconProps {
  name: IconName;
  size?: number;
  className?: string;
}

/** Decorative inline SVG; directional icons get `.icon-dir`, which mirrors them under dir="rtl". */
export function Icon({ name, size = 20, className }: IconProps) {
  const classes = ['icon', directional.has(name) ? 'icon-dir' : '', className ?? ''].filter(Boolean).join(' ');
  return (
    <svg className={classes} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={paths[name]} />
    </svg>
  );
}
