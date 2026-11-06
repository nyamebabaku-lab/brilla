// Splits one long recording ("take") into lines by the pauses between them.
// Shared by the in-app Recording Studio and scripts/voice-sync.mjs so both cut takes the same way.
//
// Reading rules printed in the script: ~1.5 s pause between lines; a pause of 4 s or more means
// "I made a mistake, use the next one instead of the previous line".

const FRAME = 0.02; // seconds per analysis frame

/** Loudness (dBFS) of each 20 ms frame. */
function frameLevels(pcm, rate) {
  const n = Math.max(1, Math.round(rate * FRAME));
  const out = new Float32Array(Math.ceil(pcm.length / n));
  for (let f = 0; f < out.length; f++) {
    let sum = 0;
    const end = Math.min(pcm.length, (f + 1) * n);
    for (let i = f * n; i < end; i++) sum += pcm[i] * pcm[i];
    out[f] = 10 * Math.log10(sum / Math.max(1, end - f * n) + 1e-12);
  }
  return out;
}

/**
 * Finds the spoken lines in a take.
 * Returns { segments: [{ start, end }] (seconds), redoGaps: [index of segments that follow a long "redo" pause], threshold }.
 */
export function findSegments(pcm, rate, { lineGap = 0.6, minSpeech = 0.15, redoGap = 3.2 } = {}) {
  const lv = frameLevels(pcm, rate);
  const sorted = Array.from(lv).sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.1)] ?? -80;
  const peak = sorted[Math.floor(sorted.length * 0.98)] ?? -20;
  // Speech is anything clearly above the room noise, but never quieter than -50 dBFS.
  const threshold = Math.max(-50, Math.min(floor + 14, peak - 18));
  const raw = [];
  let start = -1;
  for (let f = 0; f <= lv.length; f++) {
    const loud = f < lv.length && lv[f] > threshold;
    if (loud && start < 0) start = f;
    if (!loud && start >= 0) {
      raw.push([start * FRAME, f * FRAME]);
      start = -1;
    }
  }
  // Join bits of the same line (short pauses at commas or between words).
  const merged = [];
  for (const s of raw) {
    const last = merged[merged.length - 1];
    if (last && s[0] - last[1] < lineGap) last[1] = s[1];
    else merged.push([...s]);
  }
  const segments = merged.filter(([a, b]) => b - a >= minSpeech).map(([a, b]) => ({ start: a, end: b }));
  const redoGaps = [];
  segments.forEach((s, i) => i > 0 && s.start - segments[i - 1].end >= redoGap && redoGaps.push(i));
  return { segments, redoGaps, threshold };
}

/**
 * Lines up the found segments with the lines the reader was meant to read.
 * If there are too many segments, long "redo" pauses are used to drop the line before each one.
 * Returns { clips: [{ start, end }] (one per expected line, or fewer), status, note }.
 */
export function alignSegments({ segments, redoGaps }, expected) {
  let segs = segments;
  let note = '';
  if (segs.length > expected && redoGaps.length) {
    const drop = new Set(redoGaps.slice(0, segs.length - expected).map((i) => i - 1));
    segs = segs.filter((_, i) => !drop.has(i));
    note = `${drop.size} redo${drop.size > 1 ? 's' : ''} applied`;
  }
  const status = segs.length === expected ? 'ok' : segs.length > expected ? 'too-many' : 'too-few';
  return { clips: segs.slice(0, expected), status, note, found: segs.length };
}

/** Cuts a segment with a little breathing room, levelled to a steady loudness, with soft edges. */
export function cutClip(pcm, rate, { start, end }, { padBefore = 0.08, padAfter = 0.14, targetDb = -18 } = {}) {
  const a = Math.max(0, Math.floor((start - padBefore) * rate));
  const b = Math.min(pcm.length, Math.ceil((end + padAfter) * rate));
  const out = pcm.slice(a, b);
  let sum = 0;
  let peak = 0;
  for (const v of out) {
    sum += v * v;
    peak = Math.max(peak, Math.abs(v));
  }
  const rms = Math.sqrt(sum / Math.max(1, out.length));
  // Level to the target loudness without clipping.
  const gain = Math.min(10 ** (targetDb / 20) / Math.max(rms, 1e-6), 0.95 / Math.max(peak, 1e-6));
  const fade = Math.floor(rate * 0.012);
  for (let i = 0; i < out.length; i++) {
    const edge = Math.min(1, i / fade, (out.length - 1 - i) / fade);
    out[i] *= gain * edge;
  }
  return out;
}

/** Rough expected length of a line, to flag clips that look wrong (e.g. two lines stuck together). */
export const expectedSeconds = (text) => 0.35 + String(text).split(/\s+/).filter(Boolean).length * 0.38;
