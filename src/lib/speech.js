// Read-aloud using the device's built-in voice (works offline on iOS, Android and desktop).
// In the Android app the browser speech API isn't reliable, so the phone's own text-to-speech engine is used instead.
// Phase 2 can swap `say` for recorded voice-overs without touching callers.
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { duckForSpeech } from './music';
import { IS_NATIVE } from './platform';
import { SOUND_SPELLING } from './soundSpelling';
import { planFor, playPlan, playSound, setVoiceTeacher, stopVoice } from './voiceBank';

let nativeVoices = [];

export function speechSupported() {
  return IS_NATIVE || typeof speechSynthesis !== 'undefined';
}

let enabled = true;
let gender = 'female';
let overrides = { female: null, male: null };
let chosen = null; // { voice, pitch }

// Names of common device voices, so we can offer a female and a male instructor.
const FEMALE = /(female|woman|samantha|karen|serena|moira|tessa|fiona|victoria|allison|\bava\b|susan|zira|hazel|aria|jenny|libby|sonia|natasha|emma|olivia|\bamy\b|joanna|kendra|salli|kimberly|\bivy\b|catherine|martha|nicky|stephanie|clara|abeni|ezinne|leah|maisie|michelle|\bsara\b|\bzoe\b|ashley|cora|elizabeth|jane|nancy|google us english|en-gb-x-gba|en-gb-x-gbc|en-gb-x-gbg|en-us-x-sfg|en-us-x-tpc|en-ng-x)/i;
const MALE = /(\bmale\b|daniel|\balex\b|\bfred\b|oliver|arthur|rishi|aaron|\btom\b|gordon|david|\bmark\b|george|\bguy\b|ryan|thomas|brian|matthew|joey|justin|\beric\b|christopher|roger|steffan|william|elliot|ethan|\bliam\b|noah|chukwuma|andrew|brandon|davis|jason|tony|google uk english male|en-gb-x-gbd|en-gb-x-rjs|en-us-x-iom|en-us-x-tpd|en-us-x-iol)/i;
// Novelty / very synthetic voices that sound like robots.
const ROBOTIC = /(espeak|robot|whisper|zarvox|bad news|bells|boing|bubbles|cellos|trinoids|albert|jester|organ|superstar|wobble|junior|ralph|kathy|princess|grandma|grandpa|rocko|shelley|\breed\b|sandy|\bflo\b|eddy|good news|hysterical|deranged|pipe)/i;

export function voiceGender(v) {
  if (FEMALE.test(v.name)) return 'female';
  if (MALE.test(v.name)) return 'male';
  return null;
}

/** Higher = more natural-sounding. Prefers neural/"Natural"/enhanced voices and African/British English. */
export function voiceScore(v) {
  let s = 0;
  if (!/^en/i.test(v.lang)) return -1000;
  if (ROBOTIC.test(v.name)) s -= 200;
  if (/natural|neural|premium|enhanced|siri/i.test(v.name)) s += 60;
  if (/online/i.test(v.name)) s += 40;
  if (/google/i.test(v.name)) s += 35;
  if (/network/i.test(v.name)) s += 25;
  if (/microsoft (david|zira|mark|hazel|george|susan)( desktop)?$/i.test(v.name.replace(/ - .*/, ''))) s -= 10;
  if (/en[-_](NG|GH|KE|ZA)/i.test(v.lang)) s += 14;
  else if (/en[-_]GB/i.test(v.lang)) s += 10;
  else if (/en[-_](US|AU|IE)/i.test(v.lang)) s += 6;
  // Online voices need internet; offline, prefer voices installed on the device.
  if (typeof navigator !== 'undefined' && !navigator.onLine && v.localService === false) s -= 150;
  return s;
}

export function listVoices() {
  if (!speechSupported()) return [];
  // Native voices are chosen by their position in the phone's list, so remember it.
  const raw = IS_NATIVE ? nativeVoices.map((v, index) => ({ ...v, index })) : speechSynthesis.getVoices();
  return raw
    .filter((v) => /^en/i.test(v.lang))
    .map((v) => ({ voice: v, name: v.name, lang: v.lang, uri: v.voiceURI, gender: voiceGender(v), score: voiceScore(v) }))
    .sort((a, b) => b.score - a.score);
}

/** Best voice for the chosen instructor. Unknown-gender voices get a gentle pitch change instead. */
function pickVoice() {
  const all = listVoices();
  if (!all.length) return null;
  const forced = overrides[gender] && all.find((v) => v.uri === overrides[gender]);
  if (forced) return { voice: forced.voice, pitch: 1 };
  const match = all.find((v) => v.gender === gender && v.score > -100);
  if (match) return { voice: match.voice, pitch: 1 };
  const best = all.find((v) => v.gender == null) || all[0];
  const otherGender = best.gender && best.gender !== gender;
  return { voice: best.voice, pitch: gender === 'male' ? (otherGender ? 0.75 : 0.88) : otherGender ? 1.25 : 1.08 };
}

if (IS_NATIVE) {
  TextToSpeech.getSupportedVoices()
    .then(({ voices }) => {
      nativeVoices = voices || [];
      chosen = pickVoice();
    })
    .catch(() => {});
} else if (typeof speechSynthesis !== 'undefined') {
  chosen = pickVoice();
  speechSynthesis.onvoiceschanged = () => {
    chosen = pickVoice();
  };
}

export const setSpeechEnabled = (on) => {
  enabled = on;
  if (!on) stopSpeaking();
};
/** 'female' | 'male' — the lesson instructor's voice. */
export function setInstructor(g) {
  setVoiceTeacher(g);
  if (g === gender && chosen) return;
  gender = g === 'male' ? 'male' : 'female';
  chosen = pickVoice();
}
export function setVoiceOverrides(o) {
  overrides = { female: o?.female || null, male: o?.male || null };
  chosen = pickVoice();
}
export const currentVoiceName = () => chosen?.voice?.name || 'Device voice';

/**
 * Speaks `text`: from the teacher's recordings when every part is recorded, otherwise with the device voice.
 * Resolves when finished.
 */
export function say(text, opts = {}) {
  if (!enabled || !text) return Promise.resolve();
  const plan = opts.lang ? null : planFor(String(text));
  if (plan) {
    if (opts.interrupt !== false) stopDevice();
    duckForSpeech(true);
    return playPlan(plan, { sayName: (w) => deviceSay(w, { ...opts, interrupt: false }) })
      .then((ok) => (ok ? null : deviceSay(text, opts)))
      .finally(() => duckForSpeech(false));
  }
  if (opts.interrupt !== false) stopVoice();
  return deviceSay(text, opts);
}

/** Speaks with the phone's or computer's own voice; resolves when finished (or after a safety timeout). */
function deviceSay(text, { rate = 0.95, pitch, interrupt = true, lang } = {}) {
  return new Promise((resolve) => {
    if (!enabled || !text || !speechSupported()) return resolve();
    if (IS_NATIVE) {
      if (!chosen) chosen = pickVoice();
      duckForSpeech(true);
      TextToSpeech.speak({ text: String(text), lang: lang || chosen?.voice?.lang || 'en-GB', rate, pitch: pitch ?? chosen?.pitch ?? 1, voice: chosen?.voice?.index, queueStrategy: interrupt ? 0 : 1 })
        .catch(() => {})
        .finally(() => {
          duckForSpeech(false);
          resolve();
        });
      return;
    }
    try {
      if (interrupt) speechSynthesis.cancel();
      if (!chosen) chosen = pickVoice();
      const u = new SpeechSynthesisUtterance(String(text));
      if (chosen?.voice) u.voice = chosen.voice;
      u.lang = lang || chosen?.voice?.lang || 'en-GB';
      u.rate = rate;
      u.pitch = pitch ?? chosen?.pitch ?? 1;
      const done = () => {
        clearTimeout(guard);
        duckForSpeech(false);
        resolve();
      };
      // Some browsers never fire `end`; don't let lessons wait forever.
      const guard = setTimeout(done, 1500 + String(text).length * 110);
      u.onstart = () => duckForSpeech(true);
      u.onend = done;
      u.onerror = done;
      speechSynthesis.speak(u);
    } catch {
      resolve();
    }
  });
}

function stopDevice() {
  if (IS_NATIVE) TextToSpeech.stop().catch(() => {});
  else if (speechSupported()) speechSynthesis.cancel();
}
export function stopSpeaking() {
  stopVoice();
  stopDevice();
}

export { SOUND_SPELLING } from './soundSpelling';
/** A phonics sound: the recorded sound if there is one, otherwise the device voice's best try. */
export const sayLetterSound = (s) => playSound(s).then((played) => (played ? null : deviceSay(SOUND_SPELLING[s] || s, { rate: 0.75 })));
