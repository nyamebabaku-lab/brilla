// Brilla's online server (Supabase, shared "poultrypro" project; Brilla uses only brilla_* tables and the
// brilla-voice storage bucket). These are public values: the access rules on the server decide what anyone can do.
export const SERVER_URL = 'https://tzslrrptbmhdlhxbfujq.supabase.co';
export const SERVER_KEY = 'sb_publishable_NaxI8UQ9JErCJ-Vw6RdHqg_NgAyxDIM';
export const VOICE_BUCKET = 'brilla-voice';
export const publicClipUrl = (path) => `${SERVER_URL}/storage/v1/object/public/${VOICE_BUCKET}/${path}`;

/** Published recordings (no login needed): [{ teacher, key, path, version }]. */
export async function fetchPublishedClips() {
  const res = await fetch(`${SERVER_URL}/rest/v1/brilla_voice_clips?select=teacher,key,path,version&published=eq.true&deleted=eq.false`, {
    headers: { apikey: SERVER_KEY, Authorization: `Bearer ${SERVER_KEY}` },
  });
  if (!res.ok) throw new Error('voice list unavailable');
  return res.json();
}
