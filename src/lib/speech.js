// Read-aloud using the device's built-in voice (works offline on iOS, Android and desktop).
// Phase 2 can swap `say` for recorded voice-overs without touching callers.

let enabled = true;
let voice = null;

function pickVoice() {
  if (typeof speechSynthesis === 'undefined') return null;
  const voices = speechSynthesis.getVoices();
  const prefs = [/en[-_]GB/i, /en[-_]NG|en[-_]GH|en[-_]ZA/i, /en[-_]US/i, /^en/i];
  for (const re of prefs) {
    const v = voices.find((x) => re.test(x.lang) && /female|samantha|karen|serena|google/i.test(x.name)) || voices.find((x) => re.test(x.lang));
    if (v) return v;
  }
  return voices[0] || null;
}

if (typeof speechSynthesis !== 'undefined') {
  voice = pickVoice();
  speechSynthesis.onvoiceschanged = () => {
    voice = pickVoice();
  };
}

export const speechSupported = () => typeof speechSynthesis !== 'undefined';
export const setSpeechEnabled = (on) => {
  enabled = on;
  if (!on) stopSpeaking();
};

export function say(text, { rate = 0.9, pitch = 1.15, interrupt = true } = {}) {
  if (!enabled || !text || !speechSupported()) return;
  try {
    if (interrupt) speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(String(text));
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'en-GB';
    u.rate = rate;
    u.pitch = pitch;
    speechSynthesis.speak(u);
  } catch {
    /* speech is a nice-to-have */
  }
}

export function stopSpeaking() {
  if (speechSupported()) speechSynthesis.cancel();
}

// Text-to-speech says letter *names*; these spellings make it say letter *sounds* instead.
export const SOUND_SPELLING = {
  a: 'ah', b: 'buh', c: 'kuh', d: 'duh', e: 'eh', f: 'fff', g: 'guh', h: 'hhh', i: 'ih', j: 'juh', k: 'kuh', l: 'lll', m: 'mmm',
  n: 'nnn', o: 'oh', p: 'puh', q: 'kwuh', r: 'rrr', s: 'sss', t: 'tuh', u: 'uh', v: 'vvv', w: 'wuh', x: 'ks', y: 'yuh', z: 'zzz',
  ai: 'ay', ee: 'eee', ie: 'eye', oa: 'oh', ue: 'you', or: 'or', ng: 'ng', oo: 'oo', ch: 'ch', sh: 'shh', th: 'th', qu: 'kwuh',
  ou: 'ow', oi: 'oy', er: 'er', ar: 'ar', ck: 'kuh', ll: 'lll', ss: 'sss', ff: 'fff', wh: 'wuh', ph: 'fff',
};
export const sayLetterSound = (s) => say(SOUND_SPELLING[s] || s, { rate: 0.7 });
