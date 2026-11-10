// Plays the recorded teacher voices ("voice bank").
// A sentence is spoken from recordings only if every part of it has a clip for the current teacher;
// otherwise the device voice says the whole sentence (the child's own name may be filled in by the device voice).
// Clips come from (first match wins):
//   1. the Recording Studio on this device (IndexedDB 'voice:<teacher>:<key>'),
//   2. the server, when a newer version was published than the one built into the app
//      (downloaded once, then kept in IndexedDB 'remote:<path>' for offline use),
//   3. the app itself (public/voice/<teacher>/<key>.mp3, listed with versions in manifest.json).
import bank from '../voice/bank.json';
import { buildIndex, matchText } from '../voice/matcher';
import { toWords } from '../voice/normalize';
import { audioCtx } from './audio';
import { getClip, listClipKeys, putClip } from '../data/audioStore';
import { fetchPublishedClips, publicClipUrl } from './server';

const index = buildIndex(bank.phrases.map(([key, words]) => ({ key, words })));
const available = { akos: new Set(), kwame: new Set() };
const studio = { akos: new Set(), kwame: new Set() };
export const localAvailable = { twi: new Set(), ga: new Set() };
// Versions of the clips built into the app, and clips published on the server: key → { path, version }.
const bundledVersion = { akos: new Map(), kwame: new Map(), twi: new Map(), ga: new Map() };
const remote = { akos: new Map(), kwame: new Map(), twi: new Map(), ga: new Map() };
const REMOTE_CACHE = 'brilla-voice-remote';
const buffers = new Map(); // `${teacher}:${key}` → AudioBuffer
let teacher = 'akos';
let childWords = new Set();
let playing = []; // scheduled sources
let playId = 0;

export const teacherFor = (gender) => (gender === 'male' ? 'kwame' : 'akos');
export function setVoiceTeacher(gender) {
  teacher = teacherFor(gender);
}
/** Lets the child's own name be spoken by the device voice inside recorded sentences. */
export function setChildName(name) {
  childWords = new Set(toWords(name || ''));
}

/** Loads the lists of recorded clips (bundled and from the Recording Studio). */
export async function loadVoiceBank() {
  try {
    const res = await fetch('./voice/manifest.json', { cache: 'no-cache' });
    if (res.ok) {
      const m = await res.json();
      // Older manifests list keys; newer ones map key → version.
      const read = (x, who) => {
        const entries = Array.isArray(x) ? x.map((k) => [k, 0]) : Object.entries(x || {});
        bundledVersion[who] = new Map(entries);
        return new Set(entries.map(([k]) => k));
      };
      available.akos = read(m.akos, 'akos');
      available.kwame = read(m.kwame, 'kwame');
      localAvailable.twi = read(m.local?.twi, 'twi');
      localAvailable.ga = read(m.local?.ga, 'ga');
    }
  } catch {
    /* no bundled voices yet */
  }
  applyRemote(readCachedRemote());
  await refreshStudioClips();
  refreshPublished();
  if (typeof window !== 'undefined') {
    window.addEventListener('online', refreshPublished);
    setInterval(refreshPublished, 30 * 60 * 1000);
  }
}

function readCachedRemote() {
  try {
    return JSON.parse(localStorage.getItem(REMOTE_CACHE) || '[]');
  } catch {
    return [];
  }
}
function applyRemote(rows) {
  for (const t of Object.keys(remote)) remote[t] = new Map();
  for (const r of rows) remote[r.teacher]?.set(r.key, { path: r.path, version: r.version });
}
/** Gets the list of recordings published from the Admin app (kept for offline use). */
export async function refreshPublished() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  try {
    const rows = await fetchPublishedClips();
    applyRemote(rows);
    try {
      localStorage.setItem(REMOTE_CACHE, JSON.stringify(rows));
    } catch {
      /* storage full */
    }
    buffers.clear();
  } catch {
    /* offline or server unreachable: keep the saved list */
  }
}
/** The server copy to use for a clip, if it's newer than the one built into the app. */
const remoteFor = (who, key) => {
  const r = remote[who]?.get(key);
  return r && r.version > (bundledVersion[who]?.get(key) ?? -1) ? r : null;
};
/** Downloads a published clip once, then serves it from this device. */
async function remoteBlob(path) {
  const cached = await getClip(`remote:${path}`).catch(() => null);
  if (cached) return cached;
  const res = await fetch(publicClipUrl(path));
  if (!res.ok) throw new Error('clip unavailable');
  const blob = await res.blob();
  putClip(`remote:${path}`, blob).catch(() => {});
  return blob;
}
export async function refreshStudioClips() {
  try {
    for (const t of ['akos', 'kwame']) studio[t] = new Set((await listClipKeys(`voice:${t}:`)).map((k) => k.split(':')[2]));
  } catch {
    /* IndexedDB unavailable */
  }
  buffers.clear();
}

const has = (key) => available[teacher].has(key) || studio[teacher].has(key) || remote[teacher].has(key);
const allFor = (who) => new Set([...available[who], ...studio[who], ...remote[who].keys()]);
export const voiceStats = () => ({ akos: allFor('akos').size, kwame: allFor('kwame').size, total: bank.phrases.length + Object.keys(bank.sounds).length });

async function loadBuffer(key, who = teacher) {
  const id = `${who}:${key}`;
  if (buffers.has(id)) return buffers.get(id);
  const ctx = audioCtx();
  let data = null;
  if (studio[who].has(key)) data = await (await getClip(`voice:${who}:${key}`))?.arrayBuffer();
  const r = !data && remoteFor(who, key);
  if (r) data = await (await remoteBlob(r.path)).arrayBuffer();
  if (!data) {
    const res = await fetch(`./voice/${who}/${key}.mp3`);
    if (!res.ok) throw new Error('missing clip');
    data = await res.arrayBuffer();
  }
  const buf = await ctx.decodeAudioData(data);
  if (buffers.size > 400) buffers.delete(buffers.keys().next().value);
  buffers.set(id, buf);
  return buf;
}

/** The recorded plan for `text`, or null if it can't be spoken entirely from recordings. */
export function planFor(text) {
  if (!available[teacher].size && !studio[teacher].size && !remote[teacher].size) return null;
  const m = matchText(text, index, { has, allow: (w) => childWords.has(w) });
  return m.complete ? m.parts : null;
}

export function stopVoice() {
  playId++;
  for (const s of playing) {
    try {
      s.stop();
    } catch {
      /* already stopped */
    }
  }
  playing = [];
}

/**
 * Plays a plan from planFor(). `sayName(word)` speaks words that have no clip (the child's name) with the device voice.
 * Resolves when finished (or stopped).
 */
export async function playPlan(parts, { sayName } = {}) {
  stopVoice();
  const id = playId;
  const ctx = audioCtx();
  if (!ctx) return false;
  // Load every clip first so the sentence plays without gaps.
  let bufs;
  try {
    bufs = await Promise.all(parts.map((p) => (p.key ? loadBuffer(p.key) : null)));
  } catch {
    return false;
  }
  if (id !== playId) return true;
  let i = 0;
  while (i < parts.length && id === playId) {
    // Play a run of clips back to back, then any device-voice word, then carry on.
    let t = ctx.currentTime + 0.03;
    const run = [];
    for (; i < parts.length && !parts[i].miss; i++) {
      if (parts[i].pause) {
        t += 0.18;
        continue;
      }
      const src = ctx.createBufferSource();
      src.buffer = bufs[i];
      src.connect(ctx.destination);
      src.start(t);
      run.push(src);
      t += bufs[i].duration - 0.05;
    }
    playing.push(...run);
    await new Promise((r) => setTimeout(r, Math.max(0, (t - ctx.currentTime) * 1000)));
    if (i < parts.length && parts[i].miss && id === playId) {
      await sayName?.(parts[i].miss);
      i++;
    }
  }
  return true;
}

/** Plays a phonics sound clip if recorded. Returns true if it played. */
export async function playSound(grapheme) {
  const key = bank.sounds[grapheme];
  if (!key || !has(key)) return false;
  return playPlan([{ key }]);
}

/** Native-speaker recording of a Twi/Ga word (published or built in) as a playable URL, or null. */
export async function localClipUrl(lang, wordId) {
  const r = remoteFor(lang, wordId);
  if (r) {
    try {
      return URL.createObjectURL(await remoteBlob(r.path));
    } catch {
      /* fall back to the built-in copy */
    }
  }
  return localAvailable[lang]?.has(wordId) ? `./voice/local/${lang}/${wordId}.mp3` : null;
}

/** Downloads every bundled clip for a teacher so it works offline (website only). */
export async function downloadVoices(gender, onProgress) {
  const who = teacherFor(gender);
  const keys = [...available[who]];
  // Published recordings newer than the app's own copies.
  for (const [key] of remote[who]) {
    const r = remoteFor(who, key);
    if (r) await remoteBlob(r.path).catch(() => null);
  }
  let done = 0;
  for (let k = 0; k < keys.length; k += 8) {
    await Promise.all(keys.slice(k, k + 8).map((key) => fetch(`./voice/${who}/${key}.mp3`).catch(() => null)));
    done = Math.min(keys.length, k + 8);
    onProgress?.(done, keys.length);
  }
  return keys.length;
}
