// The lesson catalogue: turns topic lists into numbered lessons and builds each lesson's steps on demand.
import { hash, rng, shuffle } from '../lib/format';
import { levelById } from './levels';
import { subjectsForLevel } from './subjects';
import { trackOf } from './tracks';
import { mathsSteps, mathsTopics } from './generators/maths';
import { phonicsTopics } from './generators/phonics';
import { englishSteps, englishTopics } from './generators/english';
import { scienceTopics } from './generators/science';
import { languageTopics } from './generators/language';
import { BASICS } from './generators/basics';
import { DEFAULT_LANGUAGES } from './languagePacks';
import { colourTopics, creativeRound, drawTopics, scribbleTopics, traceTopics, writingRound, writingTopics } from './generators/creative';

const MIN_LESSONS = 12;
/** Lessons per subject per class. The first ones teach each topic; later rounds practise, review and stretch. */
export const LESSONS_PER_SUBJECT = 1000;
export const UNIT_SIZE = 30;
export const UNITS_PER_SUBJECT = Math.ceil(LESSONS_PER_SUBJECT / UNIT_SIZE);
const CREATIVE = ['trace', 'colour', 'draw', 'scribble'];
const QUIZ_SUBJECTS = ['maths', 'english', 'science', 'phonics', 'writing'];

// Foundation topics (alphabet, vowels, word building, colours) woven into each subject's core lessons.
const B = BASICS;
const FOUNDATIONS = {
  maths: { 0: [B.findColour], 1: [B.colourSwatch, B.findColour], 2: [B.colourOf] },
  phonics: { 2: [B.alphabetNames, B.abcOrder, B.letterPictures, B.vowels], 3: [B.smallLetters, B.bigSmall, B.vowels, B.missingVowel, B.buildWords], 4: [B.missingVowel, B.vowelSort, B.wordFamilies, B.changeLetter, B.buildWords], 5: [B.wordFamilies, B.changeLetter, B.compound], 6: [B.compound, B.vowelSort] },
  english: { 3: [B.alphabetNames, B.colourOf, B.findColour, B.bigSmall], 4: [B.abcOrder, B.vowels, B.wordFamilies, B.buildWords], 5: [B.compound, B.changeLetter], 6: [B.compound] },
};
function weave(list, extras = []) {
  if (!extras.length) return list;
  const out = [];
  const step = Math.max(1, Math.floor(list.length / extras.length));
  let e = 0;
  list.forEach((tp, i) => {
    out.push(tp);
    if ((i + 1) % step === 0 && e < extras.length) out.push(extras[e++]);
  });
  return [...out, ...extras.slice(e)];
}

function topicsFor(subjectId, n, t, childName, extra = {}) {
  return weave(baseTopics(subjectId, n, t, childName, extra), FOUNDATIONS[subjectId]?.[n]);
}

function baseTopics(subjectId, n, t, childName, extra = {}) {
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
    case 'language': return languageTopics(n, (extra.settings?.languages || DEFAULT_LANGUAGES)[extra.lang || 'twi']);
    default: return [];
  }
}

const stepsPerLesson = (n) => (n <= 2 ? 5 : n <= 4 ? 6 : 8);

function stepsForTopic(subjectId, topic, r, n) {
  if (topic.build && (subjectId === 'maths' || subjectId === 'english')) return topic.build(r);
  if (subjectId === 'maths') return mathsSteps(topic, r, n, stepsPerLesson(n));
  if (subjectId === 'english') return englishSteps(topic, r);
  return topic.build(r);
}

/** Topic list plus "mixed practice" lessons so every quiz subject has at least MIN_LESSONS. */
function fullTopics(subjectId, n, t, childName, opts) {
  const base = topicsFor(subjectId, n, t, childName, opts);
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

/**
 * The full lesson sequence for a subject at a level:
 * 1. core lessons, one per topic, in teaching order;
 * 2. practice rounds that revisit every topic with new questions ("Round 2, 3…");
 * 3. review mixes and, from round 4, challenge lessons from the next class up.
 */
const seqCache = new Map();
function lessonSequence(subjectId, n, t, childName, opts) {
  const total = opts?.settings?.lessonsPerSubject ?? LESSONS_PER_SUBJECT;
  const key = `${subjectId}|${n}|${t.id}|${childName}|${opts?.lang}|${total}|${subjectId === 'language' ? JSON.stringify(opts?.settings?.languages?.[opts?.lang] || '') : ''}`;
  if (seqCache.has(key)) return seqCache.get(key);
  const core = fullTopics(subjectId, n, t, childName, opts);
  let out = core;
  if (core.length && core.length < total) {
    out = [...core];
    const isQuiz = QUIZ_SUBJECTS.includes(subjectId);
    const next = isQuiz && n < 10 ? fullTopics(subjectId, n + 1, t, childName, opts) : null;
    for (let i = core.length; i < total; i++) {
      const k = i - core.length;
      const round = Math.floor(k / core.length) + 2;
      const j = k % core.length;
      if (CREATIVE.includes(subjectId)) {
        out.push(creativeRound(subjectId, n, i, childName));
      } else if (subjectId === 'writing' && j % 2 === 1) {
        out.push(writingRound(n, t, i));
      } else if (j % 8 === 7) {
        out.push({
          title: `Round ${round} review${j > 8 ? ` ${Math.floor(j / 8) + 1}` : ''}`,
          emoji: ['🏆', '🎯', '🌟', '💎'][(round + j) % 4],
          build: (r) => {
            const picks = core.filter((_, x) => x <= j || x % 3 === round % 3);
            const steps = picks.flatMap((tp) => stepsForTopic(subjectId, tp, r, n).filter((st) => !['learn', 'sound', 'read', 'compose', 'word', 'blend'].includes(st.type)));
            return shuffle(r, steps).slice(0, stepsPerLesson(n) + 2);
          },
        });
      } else if (next?.length && round >= 4 && j % 8 === 3) {
        const tp = next[(round * 3 + j) % next.length];
        out.push({ ...tp, title: `Challenge: ${tp.title}`, emoji: '🚀', stretch: true, build: (r) => stepsForTopic(subjectId, tp, r, n + 1) });
      } else {
        const base = core[j];
        out.push({ ...base, title: `${base.title} · Round ${round}` });
      }
    }
  }
  out = out.slice(0, total);
  if (seqCache.size > 200) seqCache.clear();
  seqCache.set(key, out);
  return out;
}

/** Adds a worked example (a different question of the same kind) before each new kind of question. */
const isQuestion = (st) => ['choice', 'sort', 'spell'].includes(st.type);
// A sort example only shows its first item, so it must not give away an item the child will sort.
const qKey = (st) => JSON.stringify(st.type === 'sort' ? ['sort', st.items[0].label] : [st.prompt, st.word, st.options?.map((o) => o.label + (o.emoji || '')), st.answer]);
const kindOf = (st) => (st.type === 'choice' ? `c:${st.listen ? 'listen' : st.prompt.replace(/["“][^"”]*["”]/g, '"').replace(/[\d.,]+/g, '#').slice(0, 26)}` : st.type);
function withExamples(steps, alt) {
  const altQs = alt.filter(isQuestion);
  const used = new Set(steps.filter(isQuestion).flatMap((st) => (st.type === 'sort' ? st.items.map((it) => JSON.stringify(['sort', it.label])) : [qKey(st)])));
  const seen = new Set();
  const out = [];
  let count = 0;
  for (const st of steps) {
    if (isQuestion(st) && !seen.has(kindOf(st)) && count < 3) {
      seen.add(kindOf(st));
      const ex = altQs.find((a) => kindOf(a) === kindOf(st) && !used.has(qKey(a)) && (a.type !== 'sort' || a.items.some((it) => !used.has(JSON.stringify(['sort', it.label])))));
      if (ex) {
        // For sorting, lead with an item the child won't get in their own round.
        const shown = ex.type === 'sort' ? { ...ex, items: [...ex.items].sort((a, b) => used.has(JSON.stringify(['sort', a.label])) - used.has(JSON.stringify(['sort', b.label]))) } : ex;
        out.push({ type: 'example', example: shown });
        count++;
      }
    }
    out.push(st);
  }
  return out;
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
export function lessonsFor(levelId, subjectId, { track = 'ges', childName = '', lang = 'twi', settings } = {}) {
  const n = levelById(levelId).n;
  const t = trackOf(track);
  const overrides = settings?.lessonOverrides || {};
  const freeCount = settings?.freeLessons ?? 3;
  const built = lessonSequence(subjectId, n, t, childName, { lang, settings }).map((tp, idx) => ({ id: lessonId(levelId, subjectId, idx), levelId, subjectId, idx, title: tp.title, emoji: tp.emoji }));
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

/** Total lessons across all levels (for marketing / admin stats). */
export function countAllLessons(settings) {
  const per = settings?.lessonsPerSubject ?? LESSONS_PER_SUBJECT;
  let total = (settings?.customLessons || []).length;
  ['creche', 'n1', 'n2', 'kg1', 'kg2', 'p1', 'p2', 'p3', 'p4', 'p5', 'p6'].forEach((lv) => (total += subjectsForLevel(lv).length * per));
  return total;
}

/**
 * Builds the steps for a lesson. `attempt` changes the seed so "play again" gives fresh questions.
 * Returns { meta, steps } or null.
 */
export function buildLesson(id, { track = 'ges', childName = '', lang = 'twi', settings, attempt = 0 } = {}) {
  const r = rng(hash(`${id}|${track}|${lang}|${attempt}`));
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
  const topics = lessonSequence(subjectId, n, trackOf(track), childName, { lang, settings });
  const topic = topics[idx];
  if (!topic) return null;
  const stepN = topic.stretch ? Math.min(10, n + 1) : n;
  const lessonSteps = stepsForTopic(subjectId, topic, r, stepN);
  const alt = [0, 1, 2].flatMap((k) => stepsForTopic(subjectId, topic, rng(hash(`${id}|example${k}|${track}|${lang}|${attempt}`)), stepN));
  const steps = withExamples(lessonSteps, alt);
  const title = settings?.lessonOverrides?.[id]?.title || topic.title;
  return { meta: { id, levelId, subjectId, idx, title, emoji: topic.emoji }, steps };
}
