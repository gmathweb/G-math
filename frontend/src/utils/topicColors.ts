/** Colour helpers for the topic page (ported from docs/design/tree-mockup.html `hsl`/`shadeGrad`). */

export type Hsl = [hue: number, saturation: number, lightness: number];

const DEFAULT_HSL: Hsl = [239, 84, 67]; // #6366f1, the mockup's indigo

/** Same glyphs as the seed's SUBTOPIC_ICONS, used by position when a subtopic has no icon. */
export const FALLBACK_SUBTOPIC_ICONS = ['=', 'f(x)', '∑', '{}', '√', 'log', '∪', '[ ]', '≤', '|x|'];

export function fallbackSubtopicIcon(index: number): string {
  return FALLBACK_SUBTOPIC_ICONS[index % FALLBACK_SUBTOPIC_ICONS.length];
}

/** `#rgb` / `#rrggbb` → [h 0–359, s 0–100, l 0–100]; anything unparsable gives the mockup indigo. */
export function hexToHsl(hex: string): Hsl {
  let value = (hex || '').trim().replace(/^#/, '');
  if (/^[0-9a-f]{3}$/i.test(value)) value = value.replace(/./g, char => char + char);
  if (!/^[0-9a-f]{6}$/i.test(value)) return DEFAULT_HSL;
  const r = parseInt(value.slice(0, 2), 16) / 255;
  const g = parseInt(value.slice(2, 4), 16) / 255;
  const b = parseInt(value.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const delta = max - min;
  let hue = 0;
  if (delta) {
    if (max === r) hue = ((g - b) / delta + 6) % 6;
    else if (max === g) hue = (b - r) / delta + 2;
    else hue = (r - g) / delta + 4;
    hue *= 60;
  }
  const lightness = (max + min) / 2;
  const saturation = delta ? delta / (1 - Math.abs(2 * lightness - 1)) : 0;
  return [Math.round(hue), Math.round(saturation * 100), Math.round(lightness * 100)];
}

function hsl(hue: number, saturation: number, lightness: number): string {
  return `hsl(${hue}, ${Math.min(Math.max(saturation, 0), 100)}%, ${Math.min(Math.max(lightness, 0), 100)}%)`;
}

/** Lightness of the subtopic at `index`, spread from 45% to 75% across `total` subtopics. */
function shadeLightness(index: number, total: number): number {
  const step = total > 1 ? 30 / (total - 1) : 0;
  return Math.round(45 + index * step);
}

/** Card header gradient: each subtopic gets its own shade of the topic colour. */
export function shadeGradient(hex: string, index: number, total: number): string {
  const [hue, saturation] = hexToHsl(hex);
  const start = shadeLightness(index, total);
  return `linear-gradient(135deg, ${hsl(hue, saturation + 10, start)}, ${hsl(hue, saturation + 5, start + 12)})`;
}

/** The subtopic's shade as a flat colour (the card's meta dot). */
export function shadeColor(hex: string, index: number, total: number): string {
  const [hue, saturation] = hexToHsl(hex);
  return hsl(hue, saturation, shadeLightness(index, total));
}

type Rgb = [red: number, green: number, blue: number];

function hslToRgb([hue, saturation, lightness]: Hsl): Rgb {
  const s = saturation / 100;
  const l = lightness / 100;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1));
  return [f(0), f(8), f(4)];
}

/** WCAG relative luminance of an sRGB colour with channels in 0–1. */
function luminance(rgb: Rgb): number {
  const [r, g, b] = rgb.map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrastWithWhite(rgb: Rgb): number {
  return 1.05 / (luminance(rgb) + 0.05);
}

const DARK_TEXT = '#1a1a1a';

/** White or dark text, whichever contrasts more with the topic colour as a background. */
export function contrastText(hex: string): string {
  const background = luminance(hslToRgb(hexToHsl(hex)));
  const dark = luminance([26 / 255, 26 / 255, 26 / 255]);
  const withWhite = 1.05 / (background + 0.05);
  const withDark = (background + 0.05) / (dark + 0.05);
  return withWhite >= withDark ? '#fff' : DARK_TEXT;
}

/** A tone of the topic colour dark enough for white text on it (and it as text on white), ≥ 4.5:1. */
export function readableShade(hex: string): string {
  const [hue, saturation, start] = hexToHsl(hex);
  let lightness = Math.min(start, 45);
  while (lightness > 0 && contrastWithWhite(hslToRgb([hue, saturation, lightness])) < 4.5) lightness -= 1;
  return hsl(hue, saturation, lightness);
}

/** Banner background: the mockup's three-stop gradient re-tinted with the topic colour. */
export function bannerStops(hex: string): [string, string, string] {
  const [hue, saturation, lightness] = hexToHsl(hex);
  return [
    hsl(hue, saturation, Math.min(lightness + 12, 78)),
    hsl(hue, saturation, lightness),
    hsl(hue + 10, saturation, Math.max(lightness - 10, 28)),
  ];
}
