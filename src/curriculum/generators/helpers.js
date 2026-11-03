import { int, pick, shuffle } from '../../lib/format';

/** Builds 3–4 numeric options around `answer` and returns { options, answer: index }. */
export function numOptions(r, answer, { count = 4, spread = 3, min = 0, fmt = (n) => String(n) } = {}) {
  const set = new Set([answer]);
  let guard = 0;
  while (set.size < count && guard++ < 60) {
    const d = int(r, -spread, spread) || 1;
    const v = typeof answer === 'number' && !Number.isInteger(answer) ? Math.round((answer + d * 0.1 * spread) * 100) / 100 : answer + d;
    if (v >= min) set.add(v);
  }
  const opts = shuffle(r, [...set]);
  return { options: opts.map((v) => ({ label: fmt(v) })), answer: opts.indexOf(answer) };
}

/** Options from a list of labels where `correct` is one of them. */
export function textOptions(r, correct, wrong, count = 4) {
  const pool = shuffle(r, [...new Set(wrong)].filter((w) => w !== correct)).slice(0, count - 1);
  const opts = shuffle(r, [correct, ...pool]);
  return { options: opts.map((o) => (typeof o === 'string' ? { label: o } : o)), answer: opts.indexOf(correct) };
}

/** Options that are objects ({label, emoji}); `key` decides equality. */
export function objOptions(r, correct, wrong, count = 4) {
  const uniq = [...new Map(wrong.map((w) => [w.label, w])).values()];
  const pool = shuffle(r, uniq.filter((w) => w.label !== correct.label && w.emoji !== correct.emoji)).slice(0, count - 1);
  const opts = shuffle(r, [correct, ...pool]);
  return { options: opts, answer: opts.findIndex((o) => o.label === correct.label) };
}

export const choice = (prompt, opts, extra = {}) => ({ type: 'choice', prompt, say: extra.say ?? prompt, ...opts, ...extra });
export const learn = (title, big, text, extra = {}) => ({ type: 'learn', title, big, text, say: extra.say ?? `${title}. ${text || ''}`, ...extra });

/** Repeats a question factory `n` times, avoiding duplicate prompts where possible. */
export function repeat(n, make) {
  const out = [];
  const seen = new Set();
  let guard = 0;
  while (out.length < n && guard++ < n * 6) {
    const s = make(out.length);
    const key = JSON.stringify(s);
    if (seen.has(key) && guard < n * 5) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

export const EMOJI_OBJECTS = ['🍎', '⭐', '🐥', '🎈', '🌸', '🐟', '🚗', '🍌', '⚽', '🦋', '🍓', '🐞', '🧁', '🐸', '🌻', '🍊'];
export const pickEmoji = (r) => pick(r, EMOJI_OBJECTS);
export const NUM_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen', 'twenty'];
