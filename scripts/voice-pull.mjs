// Packs every recording published from Brilla Admin into the app build (public/voice/), so families have them
// offline from the first install and the server isn't asked for the same files again and again.
// The app still checks the server for anything published after the build.
//
//   node scripts/voice-pull.mjs            (FFMPEG=/path/to/ffmpeg converts to MP3 for iPhone; optional)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const src = fs.readFileSync(path.join(ROOT, 'src/lib/server.js'), 'utf8');
const URL_ = src.match(/SERVER_URL = '([^']+)'/)[1];
const KEY = src.match(/SERVER_KEY = '([^']+)'/)[1];
const OUT = path.join(ROOT, 'public/voice');
const FF = process.env.FFMPEG || 'ffmpeg';

let ffmpeg = true;
try {
  execFileSync(FF, ['-version'], { stdio: 'ignore' });
} catch {
  ffmpeg = false;
}

const res = await fetch(`${URL_}/rest/v1/brilla_voice_clips?select=teacher,key,path,version&published=eq.true&deleted=eq.false`, { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } });
if (!res.ok) {
  console.log(`voice-pull: server unavailable (${res.status}); building with the recordings already in public/voice`);
  process.exit(0);
}
const rows = await res.json();

// Existing manifest (older format lists keys; newer maps key → version).
const manifestPath = path.join(OUT, 'manifest.json');
const old = fs.existsSync(manifestPath) ? JSON.parse(fs.readFileSync(manifestPath, 'utf8')) : {};
const asMap = (x) => (Array.isArray(x) ? Object.fromEntries(x.map((k) => [k, 0])) : { ...(x || {}) });
const manifest = { akos: asMap(old.akos), kwame: asMap(old.kwame), local: { twi: asMap(old.local?.twi), ga: asMap(old.local?.ga) } };

let fetched = 0;
for (const r of rows) {
  const isLocal = r.teacher === 'twi' || r.teacher === 'ga';
  const list = isLocal ? manifest.local[r.teacher] : manifest[r.teacher];
  if ((list[r.key] ?? -1) >= r.version) continue;
  const file = await fetch(`${URL_}/storage/v1/object/public/brilla-voice/${r.path}`);
  if (!file.ok) continue;
  const dir = isLocal ? path.join(OUT, 'local', r.teacher) : path.join(OUT, r.teacher);
  fs.mkdirSync(dir, { recursive: true });
  const target = path.join(dir, `${r.key}.mp3`);
  const raw = Buffer.from(await file.arrayBuffer());
  if (ffmpeg) {
    // Phones record WebM/Opus; MP3 plays everywhere (including iPhone).
    execFileSync(FF, ['-v', 'fatal', '-y', '-i', '-', '-ac', '1', '-ar', '22050', '-codec:a', 'libmp3lame', '-b:a', '48k', target], { input: raw });
  } else if (r.path.endsWith('.mp3')) fs.writeFileSync(target, raw);
  else continue; // can't convert without ffmpeg: the app streams this one from the server instead
  list[r.key] = r.version;
  fetched++;
}
// Lines taken off the server are removed from the build too.
const live = new Set(rows.map((r) => `${r.teacher}:${r.key}`));
for (const t of ['akos', 'kwame', 'twi', 'ga']) {
  const list = t === 'twi' || t === 'ga' ? manifest.local[t] : manifest[t];
  for (const [k, v] of Object.entries(list))
    if (v > 0 && !live.has(`${t}:${k}`)) {
      delete list[k];
      fs.rmSync(path.join(OUT, t === 'twi' || t === 'ga' ? `local/${t}` : t, `${k}.mp3`), { force: true });
    }
}
fs.mkdirSync(OUT, { recursive: true });
fs.writeFileSync(manifestPath, JSON.stringify(manifest));
console.log(`voice-pull: ${rows.length} published, ${fetched} new or updated packed into the build${ffmpeg ? '' : ' (no ffmpeg: WebM clips stay on the server)'}`);
