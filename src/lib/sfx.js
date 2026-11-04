// Tiny synthesised sound effects (Web Audio) so the app needs no audio files and works offline.
import { audioCtx as ac } from './audio';

let enabled = true;

export const setSfxEnabled = (on) => {
  enabled = on;
};

function tone(freq, start, dur, { type = 'sine', vol = 0.15 } = {}) {
  const a = ac();
  if (!a) return;
  const t = a.currentTime + start;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(vol, t + 0.01);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

const SOUNDS = {
  tap: () => tone(660, 0, 0.08, { type: 'triangle', vol: 0.08 }),
  pop: () => tone(880, 0, 0.1, { type: 'sine', vol: 0.12 }),
  correct: () => [523, 659, 784].forEach((f, i) => tone(f, i * 0.08, 0.22, { type: 'triangle' })),
  wrong: () => {
    tone(260, 0, 0.18, { type: 'sawtooth', vol: 0.06 });
    tone(200, 0.12, 0.25, { type: 'sawtooth', vol: 0.06 });
  },
  star: () => [784, 988, 1175, 1568].forEach((f, i) => tone(f, i * 0.07, 0.25, { type: 'sine', vol: 0.1 })),
  fanfare: () => [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, i * 0.12, 0.3, { type: 'triangle', vol: 0.13 })),
  fill: () => tone(520 + Math.random() * 300, 0, 0.12, { type: 'sine', vol: 0.1 }),
};

export function sfx(name) {
  if (!enabled) return;
  try {
    SOUNDS[name]?.();
  } catch {
    /* ignore */
  }
}
