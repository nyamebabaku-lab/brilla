// The lesson catalogue: turns topic lists into numbered lessons and builds each lesson's steps on demand.
import { hash, rng, shuffle } from '../lib/format';
import { levelById } from './levels';
import { subjectsForLevel } from './subjects';
import { trackOf } from './tracks';
import { mathsSteps, mathsTopics } from './generators/maths';
import { phonicsTopics } from './generators/phonics';
import { englishSteps, englishTopics } from './generators/english';
import { scienceTopics } from './generators/science';
import { colourTopics, drawTopics, scribbleTopics, traceTopics, writingTopics } from './generators/creative';

const MIN_LESSONS = 12;
const QUIZ_SUBJECTS = ['maths', 'english', 'science', 'phonics', 'writing'];

function topicsFor(subjectId, n, t, childName) {
  switch (subjectId) {
    case 'maths': return mathsTopics(n, t) || [];
    case 'phonics': return phonicsTopics(n);
    case 'english': return englishTopics(n, t);
    case 'science': return scienceTopics(n);
    case 'trace': return traceTopics(n, childName);
    case 'colour': return colourTopics(n);
    case 'draw': return drawTopics(n);
    case 'scribble': return scribbleTopics();
    case 'writing': return writingTopics(n, t);
    default: return [];
  }
}

const stepsPerLesson = (n) => (n <= 2 ? 5 : n <= 4 ? 6 : 8);

function stepsForTopic(subjectId, topic, r, n) {
  if (subjectId === 'maths') return mathsSteps(topic, r, n, stepsPerLesson(n));
  if (subjectId === 'english') return englishSteps(topic, r);
  return topic.build(r);
}

/** Topic list plus "mixed practice" lessons so every quiz subject has at least MIN_LESSONS. */
function fullTopics(subjectId, n, t, childName) {
  const base = topicsFor(subjectId, n, t, childName);
  if (!QUIZ_SUBJECTS.includes(subjectId) || base.length >= MIN_LESSONS || !base.length) return base;
  const extra = [];
  for (let i = 0; base.length + extra.length < MIN_LESSONS; i++) {
    extra.push({
      title: `Mixed practice ${i + 1}`,
      emoji: ['🏆', '🎯', '🚀', '🌟', '💎'][i % 5],
      mix: true,
      build: (r) => {
        const steps = base.flatMap((tp) => stepsForTopic(subjectId, tp, r, n).filter((s) => !['learn', 'sound', 'read', 'compose'].includes(s.type)));
        return shuffle(r, steps).slice(0, stepsPerLesson(n) + 2);
      },
    });
  }
  return [...base, ...extra];
}

const lessonId = (levelId, subjectId, idx) => `${levelId}.${subjectId}.${idx}`;
export const parseLessonId = (id) => {
  const [levelId, subjectId, idx] = id.split('.');
  return { levelId, subjectId, idx: Number(idx) };
};

/**
 * Lessons for one subject at one level, with admin overrides and custom lessons applied.
 * Each entry: { id, levelId, subjectId, idx, order, title, emoji, free, custom? }
 */
export function lessonsFor(levelId, subjectId, { track = 'ges', childName = '', settings } = {}) {
  const n = levelById(levelId).n;
  const t = trackOf(track);
  const overrides = settings?.lessonOverrides || {};
  const freeCount = settings?.freeLessons ?? 3;
  const built = fullTopics(subjectId, n, t, childName).map((tp, idx) => ({ id: lessonId(levelId, subjectId, idx), levelId, subjectId, idx, title: tp.title, emoji: tp.emoji }));
  const custom = (settings?.customLessons || [])
    .filter((c) => c.levelId === levelId && c.subjectId === subjectId)
    .map((c) => ({ id: c.id, levelId, subjectId, idx: -1, title: c.title, emoji: c.emoji || '⭐', custom: true }));
  const all = [...built, ...custom]
    .map((l) => ({ ...l, ...(overrides[l.id]?.title ? { title: overrides[l.id].title } : {}), hidden: !!overrides[l.id]?.hidden }))
    .filter((l) => !l.hidden);
  return all.map((l, order) => ({ ...l, order, free: order < freeCount || !!overrides[l.id]?.free }));
}

/** Every lesson at a level, grouped by subject. */
export function catalogFor(levelId, opts) {
  return subjectsForLevel(levelId).map((s) => ({ subject: s, lessons: lessonsFor(levelId, s.id, opts) }));
}

/** Total built-in lessons across all levels (for marketing / admin stats). */
export function countAllLessons(settings) {
  let total = 0;
  ['creche', 'n1', 'n2', 'kg1', 'kg2', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'].forEach((lv) => catalogFor(lv, { settings }).forEach((g) => (total += g.lessons.length)));
  return total;
}

/**
 * Builds the steps for a lesson. `attempt` changes the seed so "play again" gives fresh questions.
 * Returns { meta, steps } or null.
 */
export function buildLesson(id, { track = 'ges', childName = '', settings, attempt = 0 } = {}) {
  const r = rng(hash(`${id}|${track}|${attempt}`));
  if (id.startsWith('custom_')) {
    const c = (settings?.customLessons || []).find((x) => x.id === id);
    if (!c) return null;
    const steps = c.questions.map((q) => {
      const order = shuffle(r, q.options.map((label, i) => ({ label, i })));
      return { type: 'choice', prompt: q.prompt, say: q.prompt, options: order.map((o) => ({ label: o.label })), answer: order.findIndex((o) => o.i === q.answer), ...(q.emoji ? { visual: { kind: 'emoji', items: [q.emoji], big: true } } : {}) };
    });
    return { meta: { id, levelId: c.levelId, subjectId: c.subjectId, title: c.title, emoji: c.emoji }, steps: c.intro ? [{ type: 'learn', title: c.title, big: c.emoji || '⭐', text: c.intro, say: c.intro }, ...steps] : steps };
  }
  const { levelId, subjectId, idx } = parseLessonId(id);
  const n = levelById(levelId).n;
  const topics = fullTopics(subjectId, n, trackOf(track), childName);
  const topic = topics[idx];
  if (!topic) return null;
  const steps = stepsForTopic(subjectId, topic, r, n);
  const title = settings?.lessonOverrides?.[id]?.title || topic.title;
  return { meta: { id, levelId, subjectId, idx, title, emoji: topic.emoji }, steps };
}
