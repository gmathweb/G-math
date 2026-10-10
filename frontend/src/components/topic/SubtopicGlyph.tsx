import type { ReactNode } from 'react';

// Line drawings from the mockup's `subVis`, keyed by the overlay glyph they accompany.
const GLYPH_DRAWINGS: Record<string, { strokeWidth: number; shapes: ReactNode }> = {
  '=': {
    strokeWidth: 2.5,
    shapes: <><line x1="14" y1="24" x2="50" y2="24" /><line x1="14" y1="40" x2="50" y2="40" /></>,
  },
  'f(x)': { strokeWidth: 2.5, shapes: <path d="M10 52 C20 52 24 12 32 12 S44 52 54 52" /> },
  '∑': { strokeWidth: 2.5, shapes: <polyline points="18,16 46,16 28,32 46,48 18,48" /> },
  '{}': {
    strokeWidth: 2,
    shapes: (
      <>
        <path d="M20 12c-6 0-8 4-8 10s4 8 4 10-4 4-4 10 2 10 8 10" />
        <path d="M44 12c6 0 8 4 8 10s-4 8-4 10 4 4 4 10-2 10-8 10" />
      </>
    ),
  },
  '√': { strokeWidth: 2.5, shapes: <polyline points="10,36 20,36 28,52 44,12 54,12" /> },
  log: { strokeWidth: 2.5, shapes: <path d="M12 52 C18 52 22 14 32 14 Q42 14 52 24" /> },
  '∪': {
    strokeWidth: 2.5,
    shapes: <><path d="M10 12 Q32 60 54 12" /><line x1="32" y1="10" x2="32" y2="50" strokeDasharray="4" /></>,
  },
  '[ ]': {
    strokeWidth: 2,
    shapes: (
      <>
        <rect x="14" y="14" width="36" height="36" rx="4" />
        <line x1="14" y1="32" x2="50" y2="32" />
        <line x1="32" y1="14" x2="32" y2="50" />
      </>
    ),
  },
  '≤': {
    strokeWidth: 2.5,
    shapes: (
      <>
        <line x1="16" y1="20" x2="48" y2="32" />
        <line x1="16" y1="44" x2="48" y2="32" />
        <line x1="16" y1="50" x2="48" y2="50" />
      </>
    ),
  },
  '|x|': { strokeWidth: 2.5, shapes: <polyline points="12,12 32,48 52,12" /> },
};

/**
 * Decorative subtopic artwork for the card header: the mockup line drawing plus the glyph
 * for the known icons, otherwise just the icon (any text or emoji) shown large.
 */
export function SubtopicGlyph({ icon }: { icon: string }) {
  const drawing = GLYPH_DRAWINGS[icon];
  return (
    <>
      {drawing && (
        <svg viewBox="0 0 64 64" fill="none" stroke="#fff" strokeWidth={drawing.strokeWidth} focusable="false">
          {drawing.shapes}
        </svg>
      )}
      <span className={drawing ? 'tp-overlay' : 'tp-overlay tp-overlay-solo'} dir="ltr">{icon}</span>
    </>
  );
}
