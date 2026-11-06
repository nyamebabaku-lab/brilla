// Syncs recorded takes into the app.
//
//   FFMPEG=/path/to/ffmpeg npm run voice:sync -- <folder with recordings>
//
// Each file is named <Teacher>_<Take>, e.g. Akos_M03.m4a, Kwame_N01.mp3, Twi_T01.m4a, Ga_G01.wav
// (any audio format ffmpeg can read). Every take is split at the pauses, matched in order to the keys in
// src/voice/catalogue.json, levelled, and saved as MP3 into public/voice/. A report lists anything to check.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { findSegments, alignSegments, cutClip, expectedSeconds } from '../src/voice/segment.js';

const ROOT = process.cwd();
const FF = process.env.FFMPEG || 'ffmpeg';
const RATE = 22050;
const TAKE = 50;
const inbox = process.argv[2];
if (!inbox || !fs.existsSync(inbox)) {
  console.error('Usage: npm run voice:sync -- <folder with recordings>');
  process.exit(1);
}

const { entries } = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/voice/catalogue.json'), 'utf8'));
const TEACHERS = { akos: 'akos', kwame: 'kwame', twi: 'twi', ga: 'ga' };
const num = (key) => Number(key.split('-')[1]);

/** Lines expected in a take for a teacher (skips the other teacher's "only" lines). */
function takeLines(teacher, take) {
  const sec = take[0];
  const t = Number(take.slice(1));
  return entries
    .filter((e) => e.section === sec && Math.ceil(num(e.key) / TAKE) === t)
    .filter((e) => !e.only || e.only === teacher)
    .sort((a, b) => num(a.key) - num(b.key));
}

function decode(file) {
  const buf = execFileSync(FF, ['-v', 'fatal', '-i', file, '-ac', '1', '-ar', String(RATE), '-f', 'f32le', '-'], { maxBuffer: 1 << 30 });
  return new Float32Array(buf.buffer, buf.byteOffset, buf.byteLength / 4);
}
function encodeMp3(pcm, out) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  execFileSync(FF, ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(RATE), '-ac', '1', '-i', '-', '-codec:a', 'libmp3lame', '-b:a', '48k', out], { input: Buffer.from(pcm.buffer, pcm.byteOffset, pcm.byteLength) });
}
const outPath = (teacher, e) => (e.kind === 'local' ? path.join(ROOT, 'public/voice/local', e.lang, `${e.wordId}.mp3`) : path.join(ROOT, 'public/voice', teacher, `${e.key}.mp3`));

const report = [`# Voice sync report`, '', `Folder: ${inbox}`, ''];
let saved = 0;

// Voice packs exported from Admin → Voice studio (already split into lines).
for (const f of fs.readdirSync(inbox).filter((x) => x.endsWith('.json'))) {
  let pack;
  try {
    pack = JSON.parse(fs.readFileSync(path.join(inbox, f), 'utf8'));
  } catch {
    continue;
  }
  if (!pack.brillaVoicePack) continue;
  const byKey = new Map(entries.map((e) => [e.key, e]));
  let n = 0;
  for (const [key, url] of Object.entries(pack.clips || {})) {
    const e = byKey.get(key);
    if (!e) continue;
    const tmp = path.join(ROOT, 'node_modules/.cache/voice-clip.bin');
    fs.mkdirSync(path.dirname(tmp), { recursive: true });
    fs.writeFileSync(tmp, Buffer.from(url.split(',')[1], 'base64'));
    encodeMp3(decode(tmp), outPath(pack.voice, e));
    n++;
  }
  saved += n;
  report.push(`- ✅ **${f}** (Voice studio pack, ${pack.voice}): ${n} clips`);
}
const files = fs.readdirSync(inbox).filter((f) => /^(akos|kwame|twi|ga)_[A-Z]\d{2}\.[a-z0-9]+$/i.test(f)).sort();
const skipped = fs.readdirSync(inbox).filter((f) => !files.includes(f) && !f.endsWith('.json'));
for (const f of files) {
  const [, who, take] = f.match(/^([a-z]+)_([A-Z]\d{2})/i);
  const teacher = TEACHERS[who.toLowerCase()];
  const lines = takeLines(teacher, take.toUpperCase());
  if (!lines.length) {
    report.push(`- **${f}**: no take ${take} in the script, skipped`);
    continue;
  }
  const pcm = decode(path.join(inbox, f));
  const found = findSegments(pcm, RATE);
  const { clips, status, note, found: n } = alignSegments(found, lines.length);
  const flags = [];
  // A take whose line count doesn't match would put audio on the wrong keys, so it's held back
  // (re-record it, or fix it in Admin → Voice studio). FORCE=1 saves the lines that were found anyway.
  const save = status === 'ok' || process.env.FORCE === '1';
  clips.forEach((c, i) => {
    if (!save) return;
    const e = lines[i];
    const len = c.end - c.start;
    const want = expectedSeconds(e.kind === 'local' || e.kind === 'sound' ? 'x' : e.text);
    if (len > want * 2.6 + 0.8) flags.push(`${e.key} is long (${len.toFixed(1)}s): maybe two lines joined`);
    if (len < want * 0.3) flags.push(`${e.key} is very short (${len.toFixed(1)}s)`);
    encodeMp3(cutClip(pcm, RATE, c), outPath(teacher, e));
    saved++;
  });
  const head = status === 'ok' ? '✅' : '⚠️';
  report.push(`- ${head} **${f}** (${(pcm.length / RATE / 60).toFixed(1)} min): ${n} lines found, ${lines.length} expected${note ? ` (${note})` : ''}${status !== 'ok' ? `: **${status}, not saved**. Check that the take was read in order with a pause after every line, then send it again (or fix it in Admin → Voice studio).` : ''}`);
  flags.forEach((x) => report.push(`  - ${x}`));
}
if (skipped.length) report.push('', `Files not named like Akos_M03.m4a (ignored): ${skipped.join(', ')}`);

// Manifest: which clips exist, so the app only uses recorded lines.
const manifest = { akos: [], kwame: [], local: { twi: [], ga: [] } };
for (const t of ['akos', 'kwame']) {
  const dir = path.join(ROOT, 'public/voice', t);
  if (fs.existsSync(dir)) manifest[t] = fs.readdirSync(dir).filter((x) => x.endsWith('.mp3')).map((x) => x.replace('.mp3', '')).sort();
}
for (const l of ['twi', 'ga']) {
  const dir = path.join(ROOT, 'public/voice/local', l);
  if (fs.existsSync(dir)) manifest.local[l] = fs.readdirSync(dir).filter((x) => x.endsWith('.mp3')).map((x) => x.replace('.mp3', '')).sort();
}
fs.mkdirSync(path.join(ROOT, 'public/voice'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'public/voice/manifest.json'), JSON.stringify(manifest));
const total = entries.filter((e) => e.kind !== 'local').length;
report.push('', `Saved ${saved} clips this run.`, `Recorded so far: Auntie Akos ${manifest.akos.length}/${total - 1}, Uncle Kwame ${manifest.kwame.length}/${total - 1}, Twi ${manifest.local.twi.length}, Ga ${manifest.local.ga.length}.`);
fs.mkdirSync(path.join(ROOT, 'release'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'release/voice-sync-report.md'), report.join('\n'));
console.log(report.join('\n'));
