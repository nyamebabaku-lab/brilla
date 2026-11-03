// Derived progress numbers for kids, parents and teachers.
import { todayKey } from './format';

export const totalStars = (prog = {}) => Object.values(prog).reduce((a, p) => a + (p.stars || 0), 0);
export const lessonsDone = (prog = {}) => Object.keys(prog).length;

/** Stars from mistakes: 0 mistakes → 3, a few → 2, many → 1. */
export function starsFor(questions, mistakes) {
  if (!questions) return 3;
  const ratio = mistakes / questions;
  return ratio === 0 ? 3 : ratio <= 0.34 ? 2 : 1;
}

/** Consecutive days (ending today or yesterday) with any learning. */
export function streak(usage = {}) {
  let n = 0;
  const d = new Date();
  if (!usage[todayKey(d)]) d.setDate(d.getDate() - 1);
  while (usage[todayKey(d)]) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export const minutesToday = (usage = {}) => Math.round((usage[todayKey()]?.secs || 0) / 60);

/** Last `days` days of usage, oldest first: [{ day, label, mins, lessons }]. */
export function weekUsage(usage = {}, days = 7) {
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(Date.now() - (days - 1 - i) * 86400000);
    const u = usage[todayKey(d)] || { secs: 0, lessons: 0 };
    return { day: todayKey(d), label: d.toLocaleDateString('en-GB', { weekday: 'short' }), mins: Math.round(u.secs / 60), lessons: u.lessons };
  });
}

/** Per-subject completion for a child's level: [{ subject, done, total, stars }]. */
export function subjectProgress(catalog, prog = {}) {
  return catalog.map(({ subject, lessons }) => {
    const done = lessons.filter((l) => prog[l.id]);
    return { subject, done: done.length, total: lessons.length, stars: done.reduce((a, l) => a + prog[l.id].stars, 0) };
  });
}
