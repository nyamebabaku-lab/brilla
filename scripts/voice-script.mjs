// Builds the voice-recording script (the "voice bank").
//
// It runs the real lesson generators over every class and subject, gathers every sentence the app can speak, and
// splits them into lines to record once each: whole sentences where there are only a few versions, otherwise
// sentence pieces plus "slot" words (numbers, names, colours, letters, vocabulary) that the app joins together.
//
// Keys are permanent: src/voice/catalogue.json keeps every key ever given out, and new lines get new keys, so
// recordings never go out of sync. Run with:  npm run voice:script
import fs from 'node:fs';
import path from 'node:path';
import { lessonsFor, buildLesson } from '../src/curriculum/index.js';
import { LEVELS } from '../src/curriculum/levels.js';
import { subjectsForLevel } from '../src/curriculum/subjects.js';
import { TRACKS } from '../src/curriculum/tracks.js';
import { PICTURES } from '../src/curriculum/generators/creative.js';
import { DEFAULT_SETTINGS } from '../src/data/seed.js';
import { DEFAULT_LANGUAGES } from '../src/curriculum/languagePacks.js';
import { SOUND_SPELLING } from '../src/lib/soundSpelling.js';
import { sayFor } from '../src/activities/traceText.js';
import { answerText } from '../src/activities/exampleText.js';
import { toChunks, numberWords, ordinalWords } from '../src/voice/normalize.js';
import { buildIndex, matchText } from '../src/voice/matcher.js';
import { fixedLines } from '../src/voice/fixedLines.js';

const ROOT = process.cwd(); // run from the project folder (npm run voice:script)
const CATALOGUE = path.join(ROOT, 'src/voice/catalogue.json');
const OUT = path.join(ROOT, 'release');
const SEEDS = Number(process.env.SEEDS || 6);
const WHOLE_MAX = 6; // record a sentence whole when it has at most this many versions

// ---------------------------------------------------------------- 1. gather everything the app says
const corpus = []; // { text, section }
const vocab = new Set(); // short spoken words/phrases (option labels, quoted words, captions…)
const sounds = new Set(); // phonics graphemes spoken as sounds
const SUBJECT_SECTION = { maths: 'M', english: 'E', phonics: 'P', science: 'S', writing: 'W', trace: 'C', colour: 'C', draw: 'C', scribble: 'C', language: 'E' };

const add = (text, section) => text && String(text).trim() && corpus.push({ text: String(text), section });
const addVocab = (text) => {
  if (!text) return;
  for (const c of toChunks(text)) if (c.words.length && c.words.length <= 3) vocab.add(c.words.join(' '));
};
const quoted = (text) => [...String(text || '').matchAll(/"([^"]{1,30})"/g)].map((m) => m[1]);

function collectStep(st, sec) {
  if (!st.localAudio) quoted(st.prompt).forEach(addVocab);
  quoted(st.say).forEach(addVocab);
  switch (st.type) {
    case 'choice':
      if (st.say !== '') add(st.say || st.prompt, sec);
      if (st.visual?.caption) addVocab(st.visual.caption);
      for (const o of st.options) {
        if (o.local) continue;
        if (st.soundOptions) sounds.add(o.label);
        else if (st.sayOptions || st.emojiOnly || st.emojiOptions) {
          addVocab(o.label);
          if (o.label) add(o.label, 'V');
        } else addVocab(o.label);
      }
      break;
    case 'learn':
    case 'read':
      add(st.say, sec);
      break;
    case 'sound':
      sounds.add(st.grapheme);
      st.words.forEach((w) => (addVocab(w.label), add(w.label, 'V')));
      break;
    case 'blend':
      st.word.split('').forEach((l) => sounds.add(l));
      addVocab(st.word);
      add(st.word, 'V');
      break;
    case 'sort':
      add(`${st.prompt} Tap a picture, then tap the box it goes in.`, sec);
      st.items.forEach((it) => (addVocab(it.label), add(it.label, 'V')));
      st.bins.forEach((b) => addVocab(b.label));
      break;
    case 'spell':
      add(`Spell ${st.word}`, sec);
      addVocab(st.word);
      add(st.word, 'V');
      st.word.toLowerCase().split('').forEach((l) => sounds.add(l));
      break;
    case 'trace':
      add(`Watch me. ${sayFor(st)}`, 'C');
      if (st.kind !== 'path') addVocab(st.target);
      break;
    case 'draw':
      add(st.prompt, 'C');
      break;
    case 'colour':
      if (st.targets) {
        add(st.say, 'C');
        for (const tg of st.targets) {
          addVocab(tg.name);
          add(`Yes! The ${tg.name} is ${tg.colour}.`, 'C');
          add(`The ${tg.name} should be ${tg.colour}.`, 'C');
          add(`Colour the ${tg.name} ${tg.colour}`, 'C');
        }
      }
      break;
    case 'write':
      add(`Copy: ${st.text}`, 'W');
      add(st.text, 'W');
      break;
    case 'compose':
      add(st.prompt, 'W');
      break;
    case 'word':
      add([...st.w].length <= 2 ? 'This letter' : st.en, 'E');
      break;
    case 'example': {
      const ex = st.example;
      if (ex.type === 'spell') {
        add(`Watch me spell ${ex.word}.`, sec);
        add(`${ex.word.split('').join(', ')}. ${ex.word}!`, sec);
      } else if (ex.type === 'sort') {
        add(`Watch me. ${ex.prompt}`, sec);
        add(`${ex.items[0].label} goes in ${ex.bins[ex.items[0].bin].label}.`, sec);
      } else {
        add(`Watch me. ${ex.say || ex.prompt}`, sec);
        if (ex.options[ex.answer]?.local) add(`The answer is. ${ex.explain || ''}`, sec);
        else {
          add(`The answer is ${answerText(ex)}. ${ex.explain || ''}`, sec);
          addVocab(answerText(ex));
        }
      }
      collectStep(ex, sec);
      break;
    }
    default:
  }
}

const settings = DEFAULT_SETTINGS;
let lessonsBuilt = 0;
function sampleLessons(seedOffset) {
  for (const level of LEVELS) {
    for (const subject of subjectsForLevel(level.id)) {
      const langs = subject.id === 'language' ? Object.keys(DEFAULT_LANGUAGES) : ['twi'];
      for (const lang of langs)
        for (const track of Object.keys(TRACKS)) {
          const list = lessonsFor(level.id, subject.id, { track, lang, childName: '@child', settings });
          // every core lesson, then a spread of later rounds, reviews and challenges
          const idx = [...Array(Math.min(60, list.length)).keys(), ...Array.from({ length: 12 }, (_, i) => 60 + i * 77)].filter((i) => i < list.length);
          for (const i of idx)
            for (let s = 0; s < SEEDS; s++) {
              const L = buildLesson(list[i].id, { track, lang, childName: '@child', settings, attempt: s + seedOffset });
              if (!L) continue;
              lessonsBuilt++;
              L.steps.forEach((st) => collectStep(st, SUBJECT_SECTION[subject.id] || 'A'));
            }
        }
    }
  }
}
sampleLessons(0);

for (const [sec, t] of fixedLines()) add(t, sec);
PICTURES.forEach((p) => {
  add(`Let's colour the ${p.name}! Pick a colour, then tap the picture.`, 'C');
  add(`Colour the ${p.name}`, 'C');
});
Object.keys(SOUND_SPELLING).forEach((g) => sounds.add(g));

// ---------------------------------------------------------------- 2. slot words
const NUMBER_WORDS = new Set();
for (let n = 0; n <= 100; n++) numberWords(n).split(' ').forEach((w) => NUMBER_WORDS.add(w));
for (let n = 1; n <= 100; n++) ordinalWords(n).split(' ').forEach((w) => NUMBER_WORDS.add(w));
['hundred', 'thousand', 'million', 'billion', 'point', 'half', 'halves', 'quarter', 'quarters'].forEach((w) => NUMBER_WORDS.add(w));
for (let d = 3; d <= 20; d++) ['', 's'].forEach((s) => NUMBER_WORDS.add(ordinalWords(d).split(' ').pop() + s));
const NAMES = new Set(Object.values(TRACKS).flatMap((t) => t.names.flatMap((n) => [n.toLowerCase(), `${n.toLowerCase()}'s`])).concat('@child'));
const COLOURS = new Set(['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'brown', 'black', 'white', 'grey', 'teal', 'cream']);
const LETTERS = new Set('bcdefghjklmnopqrstuvwxyz'.split(''));
// Very common words never count as vocabulary slots, so sentence pieces stay natural.
const STOP = new Set(
  'a an the is are was were be been am i you he she it we they me my your his her its our their this that these those of to in on at for from with by and or but so if as not no yes do does did can will what which who whom whose where when why how many much more most less one some any all each every there here than then too very just up down out over under again also only own same other such into about after before off ok let lets let\'s make makes get got go goes going come comes say says said see look find tap pick put has have had give gives took take'.split(
    ' ',
  ),
);
const vocabPhrases = [...vocab].filter((v) => !(v.split(' ').length === 1 && (STOP.has(v) || NUMBER_WORDS.has(v))));
const vocabIndex = new Map();
for (const v of vocabPhrases) {
  const w = v.split(' ');
  const list = vocabIndex.get(w[0]) || [];
  list.push(w);
  vocabIndex.set(w[0], list);
}
for (const list of vocabIndex.values()) list.sort((a, b) => b.length - a.length);

/** Splits a chunk's words into runs: { slot: type|null, words: [] }. */
function slotRuns(words) {
  const runs = [];
  const push = (slot, ws) => {
    const last = runs[runs.length - 1];
    if (last && last.slot === null && slot === null) last.words.push(...ws);
    else runs.push({ slot, words: ws });
  };
  for (let i = 0; i < words.length; ) {
    const w = words[i];
    const nextIsNum = NUMBER_WORDS.has(words[i + 1]);
    const prevIsNum = NUMBER_WORDS.has(words[i - 1]);
    if (NUMBER_WORDS.has(w) || (w === 'and' && prevIsNum && nextIsNum)) {
      push('N', [w]);
      i++;
    } else if (NAMES.has(w)) {
      push('NAME', [w]);
      i++;
    } else if (COLOURS.has(w)) {
      push('COL', [w]);
      i++;
    } else if (LETTERS.has(w)) {
      push('L', [w]);
      i++;
    } else {
      const v = (vocabIndex.get(w) || []).find((cand) => cand.every((x, k) => words[i + k] === x));
      if (v) {
        push('V', v);
        i += v.length;
      } else {
        push(null, [w]);
        i++;
      }
    }
  }
  return runs;
}

const PROPER = new Set([
  ...[...NAMES].map((n) => n.replace("'s", '')),
  ...'monday tuesday wednesday thursday friday saturday sunday january february march april may june july august september october november december'.split(' '),
  ...'ghana accra kumasi tamale africa london earth mars venus jupiter saturn mercury neptune uranus brilla auntie akos uncle kwame twi ga english bodmas akosombo harmattan'.split(' '),
]);
const display = (words, info) => {
  if (info.kind === 'letter') return words.toUpperCase();
  let s = words
    .split(' ')
    .map((w) => (PROPER.has(w.replace(/'s$/, '')) ? w.charAt(0).toUpperCase() + w.slice(1) : w.length === 1 && w !== 'a' ? w.toUpperCase() : w))
    .join(' ');
  if (info.kind === 'whole' || info.start) s = s.charAt(0).toUpperCase() + s.slice(1);
  if (info.question) s += '?';
  return s;
};
// ---------------------------------------------------------------- 3. decide what to record
// A vocabulary word only becomes a swappable "slot" where the app really puts different words in that spot
// (e.g. "What colour is the [banana / leaf / sun]?"); otherwise it stays part of the sentence piece.
const chunkRuns = new Map(); // chunk words → runs
for (const item of corpus) for (const chunk of toChunks(item.text)) chunkRuns.set(chunk.words.join(' '), null);
for (const key of chunkRuns.keys()) chunkRuns.set(key, slotRuns(key.split(' ')));
const fillers = new Map(); // context with one V run blanked → set of words seen there
const ctxKey = (runs, at) => runs.map((r, i) => (i === at ? '#' : r.slot && r.slot !== 'V' ? `#${r.slot}` : r.words.join(' '))).join(' ');
for (const runs of chunkRuns.values())
  runs.forEach((r, i) => {
    if (r.slot !== 'V') return;
    const k = ctxKey(runs, i);
    if (!fillers.has(k)) fillers.set(k, new Set());
    fillers.get(k).add(r.words.join(' '));
  });
function settleRuns(runs) {
  const out = [];
  runs.forEach((r, i) => {
    const slot = r.slot === 'V' && (fillers.get(ctxKey(runs, i))?.size || 0) < 3 ? null : r.slot;
    const last = out[out.length - 1];
    if (!slot && last && !last.slot) last.words = [...last.words, ...r.words];
    else out.push({ slot, words: [...r.words] });
  });
  return out;
}

const templates = new Map(); // template → { variants, sections, question, runs }
for (const item of corpus) {
  for (const chunk of toChunks(item.text)) {
    const runs = settleRuns(chunkRuns.get(chunk.words.join(' ')) || slotRuns(chunk.words));
    const tpl = runs.map((r) => (r.slot ? `#${r.slot}` : r.words.join(' '))).join(' ');
    const t = templates.get(tpl) || { variants: new Map(), sections: new Map(), question: false, runs };
    t.variants.set(chunk.words.join(' '), runs);
    t.sections.set(item.section, (t.sections.get(item.section) || 0) + 1);
    t.question ||= chunk.question;
    templates.set(tpl, t);
  }
}

const wanted = new Map(); // words → { section, kind, question, piece }
const want = (words, section, kind, extra = {}) => {
  if (!words || words.includes('@child')) return;
  if (!wanted.has(words)) wanted.set(words, { section, kind, ...extra });
};
const SLOT_SECTION = { N: 'N', L: 'L', NAME: 'V', COL: 'V', V: 'V' };
for (const [, t] of templates) {
  const section = [...t.sections.entries()].sort((a, b) => b[1] - a[1])[0][0];
  const slots = t.runs.filter((r) => r.slot);
  const forced = slots.some((r) => r.slot === 'N' || r.words.includes('@child'));
  if (!slots.length || (!forced && t.variants.size <= WHOLE_MAX)) {
    for (const words of t.variants.keys()) want(words, section, 'whole', { question: t.question });
    continue;
  }
  for (const [full, runs] of t.variants.entries()) {
    runs.forEach((r, i) => {
      if (r.slot) {
        if (r.slot === 'N' || r.slot === 'L') r.words.forEach((w) => want(w, SLOT_SECTION[r.slot], r.slot === 'N' ? 'number' : 'letter'));
        else want(r.words.join(' '), SLOT_SECTION[r.slot], 'word');
      } else want(r.words.join(' '), section, 'piece', { question: t.question && i === runs.length - 1, start: i === 0, example: display(full.replace(/@child/g, 'Ama'), { kind: 'whole', question: t.question }) });
    });
  }
}
// Single letters and numbers are always available on their own.
'abcdefghijklmnopqrstuvwxyz'.split('').forEach((l) => want(l, 'L', 'letter'));
for (let n = 0; n <= 20; n++) want(numberWords(n), 'N', 'number');
NUMBER_WORDS.forEach((w) => want(w, 'N', 'number'));
want('and', 'N', 'number');
NAMES.forEach((n) => n !== '@child' && want(n, 'V', 'word'));

// ---------------------------------------------------------------- 4. permanent keys
const old = fs.existsSync(CATALOGUE) ? JSON.parse(fs.readFileSync(CATALOGUE, 'utf8')) : { entries: [] };
const byWords = new Map(old.entries.filter((e) => e.words).map((e) => [`${e.kind === 'sound' ? 'sound:' : ''}${e.words}`, e]));
const nextNum = {};
for (const e of old.entries) {
  const [sec, num] = e.key.split('-');
  nextNum[sec] = Math.max(nextNum[sec] || 0, Number(num));
}
const newKey = (sec) => `${sec}-${String((nextNum[sec] = (nextNum[sec] || 0) + 1)).padStart(4, '0')}`;

const TIPS = {
  whole: 'Whole sentence: read it naturally.',
  piece: 'Part of a sentence: keep it flowing, no full stop at the end.',
  word: 'Single word: clear and neutral (it is joined into many sentences).',
  number: 'Number word: clear and neutral (joined to other numbers).',
  letter: 'Say the letter NAME (e.g. “bee” for b).',
  sound: 'Say the SOUND, not the letter name.',
  local: 'Native speaker: say the word clearly, once.',
};
const teacherOnly = (words) => (/\bauntie akos\b/.test(words) ? 'akos' : /\buncle kwame\b/.test(words) ? 'kwame' : undefined);

const entries = [...old.entries];
const seen = new Set(entries.map((e) => (e.kind === 'local' ? `local:${e.lang}:${e.wordId}` : `${e.kind === 'sound' ? 'sound:' : ''}${e.words}`)));
const order = ['A', 'N', 'L', 'P', 'M', 'E', 'S', 'W', 'C', 'V'];
const sortedWanted = [...wanted.entries()].sort((a, b) => order.indexOf(a[1].section) - order.indexOf(b[1].section) || a[0].localeCompare(b[0]));
for (const [words, info] of sortedWanted) {
  if (seen.has(words)) {
    // Same line as before: keep its key, refresh how it's shown in the script.
    const e = byWords.get(words);
    if (e) Object.assign(e, { text: display(words, info), ...(info.example ? { example: info.example } : {}) });
    continue;
  }
  seen.add(words);
  entries.push({ key: newKey(info.section), section: info.section, kind: info.kind, words, text: display(words, info), ...(info.example ? { example: info.example } : {}), tip: info.question ? `${TIPS[info.kind]} It's a question: let your voice rise.` : TIPS[info.kind], ...(teacherOnly(words) ? { only: teacherOnly(words) } : {}) });
}
for (const g of [...sounds].sort()) {
  if (seen.has(`sound:${g}`)) continue;
  seen.add(`sound:${g}`);
  entries.push({ key: newKey('P'), section: 'P', kind: 'sound', sound: g, words: g, text: `${g}  (say “${SOUND_SPELLING[g] || g}”)`, tip: TIPS.sound });
}
for (const [lang, sec] of [['twi', 'T'], ['ga', 'G']])
  for (const c of DEFAULT_LANGUAGES[lang].categories)
    for (const w of c.words) {
      const id = `${lang}:${w.id}`;
      if (seen.has(`local:${id}`)) continue;
      seen.add(`local:${id}`);
      entries.push({ key: newKey(sec), section: sec, kind: 'local', lang, wordId: w.id, text: w.w, meaning: w.en, tip: TIPS.local });
    }

// ---------------------------------------------------------------- 5. coverage check (on fresh questions too)
const index = buildIndex(entries.filter((e) => e.kind !== 'sound' && e.kind !== 'local'));
const allow = (w) => w === '@child';
function coverage(items) {
  let ok = 0;
  const gaps = new Map();
  for (const it of items) {
    const m = matchText(it.text, index, { allow });
    if (m.complete) ok++;
    else m.parts.filter((p) => p.miss && !allow(p.miss)).forEach((p) => gaps.set(p.miss, (gaps.get(p.miss) || 0) + 1));
  }
  return { pct: items.length ? (ok / items.length) * 100 : 100, gaps: [...gaps.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25) };
}
const trained = coverage(corpus);
const trainedCount = corpus.length;
corpus.length = 0;
sampleLessons(100); // brand-new questions the builder hasn't seen
const fresh = coverage(corpus);

// ---------------------------------------------------------------- 6. write outputs
entries.sort((a, b) => order.concat(['P', 'T', 'G']).indexOf(a.key[0]) - order.concat(['P', 'T', 'G']).indexOf(b.key[0]) || a.key.localeCompare(b.key));
fs.writeFileSync(CATALOGUE, JSON.stringify({ version: 2, note: 'Permanent voice keys. Never renumber or remove; new lines get new keys.', entries }, null, 1));
// Slim copy for the app: just what's needed to match speech to clips.
const bank = {
  phrases: entries.filter((e) => e.words && e.kind !== 'sound' && e.kind !== 'local').map((e) => [e.key, e.words]),
  sounds: Object.fromEntries(entries.filter((e) => e.kind === 'sound').map((e) => [e.sound, e.key])),
};
fs.writeFileSync(path.join(ROOT, 'src/voice/bank.json'), JSON.stringify(bank));
fs.mkdirSync(OUT, { recursive: true });
const csv = ['key,section,take,kind,text,tip,meaning'];
const takeOf = (key) => `${key[0]}${String(Math.ceil(Number(key.split('-')[1]) / 50)).padStart(2, '0')}`;
for (const e of entries) csv.push([e.key, e.section, takeOf(e.key), e.kind, e.text, e.tip, e.meaning || ''].map((x) => `"${String(x).replace(/"/g, '""')}"`).join(','));
fs.writeFileSync(path.join(OUT, 'Brilla-Voice-Script.csv'), csv.join('\n'));

const count = (sec) => entries.filter((e) => e.section === sec).length;
console.log(`lessons sampled: ${lessonsBuilt}, spoken lines gathered: ${trainedCount}`);
console.log('lines per section:', ['A', 'N', 'L', 'P', 'M', 'E', 'S', 'W', 'C', 'V', 'T', 'G'].map((s) => `${s}=${count(s)}`).join(' '), `TOTAL=${entries.length}`);
console.log(`coverage of gathered lines: ${trained.pct.toFixed(2)}%`);
console.log(`coverage of brand-new questions: ${fresh.pct.toFixed(2)}%  (gaps fall back to the device voice)`);
if (fresh.gaps.length) console.log('most common missing words:', fresh.gaps.map(([w, n]) => `${w}×${n}`).join(', '));
