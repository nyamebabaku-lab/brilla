// Turns src/voice/catalogue.json into a printable recording script (HTML → release/Brilla-Voice-Script.html).
// The PDF is printed from that HTML with a headless browser.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const { entries } = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/voice/catalogue.json'), 'utf8'));
const TAKE = 50;

const SECTIONS = {
  A: ['App and teacher', 'Greetings, instructions, praise, break games and screens around the lessons.'],
  N: ['Numbers', 'Number words. The app joins them to say any number, e.g. “three hundred and forty two”.'],
  L: ['Letter names', 'Say the NAME of each letter: “ay”, “bee”, “see”…'],
  P: ['Phonics', 'Phonics questions, then every letter SOUND. For sounds, say the sound, never the letter name.'],
  M: ['Maths', 'Question and explanation pieces. Pieces are joined with numbers and words, so keep them smooth.'],
  E: ['English', 'English questions, grammar, reading stories and Twi/Ga lesson instructions (in English).'],
  S: ['Science', 'Science questions, facts and sorting games.'],
  W: ['Writing', 'Copying, spelling and writing prompts.'],
  C: ['Tracing, colouring and drawing', 'Instructions for the creative activities, colour names and drawing ideas.'],
  V: ['Vocabulary', 'Single words and names joined into many sentences. Say each one clearly with a neutral tone.'],
  T: ['Twi words (native speaker)', 'Record with a native Twi speaker. One recording per word, used by both teachers.'],
  G: ['Ga words (native speaker)', 'Record with a native Ga speaker. One recording per word, used by both teachers. These words still need checking by a Ga speaker.'],
};
const ORDER = Object.keys(SECTIONS);
const KIND = { whole: 'sentence', piece: 'piece', word: 'word', number: 'number', letter: 'letter', sound: 'SOUND', local: 'native' };
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const num = (key) => Number(key.split('-')[1]);
const takeName = (sec, n) => `${sec}${String(n).padStart(2, '0')}`;

const fontDir = path.join(ROOT, 'node_modules/@fontsource/fredoka/files');
const font = (w) => `@font-face{font-family:Fredoka;font-weight:${w};src:url("file://${fontDir}/fredoka-latin-${w}-normal.woff2") format("woff2")}`;

let body = '';
const totals = ORDER.map((s) => [s, entries.filter((e) => e.section === s).length]);
const voiceLines = entries.filter((e) => e.section !== 'T' && e.section !== 'G');
const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

body += `
<section class="cover">
  <div class="star">★</div>
  <h1>Brilla<br><span>Teacher Voice Script</span></h1>
  <p class="lead">Every line Auntie Akos and Uncle Kwame say in the app, to be recorded once each.</p>
  <table class="totals">
    ${totals.map(([s, n]) => `<tr><td><b>${s}</b></td><td>${SECTIONS[s][0]}</td><td>${n} lines · ${Math.ceil(n / TAKE)} take${n > TAKE ? 's' : ''}</td></tr>`).join('')}
    <tr class="sum"><td></td><td>Each teacher records</td><td>${voiceLines.length} lines</td></tr>
    <tr class="sum"><td></td><td>Native speakers record</td><td>${entries.length - voiceLines.length} Twi/Ga words</td></tr>
  </table>
  <p class="small">Version ${today}. Keys are permanent: a key always means the same line.</p>
</section>

<section class="howto">
  <h2>How to record</h2>
  <ol>
    <li><b>Where:</b> a quiet room with soft things around (curtains, sofa, bed) to stop echo. Fans and AC off. Phone on silent.</li>
    <li><b>How:</b> any phone voice-recorder app is fine. Hold the phone about a hand-span (20 cm) from your mouth, slightly below it. Keep the same distance all the time.</li>
    <li><b>One take = one block of 50 lines</b> (e.g. take <b>M03</b>). Record each take as one file.</li>
    <li><b>Name the file</b> with the teacher and the take: <b>Akos_M03.m4a</b> for Auntie Akos, <b>Kwame_M03.m4a</b> for Uncle Kwame, <b>Twi_T01.m4a</b> / <b>Ga_G01.m4a</b> for native-speaker words.</li>
    <li><b>Start</b> each take with <b>2 seconds of silence</b>, then read the lines <b>in order</b>.</li>
    <li><b>Between lines:</b> stop for about <b>1½ seconds</b> (breathe in, then read the next line).</li>
    <li><b>Made a mistake?</b> Stay silent for <b>4 seconds</b>, then read the <b>same line again</b>. The long pause tells the computer to throw away the line before it.</li>
    <li><b>Don't read</b> the key numbers, the tick boxes or the grey notes. Read only the big text.</li>
    <li><b>Lines marked “Auntie Akos only” or “Uncle Kwame only”:</b> the other teacher skips them.</li>
    <li><b>Voice:</b> warm, smiling, a little slower than normal, as if talking to a 5-year-old. Keep the same energy from the first take to the last.</li>
  </ol>
  <h3>Kinds of line</h3>
  <table class="kinds">
    <tr><td><span class="kind">sentence</span></td><td>A whole sentence. Read it naturally. Questions end with “?”: let your voice rise.</td></tr>
    <tr><td><span class="kind">piece</span></td><td>Part of a sentence. The app adds numbers or words before or after it, so keep it smooth and don't drop your voice at the end.</td></tr>
    <tr><td><span class="kind">word</span> <span class="kind">number</span></td><td>One word or name. Clear and neutral, the same way every time.</td></tr>
    <tr><td><span class="kind">letter</span></td><td>The letter's NAME: “ay”, “bee”, “see”.</td></tr>
    <tr><td><span class="kind">SOUND</span></td><td>The letter's SOUND, short and clean: “sss”, “ah”, “t” (not “tee”). The grey hint shows the sound.</td></tr>
  </table>
  <h3>When you're done</h3>
  <p>Send the files (WhatsApp, Google Drive or email) and I'll split them, check every line against this script, and put them into the app. You can also record line by line in the app: <b>Admin → Voice studio</b>.</p>
  <p class="small">Suggested order: A (app lines), N (numbers), L and P (letters and sounds), then V (words), then the subjects. Lines you haven't recorded yet are still spoken by the device voice, so the app keeps working while you record.</p>
</section>`;

for (const sec of ORDER) {
  const list = entries.filter((e) => e.section === sec).sort((a, b) => num(a.key) - num(b.key));
  if (!list.length) continue;
  const takes = Math.ceil(num(list[list.length - 1].key) / TAKE);
  body += `<section class="sec"><h2>${sec} · ${SECTIONS[sec][0]}</h2><p class="secnote">${SECTIONS[sec][1]}</p>`;
  for (let t = 1; t <= takes; t++) {
    const lines = list.filter((e) => Math.ceil(num(e.key) / TAKE) === t);
    if (!lines.length) continue;
    const tn = takeName(sec, t);
    const files = sec === 'T' ? `Twi_${tn}` : sec === 'G' ? `Ga_${tn}` : `Akos_${tn} · Kwame_${tn}`;
    body += `<div class="take"><div class="takehead"><b>Take ${tn}</b><span>${lines[0].key} – ${lines[lines.length - 1].key} · ${lines.length} lines</span><span class="file">File: ${files}</span></div><table class="lines">`;
    for (const e of lines) {
      const only = e.only ? `<span class="only">${e.only === 'akos' ? 'Auntie Akos only' : 'Uncle Kwame only'}</span>` : '';
      const extra =
        e.kind === 'local'
          ? `<div class="hint">means “${esc(e.meaning)}”</div>`
          : e.kind === 'sound'
            ? `<div class="hint">${esc(e.text.replace(/^\S+\s+/, '').replace(/^\(|\)$/g, ''))}</div>`
            : e.example
              ? `<div class="hint">in: “${esc(e.example)}”</div>`
              : '';
      const text = e.kind === 'sound' ? e.sound : e.text;
      body += `<tr><td class="box">☐</td><td class="key">${e.key}</td><td class="text">${esc(text)}${extra}</td><td class="meta"><span class="kind">${KIND[e.kind]}</span>${only}</td></tr>`;
    }
    body += `</table></div>`;
  }
  body += `</section>`;
}

const html = `<!doctype html><html><head><meta charset="utf-8"><title>Brilla Teacher Voice Script</title><style>
${[400, 500, 600, 700].map(font).join('\n')}
@page { size: A4; margin: 16mm 14mm 18mm; }
* { box-sizing: border-box; }
body { font-family: Fredoka, system-ui, sans-serif; color: #2b2350; margin: 0; font-size: 12pt; }
h1 { font-size: 40pt; line-height: 1.05; margin: 0 0 8mm; } h1 span { font-size: 22pt; color: #7c3aed; }
h2 { font-size: 20pt; margin: 0 0 2mm; color: #7c3aed; } h3 { margin: 6mm 0 2mm; }
.cover { page-break-after: always; padding-top: 20mm; }
.star { font-size: 60pt; color: #f59e0b; }
.lead { font-size: 15pt; max-width: 140mm; }
.totals { border-collapse: collapse; margin: 8mm 0; width: 100%; } .totals td { padding: 2mm 3mm; border-bottom: 1px solid #ede9fe; }
.totals .sum td { font-weight: 700; border-bottom: 0; }
.small { color: #6b7280; font-size: 10pt; }
.howto { page-break-after: always; } .howto li { margin: 0 0 2.5mm; line-height: 1.4; }
.kinds td { padding: 1.5mm 3mm 1.5mm 0; vertical-align: top; }
.sec { page-break-before: always; } .secnote { color: #6b7280; margin: 0 0 5mm; }
.take { margin: 0 0 7mm; } .takehead { display: flex; gap: 6mm; align-items: baseline; background: #f5f3ff; border-radius: 3mm; padding: 2.5mm 4mm; margin-bottom: 1mm; break-after: avoid; }
.takehead b { font-size: 14pt; color: #7c3aed; } .takehead span { color: #6b7280; font-size: 10pt; } .takehead .file { margin-left: auto; color: #2b2350; font-weight: 600; }
.lines { width: 100%; border-collapse: collapse; } .lines tr { break-inside: avoid; } .lines td { border-bottom: 1px solid #f1f5f9; padding: 2.2mm 2mm; vertical-align: top; }
.box { width: 7mm; color: #a78bfa; font-size: 13pt; } .key { width: 20mm; color: #9ca3af; font-size: 9.5pt; padding-top: 3mm !important; white-space: nowrap; }
.text { font-size: 15pt; font-weight: 500; line-height: 1.3; } .meta { width: 30mm; text-align: right; }
.hint { font-size: 9.5pt; color: #6b7280; font-weight: 400; margin-top: 0.5mm; }
.kind { display: inline-block; font-size: 8pt; text-transform: uppercase; letter-spacing: .04em; color: #7c3aed; background: #f5f3ff; border-radius: 99px; padding: .4mm 2mm; }
.only { display: block; margin-top: 1mm; font-size: 8pt; color: #be185d; font-weight: 600; }
</style></head><body>${body}</body></html>`;

fs.mkdirSync(path.join(ROOT, 'release'), { recursive: true });
fs.writeFileSync(path.join(ROOT, 'release/Brilla-Voice-Script.html'), html);
console.log('wrote release/Brilla-Voice-Script.html', `${entries.length} lines`);
