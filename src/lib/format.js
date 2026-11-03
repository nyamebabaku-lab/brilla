export const nowISO = () => new Date().toISOString();
export const todayKey = (d = new Date()) => d.toISOString().slice(0, 10);
export const uid = (p = 'id') => `${p}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;
export const money = (n, cur = 'GH₵') => `${cur} ${Number(n || 0).toLocaleString('en-GH', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—');
export const fmtDateTime = (iso) => (iso ? new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—');
export const daysBetween = (a, b) => Math.ceil((new Date(b) - new Date(a)) / 86400000);
export const addDays = (iso, n) => new Date(new Date(iso).getTime() + n * 86400000).toISOString();
export const plural = (n, w, pl = `${w}s`) => `${n} ${n === 1 ? w : pl}`;
export const cls = (...a) => a.filter(Boolean).join(' ');

/** Small deterministic RNG so a lesson looks the same each time unless we ask for a fresh practice round. */
export function rng(seed) {
  let s = typeof seed === 'number' ? seed : hash(String(seed));
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
export function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}
export const pick = (r, arr) => arr[Math.floor(r() * arr.length)];
export const int = (r, lo, hi) => lo + Math.floor(r() * (hi - lo + 1));
export function shuffle(r, arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
export const sample = (r, arr, n) => shuffle(r, arr).slice(0, n);
