// Class levels from Creche to Primary 6. `band` groups levels that share content difficulty.
export const LEVELS = [
  { id: 'creche', name: 'Creche', intl: 'Toddlers', age: '2–3', n: 0, band: 'tiny', color: '#f472b6', emoji: '🍼' },
  { id: 'n1', name: 'Nursery 1', intl: 'Pre-K 1', age: '3–4', n: 1, band: 'tiny', color: '#fb923c', emoji: '🧸' },
  { id: 'n2', name: 'Nursery 2', intl: 'Pre-K 2', age: '4', n: 2, band: 'early', color: '#facc15', emoji: '🎈' },
  { id: 'kg1', name: 'KG 1', intl: 'Reception', age: '4–5', n: 3, band: 'early', color: '#a3e635', emoji: '🖍️' },
  { id: 'kg2', name: 'KG 2', intl: 'Kindergarten', age: '5–6', n: 4, band: 'early', color: '#34d399', emoji: '✏️' },
  { id: 'p1', name: 'Primary 1', intl: 'Grade 1', age: '6–7', n: 5, band: 'lower', color: '#22d3ee', emoji: '📗' },
  { id: 'p2', name: 'Primary 2', intl: 'Grade 2', age: '7–8', n: 6, band: 'lower', color: '#60a5fa', emoji: '📘' },
  { id: 'p3', name: 'Primary 3', intl: 'Grade 3', age: '8–9', n: 7, band: 'lower', color: '#818cf8', emoji: '📙' },
  { id: 'p4', name: 'Primary 4', intl: 'Grade 4', age: '9–10', n: 8, band: 'upper', color: '#a78bfa', emoji: '🔬' },
  { id: 'p5', name: 'Primary 5', intl: 'Grade 5', age: '10–11', n: 9, band: 'upper', color: '#c084fc', emoji: '🧪' },
  { id: 'p6', name: 'Primary 6', intl: 'Grade 6', age: '11–12', n: 10, band: 'upper', color: '#e879f9', emoji: '🎓' },
];

export const levelById = (id) => LEVELS.find((l) => l.id === id) || LEVELS[0];
export const levelName = (id, track = 'ges') => {
  const l = levelById(id);
  return track === 'intl' ? l.intl : l.name;
};
/** Best-guess class for a child's age (used when a parent adds a child). */
export function levelForAge(age) {
  const a = Number(age);
  if (a <= 2) return 'creche';
  if (a === 3) return 'n1';
  if (a === 4) return 'n2';
  if (a === 5) return 'kg2';
  return LEVELS[Math.min(10, a - 1)]?.id || 'p6';
}
