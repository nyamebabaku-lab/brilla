// Admin safety net: recycle bin (30 days), recording history (last 3 versions per line),
// recording quality checks, one-file backup/restore and storage use.
import { useDB } from '../data/store';
import { blobToDataURL, dataURLToBlob, deleteClip, getClip, listClipKeys, putClip } from '../data/audioStore';
import { refreshStudioClips } from './voiceBank';
import { expectedSeconds } from '../voice/segment';
import { uid } from './format';

const KEEP_DAYS = 30;
const HISTORY = 3;
const db = () => useDB.getState();

// ---------------------------------------------------------------- recording history
const histPrefix = (storeKey) => `hist:${storeKey}:`;

/** Saves a recording; the one it replaces is kept in history (last 3 versions). */
export async function saveClipWithHistory(storeKey, blob) {
  const old = await getClip(storeKey).catch(() => null);
  if (old) await putClip(`${histPrefix(storeKey)}${Date.now()}`, old);
  await putClip(storeKey, blob);
  const keys = (await listClipKeys(histPrefix(storeKey))).sort().reverse();
  for (const k of keys.slice(HISTORY)) await deleteClip(k);
  db().noteChange();
}

/** Earlier versions of a recording, newest first: [{ key, at }]. */
export async function clipHistory(storeKey) {
  return (await listClipKeys(histPrefix(storeKey)))
    .sort()
    .reverse()
    .map((key) => ({ key, at: Number(key.split(':').pop()) }));
}

/** Puts an earlier version back (the current one goes into history, so this can be undone too). */
export async function restoreVersion(storeKey, histKey) {
  const blob = await getClip(histKey);
  if (!blob) return;
  await deleteClip(histKey);
  await saveClipWithHistory(storeKey, blob);
  db().setClipMeta(storeKey, { ...(db().clipMeta[storeKey] || {}), flags: [], restoredAt: Date.now() });
  await refreshStudioClips();
}

// ---------------------------------------------------------------- recycle bin
/**
 * Moves something to the recycle bin. kind: 'clip' | 'word' | 'topic' | 'lesson' | 'theme'.
 * For clips pass { storeKey }; the audio is moved, not copied. Returns the bin item's id.
 */
export async function moveToTrash(kind, label, data) {
  const id = uid('bin');
  let blobKey;
  if (kind === 'clip') {
    const blob = await getClip(data.storeKey);
    if (blob) {
      blobKey = `trash:${id}`;
      await putClip(blobKey, blob);
      await deleteClip(data.storeKey);
    }
    db().setClipMeta(data.storeKey, null);
  }
  db().addTrash({ id, kind, label, at: Date.now(), data, blobKey });
  db().noteChange();
  if (kind === 'clip') await refreshStudioClips();
  return id;
}

function withLanguage(lang, fn) {
  const { settings, updateSettings } = db();
  const pack = settings.languages?.[lang];
  if (!pack) return false;
  updateSettings({ languages: { ...settings.languages, [lang]: fn(pack) } });
  return true;
}

/** Puts a recycle-bin item back where it was. */
export async function restoreFromTrash(id) {
  const item = db().trash.find((t) => t.id === id);
  if (!item) return false;
  const { kind, data } = item;
  if (kind === 'clip') {
    const blob = item.blobKey ? await getClip(item.blobKey) : null;
    if (blob) {
      await saveClipWithHistory(data.storeKey, blob);
      await deleteClip(item.blobKey);
    }
    if (data.lang && data.wordId) markLocalAudio(data.lang, data.wordId, true);
    await refreshStudioClips();
  } else if (kind === 'word') {
    withLanguage(data.lang, (pack) => {
      const has = pack.categories.some((c) => c.id === data.catId);
      const cats = has ? pack.categories : [...pack.categories, data.category];
      return {
        ...pack,
        categories: cats.map((c) => {
          if (c.id !== data.catId || c.words.some((w) => w.id === data.word.id)) return c;
          const words = [...c.words];
          words.splice(Math.min(data.index, words.length), 0, data.word);
          return { ...c, words };
        }),
      };
    });
  } else if (kind === 'topic') {
    withLanguage(data.lang, (pack) => {
      if (pack.categories.some((c) => c.id === data.category.id)) return pack;
      const cats = [...pack.categories];
      cats.splice(Math.min(data.index, cats.length), 0, data.category);
      return { ...pack, categories: cats };
    });
  } else if (kind === 'lesson') {
    const { settings, updateSettings } = db();
    if (!settings.customLessons.some((c) => c.id === data.lesson.id)) updateSettings({ customLessons: [...settings.customLessons, data.lesson] });
  } else if (kind === 'theme') {
    const { settings, updateSettings } = db();
    if (!settings.presets.some((p) => p.id === data.preset.id)) updateSettings({ presets: [...settings.presets, data.preset] });
  }
  db().removeTrash(id);
  return true;
}

/** Deletes a recycle-bin item for good. */
export async function deleteForever(id) {
  const item = db().trash.find((t) => t.id === id);
  if (item?.blobKey) await deleteClip(item.blobKey).catch(() => {});
  db().removeTrash(id);
}

/** Empties items older than 30 days (run when Admin opens). */
export async function purgeOldTrash() {
  const cutoff = Date.now() - KEEP_DAYS * 86400000;
  for (const t of db().trash.filter((x) => x.at < cutoff)) await deleteForever(t.id);
}
export const daysLeftInBin = (item) => Math.max(0, Math.ceil((item.at + KEEP_DAYS * 86400000 - Date.now()) / 86400000));

/** Turns a Twi/Ga word's audio on or off in the Twi & Ga subject. */
export function markLocalAudio(lang, wordId, on) {
  withLanguage(lang, (pack) => ({ ...pack, categories: pack.categories.map((c) => ({ ...c, words: c.words.map((w) => (w.id === wordId ? { ...w, audio: on } : w)) })) }));
}

// ---------------------------------------------------------------- quality checks
/**
 * Checks a raw recording before it is cleaned up. Returns a list of warnings:
 * 'clipped' (too loud, distorted), 'quiet', 'cut' (speech touches the start/end), 'short', 'long'.
 */
export function checkQuality(pcm, rate, seg, text) {
  const flags = [];
  let peak = 0;
  let sum = 0;
  let n = 0;
  const a = Math.floor(seg.start * rate);
  const b = Math.min(pcm.length, Math.ceil(seg.end * rate));
  let clippedRun = 0;
  let clipped = 0;
  for (let i = a; i < b; i++) {
    const v = Math.abs(pcm[i]);
    peak = Math.max(peak, v);
    sum += v * v;
    n++;
    clippedRun = v > 0.985 ? clippedRun + 1 : 0;
    if (clippedRun === 3) clipped++;
  }
  const rmsDb = 20 * Math.log10(Math.sqrt(sum / Math.max(1, n)) + 1e-9);
  if (clipped >= 3) flags.push('clipped');
  if (rmsDb < -36) flags.push('quiet');
  if (seg.cutCheck && (seg.start < 0.04 || pcm.length / rate - seg.end < 0.04)) flags.push('cut');
  const len = seg.end - seg.start;
  if (text) {
    const want = expectedSeconds(text);
    if (len < want * 0.3) flags.push('short');
    if (len > want * 2.6 + 0.8) flags.push('long');
  }
  return flags;
}
export const QUALITY_TEXT = {
  clipped: 'Too loud: the sound is distorted. Record a little further from the phone.',
  quiet: 'Too quiet: record a little closer or speak up.',
  cut: 'May be cut off: start speaking after tapping record and stop a moment after.',
  short: 'Much shorter than expected: check the whole line was read.',
  long: 'Much longer than expected: maybe two lines were joined, or extra talking.',
};

// ---------------------------------------------------------------- backup / restore
/** One file with every recording, word, lesson, price and team login on this device. */
export async function makeBackup() {
  const s = db();
  const keys = (await listClipKeys('')).filter((k) => !String(k).startsWith('trash:') && !String(k).startsWith('hist:'));
  const clips = {};
  for (const k of keys) {
    const blob = await getClip(k);
    if (blob) clips[k] = await blobToDataURL(blob);
  }
  const team = s.users.filter((u) => u.role === 'admin' || u.role === 'recorder');
  const backup = { brillaBackup: 1, at: new Date().toISOString(), settings: s.settings, team, clipMeta: s.clipMeta, clips };
  s.setAdmin({ lastBackupAt: Date.now(), changesSinceBackup: 0 });
  return { blob: new Blob([JSON.stringify(backup)], { type: 'application/json' }), count: keys.length };
}

/** Restores a backup file: recordings are added back, settings replaced, team logins merged. */
export async function restoreBackup(file) {
  const data = JSON.parse(await file.text());
  if (!data.brillaBackup) throw new Error('not a backup');
  let n = 0;
  for (const [k, url] of Object.entries(data.clips || {})) {
    await saveClipWithHistory(k, await dataURLToBlob(url));
    n++;
  }
  const s = db();
  if (data.settings) s.updateSettings(data.settings);
  const ids = new Set(s.users.map((u) => u.id));
  useDB.setState((st) => ({ users: [...st.users, ...(data.team || []).filter((u) => !ids.has(u.id))], clipMeta: { ...st.clipMeta, ...(data.clipMeta || {}) } }));
  s.setAdmin({ lastBackupAt: Date.now(), changesSinceBackup: 0 });
  await refreshStudioClips();
  return n;
}

/** Whether to nudge the admin to back up: lots of new work, or a few days since the last backup. */
export function backupDue() {
  const { changesSinceBackup = 0, lastBackupAt } = db().admin || {};
  if (!changesSinceBackup) return false;
  return changesSinceBackup >= 25 || !lastBackupAt || Date.now() - lastBackupAt > 3 * 86400000;
}

// ---------------------------------------------------------------- storage
export async function storageUse() {
  const est = (await navigator.storage?.estimate?.().catch(() => null)) || {};
  const keys = await listClipKeys('').catch(() => []);
  return {
    usedMB: (est.usage || 0) / 1048576,
    quotaMB: (est.quota || 0) / 1048576,
    recordings: keys.filter((k) => String(k).startsWith('voice:') || /^(twi|ga):/.test(k)).length,
    history: keys.filter((k) => String(k).startsWith('hist:')).length,
    bin: keys.filter((k) => String(k).startsWith('trash:')).length,
  };
}
