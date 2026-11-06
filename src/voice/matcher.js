// Finds recorded clips for a sentence: longest catalogue phrase first, chunk by chunk.
import { toChunks } from './normalize';

/** Builds a lookup from catalogue entries ({ key, words }) for fast longest-match. */
export function buildIndex(entries) {
  const byFirst = new Map();
  for (const e of entries) {
    if (!e.words) continue;
    const w = e.words.split(' ');
    const list = byFirst.get(w[0]) || [];
    list.push({ key: e.key, w });
    byFirst.set(w[0], list);
  }
  for (const list of byFirst.values()) list.sort((a, b) => b.w.length - a.w.length);
  return byFirst;
}

/**
 * Splits `text` into clip keys. Returns { parts: [{ key } | { miss: 'word …' }], complete }.
 * `has(key)` limits matching to clips that are actually recorded; `allow(word)` lets a word (e.g. the child's own
 * name) be spoken by the device voice in the middle of a recorded sentence.
 */
export function matchText(text, index, { has = () => true, allow = () => false } = {}) {
  const parts = [];
  let complete = true;
  for (const chunk of toChunks(text)) {
    const w = chunk.words;
    // Fewest clips that cover the whole chunk (so a long phrase never blocks a full match).
    const best = Array(w.length + 1).fill(null);
    best[w.length] = { n: 0, miss: 0, take: null };
    for (let i = w.length - 1; i >= 0; i--) {
      let choice = null;
      for (const c of index.get(w[i]) || []) {
        if (!has(c.key) || !c.w.every((x, k) => w[i + k] === x)) continue;
        const rest = best[i + c.w.length];
        const cand = { n: rest.n + 1, miss: rest.miss, take: { key: c.key, len: c.w.length } };
        if (!choice || cand.miss < choice.miss || (cand.miss === choice.miss && cand.n < choice.n)) choice = cand;
      }
      // Skipping a word costs a "miss" unless it's allowed (e.g. the child's name, spoken by the device voice).
      const rest = best[i + 1];
      const skip = { n: rest.n + 1, miss: rest.miss + (allow(w[i]) ? 0 : 1), take: { miss: w[i], len: 1 } };
      if (!choice || skip.miss < choice.miss || (skip.miss === choice.miss && skip.n < choice.n)) choice = skip;
      best[i] = choice;
    }
    if (best[0].miss) complete = false;
    for (let i = 0; i < w.length; ) {
      const { take } = best[i];
      parts.push(take.key ? { key: take.key } : { miss: take.miss });
      i += take.len;
    }
    parts.push({ pause: true });
  }
  return { parts, complete };
}
