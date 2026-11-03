// Runtime theming: brand/accent palettes live in CSS variables, backgrounds are named gradients.
// Each child profile (and the app default set by Admin) stores a theme { preset, brand, accent, bg }.

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];

export const BACKGROUNDS = {
  rainbow: 'linear-gradient(160deg,#fff1f2 0%,#fef9c3 30%,#dcfce7 55%,#e0f2fe 78%,#f3e8ff 100%)',
  ocean: 'linear-gradient(170deg,#ecfeff 0%,#cffafe 40%,#bfdbfe 100%)',
  jungle: 'linear-gradient(170deg,#f7fee7 0%,#dcfce7 45%,#bbf7d0 100%)',
  candy: 'linear-gradient(160deg,#fdf2f8 0%,#fce7f3 40%,#ede9fe 100%)',
  sunset: 'linear-gradient(170deg,#fff7ed 0%,#ffedd5 40%,#fecdd3 100%)',
  space: 'linear-gradient(170deg,#1e1b4b 0%,#312e81 55%,#4c1d95 100%)',
  sky: 'linear-gradient(180deg,#e0f2fe 0%,#f0f9ff 100%)',
  plain: 'linear-gradient(180deg,#fafaf9 0%,#f5f5f4 100%)',
};
export const BG_NAMES = { rainbow: 'Rainbow', ocean: 'Ocean', jungle: 'Jungle', candy: 'Candy', sunset: 'Sunset', space: 'Space', sky: 'Sky', plain: 'Plain' };
export const DARK_BGS = ['space'];

export const DEFAULT_PRESETS = [
  { id: 'rainbow', name: 'Rainbow', emoji: '🌈', brand: '#7c3aed', accent: '#f97316', bg: 'rainbow' },
  { id: 'ocean', name: 'Ocean', emoji: '🐳', brand: '#0284c7', accent: '#14b8a6', bg: 'ocean' },
  { id: 'jungle', name: 'Jungle', emoji: '🦁', brand: '#16a34a', accent: '#eab308', bg: 'jungle' },
  { id: 'candy', name: 'Candy', emoji: '🍭', brand: '#db2777', accent: '#8b5cf6', bg: 'candy' },
  { id: 'sunset', name: 'Sunset', emoji: '🌅', brand: '#ea580c', accent: '#e11d48', bg: 'sunset' },
  { id: 'space', name: 'Space', emoji: '🚀', brand: '#6366f1', accent: '#facc15', bg: 'space' },
];

export const DEFAULT_THEME = { preset: 'rainbow', brand: '#7c3aed', accent: '#f97316', bg: 'rainbow' };

export const SWATCHES = ['#7c3aed', '#6366f1', '#2563eb', '#0284c7', '#0d9488', '#16a34a', '#65a30d', '#ca8a04', '#ea580c', '#dc2626', '#e11d48', '#db2777', '#c026d3', '#475569'];

const hexToRgb = (hex) => {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const rgbToHex = ([r, g, b]) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`;
const mix = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);

const TINT = { 50: 0.93, 100: 0.85, 200: 0.72, 300: 0.55, 400: 0.33, 500: 0.14 };
const SHADE = { 700: 0.15, 800: 0.3, 900: 0.42, 950: 0.62 };

/** Builds a full 50–950 palette treating `base` as the 600 step. */
export function paletteFrom(base) {
  const rgb = hexToRgb(base);
  return Object.fromEntries(
    STEPS.map((s) => {
      if (s === 600) return [s, rgbToHex(rgb)];
      if (TINT[s] != null) return [s, rgbToHex(mix(rgb, [255, 255, 255], TINT[s]))];
      return [s, rgbToHex(mix(rgb, [0, 0, 0], SHADE[s]))];
    }),
  );
}

/** Writes palette CSS variables and the page background onto <html>. */
export function applyTheme(theme = DEFAULT_THEME) {
  const t = { ...DEFAULT_THEME, ...theme };
  const root = document.documentElement;
  const brand = paletteFrom(t.brand);
  const accent = paletteFrom(t.accent);
  STEPS.forEach((s) => {
    root.style.setProperty(`--brand-${s}`, hexToRgb(brand[s]).join(' '));
    root.style.setProperty(`--accent-${s}`, hexToRgb(accent[s]).join(' '));
  });
  root.style.setProperty('--page-bg', BACKGROUNDS[t.bg] || BACKGROUNDS.rainbow);
  root.dataset.bg = t.bg;
  root.classList.toggle('bg-dark', DARK_BGS.includes(t.bg));
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', brand[600]);
}

export const themeFromPreset = (p) => ({ preset: p.id, brand: p.brand, accent: p.accent, bg: p.bg });
