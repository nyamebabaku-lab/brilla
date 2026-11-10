// Brilla Admin app: publishes recordings to the server so every family app gets them automatically.
//
// Saving a recording queues it here. The queue uploads when the phone is online (it survives the app closing),
// so recording works offline too. Recordings with a quality warning are held until re-recorded or
// "Publish anyway". Deleting unpublishes (the file stays on the server so a restore can bring it back).
import { createClient } from '@supabase/supabase-js';
import { useDB } from '../data/store';
import { getClip } from '../data/audioStore';
import { SERVER_KEY, SERVER_URL, VOICE_BUCKET } from './server';
import { IS_ADMIN_APP } from './platform';

export const supabase = createClient(SERVER_URL, SERVER_KEY, { auth: { persistSession: true, autoRefreshToken: true, storageKey: 'brilla-admin-auth' } });
export const publishingOn = () => IS_ADMIN_APP;

const db = () => useDB.getState();

/** 'voice:akos:A-0001' → { teacher: 'akos', key: 'A-0001' }; 'twi:greet0' → { teacher: 'twi', key: 'greet0' }. */
export function parseStoreKey(storeKey) {
  const p = String(storeKey).split(':');
  if (p[0] === 'voice' && (p[1] === 'akos' || p[1] === 'kwame') && p[2]) return { teacher: p[1], key: p[2] };
  if ((p[0] === 'twi' || p[0] === 'ga') && p[1]) return { teacher: p[0], key: p[1] };
  return null;
}

function setStatus(storeKey, pub, extra = {}) {
  db().setClipMeta(storeKey, { ...(db().clipMeta[storeKey] || {}), pub, ...extra });
}
function enqueue(item) {
  useDB.setState((s) => ({ publishQueue: [...(s.publishQueue || []).filter((q) => q.storeKey !== item.storeKey), { ...item, at: Date.now() }] }));
  setStatus(item.storeKey, item.op === 'publish' ? 'queued' : 'removing');
  processQueue();
}

/** Queue a saved recording for publishing (held instead if it has quality warnings, unless forced). */
export function queuePublish(storeKey, { flags = [], force = false } = {}) {
  if (!publishingOn() || !parseStoreKey(storeKey)) return;
  if (flags.length && !force) {
    useDB.setState((s) => ({ publishQueue: (s.publishQueue || []).filter((q) => q.storeKey !== storeKey) }));
    return setStatus(storeKey, 'held');
  }
  enqueue({ op: 'publish', storeKey });
}
/** Queue taking a recording off the family apps (after a delete). */
export function queueUnpublish(storeKey) {
  if (!publishingOn() || !parseStoreKey(storeKey)) return;
  enqueue({ op: 'unpublish', storeKey });
}

const extFor = (type = '') => (type.includes('mp4') || type.includes('aac') ? 'm4a' : type.includes('ogg') ? 'ogg' : type.includes('mpeg') ? 'mp3' : type.includes('wav') ? 'wav' : 'webm');

let running = false;
/** Uploads everything waiting. Safe to call any time; does nothing offline or signed out. */
export async function processQueue() {
  if (running || !publishingOn()) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const { data } = await supabase.auth.getSession();
  const uid = data?.session?.user?.id;
  if (!uid) return;
  running = true;
  try {
    for (;;) {
      const item = (db().publishQueue || [])[0];
      if (!item) break;
      const target = parseStoreKey(item.storeKey);
      try {
        if (item.op === 'unpublish') {
          const { error } = await supabase.from('brilla_voice_clips').update({ deleted: true, updated_by: uid, updated_at: new Date().toISOString() }).eq('teacher', target.teacher).eq('key', target.key);
          if (error) throw error;
          setStatus(item.storeKey, null);
        } else {
          const blob = await getClip(item.storeKey);
          if (blob) {
            const { data: row } = await supabase.from('brilla_voice_clips').select('version').eq('teacher', target.teacher).eq('key', target.key).maybeSingle();
            let version = (row?.version || 0) + 1;
            let path = `${target.teacher}/${target.key}/v${version}.${extFor(blob.type)}`;
            let up = await supabase.storage.from(VOICE_BUCKET).upload(path, blob, { contentType: blob.type || 'audio/webm', upsert: false });
            if (up.error && /exists|duplicate/i.test(up.error.message)) {
              version += 1;
              path = `${target.teacher}/${target.key}/v${version}.${extFor(blob.type)}`;
              up = await supabase.storage.from(VOICE_BUCKET).upload(path, blob, { contentType: blob.type || 'audio/webm', upsert: false });
            }
            if (up.error) throw up.error;
            const flags = db().clipMeta[item.storeKey]?.flags || [];
            const { error } = await supabase
              .from('brilla_voice_clips')
              .upsert({ teacher: target.teacher, key: target.key, path, version, published: true, deleted: false, flags, updated_by: uid, updated_at: new Date().toISOString() }, { onConflict: 'teacher,key' });
            if (error) throw error;
            setStatus(item.storeKey, 'live', { version, publishedAt: Date.now() });
          }
        }
        // Done (a newer save of the same line, queued meanwhile, stays in the queue).
        useDB.setState((s) => ({ publishQueue: (s.publishQueue || []).filter((q) => q !== item) }));
      } catch (e) {
        setStatus(item.storeKey, 'error', { error: String(e?.message || e).slice(0, 140) });
        // Move it to the back and stop for now; it's retried when the phone is online again.
        useDB.setState((s) => {
          const q = s.publishQueue || [];
          return q.includes(item) ? { publishQueue: [...q.filter((x) => x !== item), { ...item, tries: (item.tries || 0) + 1 }] } : {};
        });
        break;
      }
    }
  } finally {
    running = false;
  }
}

/** Starts background publishing (call once when the Admin app opens). */
export function startPublishing() {
  if (!publishingOn() || typeof window === 'undefined') return;
  window.addEventListener('online', processQueue);
  setInterval(() => (db().publishQueue || []).length && processQueue(), 60000);
  supabase.auth.onAuthStateChange((event) => event === 'SIGNED_IN' && processQueue());
  processQueue();
}

// ---------------------------------------------------------------- accounts (Admin app)
/** Signs in (or creates an account) and registers with Brilla. Returns the staff row. */
export async function signInStaff({ email, password, name, create }) {
  const auth = create ? await supabase.auth.signUp({ email, password }) : await supabase.auth.signInWithPassword({ email, password });
  if (auth.error) throw auth.error;
  return currentStaff(name);
}
/** The signed-in user's Brilla staff row (registers them if new), or null when signed out. */
export async function currentStaff(name = '') {
  const { data } = await supabase.auth.getSession();
  if (!data?.session) return null;
  const { data: row, error } = await supabase.rpc('brilla_register', { p_name: name });
  if (error) throw error;
  return row;
}
export const signOutServer = () => supabase.auth.signOut().catch(() => {});

/** Admin: everyone registered with Brilla. */
export async function listStaff() {
  const { data, error } = await supabase.from('brilla_staff').select('*').order('created_at');
  if (error) throw error;
  return data;
}
export async function setStaff(userId, status, voices) {
  const { error } = await supabase.rpc('brilla_set_staff', { p_user: userId, p_status: status, p_voices: voices });
  if (error) throw error;
}
export async function removeStaff(userId) {
  const { error } = await supabase.rpc('brilla_remove_staff', { p_user: userId });
  if (error) throw error;
}
