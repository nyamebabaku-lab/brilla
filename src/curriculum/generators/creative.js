// Tracing, colouring, drawing, scribbling and writing lessons.
import { int, pick, sample } from '../../lib/format';
import { PICTURE_ART } from '../../activities/pictures';
import { TRACE_PATH_IDS } from './tracePaths';
import { learn } from './helpers';
import { CVC_WORDS } from './phonics';

const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const LOWER = 'abcdefghijklmnopqrstuvwxyz'.split('');
const range = (s) => `${s[0]}–${s.at(-1)}`;

const traceSet = (title, emoji, targets, kind) => ({ title, emoji, build: () => targets.map((t) => ({ type: 'trace', target: t, kind })) });

export function traceTopics(n, childName) {
  const lines = [traceSet('Straight lines', '📏', ['down', 'across', 'slant', 'slant2'], 'path'), traceSet('Wavy lines', '🌊', ['wave', 'zigzag', 'curve', 'loop'], 'path')];
  const shapes = [traceSet('Circles and squares', '⭕', ['circle', 'square', 'oval'], 'path'), traceSet('Triangles and stars', '⭐', ['triangle', 'star', 'heart', 'diamond'], 'path')];
  const nums = [traceSet('Numbers 1–5', '🔢', ['1', '2', '3', '4', '5'], 'number'), traceSet('Numbers 6–10', '🔢', ['6', '7', '8', '9', '10'], 'number')];
  const upper = chunk(UPPER, 4).map((c) => traceSet(`Big letters ${range(c)}`, c[0], c, 'letter'));
  const lower = chunk(LOWER, 4).map((c) => traceSet(`Small letters ${range(c)}`, c[0], c, 'letter'));
  const name = childName ? [{ title: 'Write my name', emoji: '😊', build: () => [{ type: 'trace', target: childName, kind: 'word' }, { type: 'trace', target: childName, kind: 'word' }] }] : [];
  const words = chunk(CVC_WORDS.map((w) => w.label), 4).map((c, i) => traceSet(`Words ${i + 1}`, '🔤', c, 'word'));
  const cursiveL = chunk(LOWER, 5).map((c) => traceSet(`Joined letters ${range(c)}`, '✒️', c, 'cursive'));
  const cursiveW = chunk(['the', 'and', 'cat', 'sun', 'happy', 'school', 'friend', 'Ghana', 'learn', 'write', 'mango', 'family'], 4).map((c, i) => traceSet(`Joined words ${i + 1}`, '✒️', c, 'cursive'));
  const L = {
    1: [...lines, ...shapes, ...nums.slice(0, 1), traceSet('Big letters A–E', 'A', ['A', 'B', 'C', 'D', 'E'], 'letter'), traceSet('More shapes', '🔷', ['square', 'triangle', 'circle', 'heart'], 'path')],
    2: [...lines.slice(1), ...shapes.slice(1), ...nums, ...upper],
    3: [...nums, ...upper, ...lower.slice(0, 3), ...name],
    4: [...lower, ...name, ...words.slice(0, 4)],
    5: [...words, ...name, ...upper.slice(0, 2), ...cursiveL.slice(0, 2)],
    6: [...cursiveL, ...cursiveW.slice(0, 2), ...words.slice(0, 3)],
    7: [...cursiveL, ...cursiveW],
  };
  return L[n] || [];
}

export const PICTURES = [
  { id: 'sun', name: 'Happy sun', emoji: '☀️', min: 0 },
  { id: 'apple', name: 'Apple', emoji: '🍎', min: 0 },
  { id: 'balloon', name: 'Balloons', emoji: '🎈', min: 0 },
  { id: 'fish', name: 'Fish', emoji: '🐟', min: 0 },
  { id: 'house', name: 'House', emoji: '🏠', min: 0 },
  { id: 'flower', name: 'Flower', emoji: '🌸', min: 0 },
  { id: 'car', name: 'Car', emoji: '🚗', min: 1 },
  { id: 'butterfly', name: 'Butterfly', emoji: '🦋', min: 1 },
  { id: 'tree', name: 'Mango tree', emoji: '🌳', min: 1 },
  { id: 'rocket', name: 'Rocket', emoji: '🚀', min: 2 },
  { id: 'boat', name: 'Boat', emoji: '⛵', min: 2 },
  { id: 'drum', name: 'Talking drum', emoji: '🥁', min: 2 },
  { id: 'turtle', name: 'Turtle', emoji: '🐢', min: 3 },
  { id: 'kente', name: 'Kente pattern', emoji: '🧵', min: 4 },
  { id: 'mandala', name: 'Star mandala', emoji: '✴️', min: 5 },
  { id: 'city', name: 'City at night', emoji: '🌃', min: 5 },
];

export function colourTopics(n) {
  const pics = PICTURES.filter((p) => p.min <= n);
  const easyFirst = [...pics.filter((p) => p.min >= n - 2), ...pics.filter((p) => p.min < n - 2)];
  const out = [];
  easyFirst.forEach((p, i) => {
    out.push({ title: p.name, emoji: p.emoji, build: () => [{ type: 'colour', picture: p.id }] });
    if (i % 2 === 1) out.push({ title: `Colour by words ${Math.ceil(i / 2)}`, emoji: '🖍️', build: (r) => colourByInstruction(r, n) });
  });
  return out;
}

const DRAW_YOUNG = [
  ['A big sun', '☀️'], ['My family', '👨‍👩‍👧'], ['A happy face', '😊'], ['A fish in the sea', '🐟'], ['My house', '🏠'], ['A rainbow', '🌈'],
  ['A tall tree', '🌳'], ['My favourite food', '🍲'], ['A car', '🚗'], ['A flower garden', '🌻'], ['Rain from clouds', '🌧️'], ['A cat', '🐱'],
];
const DRAW_MID = [
  ['My school', '🏫'], ['A busy market', '🧺'], ['An animal from the zoo', '🦒'], ['A robot friend', '🤖'], ['My best day', '🎉'], ['Under the sea', '🐠'],
  ['A space adventure', '🚀'], ['My dream bedroom', '🛏️'], ['Our flag', '🏳️'], ['A football match', '⚽'], ['A monster that is kind', '👾'], ['My hero', '🦸'],
];
const DRAW_OLD = [
  ['Design a new playground', '🛝'], ['Draw the water cycle', '💧'], ['A city of the future', '🏙️'], ['Design a poster: keep our town clean', '♻️'], ['Draw a plant and label its parts', '🌱'],
  ['Design your own superhero', '🦸'], ['A map of your neighbourhood', '🗺️'], ['Comic strip: 3 boxes of a story', '💬'], ['Illustrate your favourite proverb or saying', '🦉'], ['Design a book cover', '📕'], ['Draw the solar system', '🪐'], ['A machine that helps farmers', '🚜'],
];
export function drawTopics(n) {
  const pool = n <= 3 ? DRAW_YOUNG : n <= 7 ? DRAW_MID : DRAW_OLD;
  return pool.map(([prompt, emoji]) => ({ title: prompt, emoji, build: () => [{ type: 'draw', prompt: `Draw ${prompt.charAt(0).toLowerCase()}${prompt.slice(1)}`.replace(/^Draw (draw|design|illustrate) /i, (m, v) => `${v.charAt(0).toUpperCase()}${v.slice(1)} `), mode: 'draw', emoji }] }));
}

const SCRIBBLES = [
  ['Rainbow scribbles', '🌈', 'rainbow', 'Scribble with the rainbow brush!'],
  ['Stamp party', '⭐', 'stamps', 'Tap to stamp stars, hearts and animals!'],
  ['Make it rain', '🌧️', 'rain', 'Draw lines going down like rain'],
  ['Round and round', '🌀', 'rainbow', 'Make big circles, round and round'],
  ['Happy colours', '😊', 'free', 'Use your favourite colours'],
  ['Zoo stamps', '🦁', 'stamps', 'Stamp animals all over the page'],
  ['Zig zag', '⚡', 'free', 'Draw zig zag lines: up, down, up, down'],
  ['Dots, dots, dots', '🔴', 'free', 'Tap tap tap to make lots of dots'],
  ['Glow brush', '✨', 'glow', 'Paint with the glowing brush'],
  ['Fireworks', '🎆', 'glow', 'Make fireworks in the sky!'],
];
export const scribbleTopics = () => SCRIBBLES.map(([title, emoji, brush, hint]) => ({ title, emoji, build: () => [{ type: 'draw', mode: 'scribble', brush, prompt: hint, emoji }] }));

const SPELL = {
  easy: [['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['pig', '🐷'], ['hat', '🎩'], ['bus', '🚌'], ['bed', '🛏️'], ['cup', '🥤'], ['fox', '🦊'], ['hen', '🐔'], ['box', '📦'], ['map', '🗺️']],
  mid: [['frog', '🐸'], ['fish', '🐟'], ['ship', '🚢'], ['star', '⭐'], ['tree', '🌳'], ['milk', '🥛'], ['duck', '🦆'], ['cake', '🎂'], ['kite', '🪁'], ['rain', '🌧️'], ['boat', '⛵'], ['moon', '🌙'], ['hand', '✋'], ['nest', '🪺']],
  hard: [['school', '🏫'], ['friend', '🧑‍🤝‍🧑'], ['banana', '🍌'], ['rabbit', '🐰'], ['garden', '🏡'], ['orange', '🍊'], ['pencil', '✏️'], ['window', '🪟'], ['monkey', '🐒'], ['flower', '🌸'], ['yellow', '💛'], ['chicken', '🐔']],
  tricky: [['because', '🤔'], ['beautiful', '🌺'], ['different', '🔀'], ['February', '📅'], ['library', '📚'], ['necessary', '❗'], ['environment', '🌍'], ['knowledge', '🧠'], ['science', '🔬'], ['government', '🏛️'], ['separate', '✂️'], ['tomorrow', '📆'], ['elephant', '🐘'], ['calendar', '🗓️']],
};
const spellSet = (title, emoji, list, r) => ({ title, emoji, build: (rr) => sample(rr || r, list, 5).map(([word, e]) => ({ type: 'spell', word, emoji: e })) });
const copySet = (title, emoji, texts, cursive = false) => ({ title, emoji, build: () => texts.map((text) => ({ type: 'write', text, cursive })) });
const compose = (title, emoji, prompt, minWords) => ({ title, emoji, build: () => [learn('Writing time', emoji, prompt), { type: 'compose', prompt, minWords }] });

export function writingTopics(n, t) {
  const [a, b] = t.names;
  const L = {
    4: [copySet('Copy: my first words', '✏️', ['cat', 'dog', 'sun', 'mum']), spellSet('Spell 3-letter words', '🔤', SPELL.easy), copySet('Copy: colours', '🎨', ['red', 'blue', 'green']), spellSet('Spell animals', '🐶', SPELL.easy.filter((w) => ['cat', 'dog', 'pig', 'fox', 'hen'].includes(w[0]))), copySet('Copy: numbers', '🔢', ['one', 'two', 'six', 'ten']), spellSet('Spelling practice', '🧩', SPELL.easy)],
    5: [copySet('Copy: short sentences', '✏️', ['I can run.', 'I see a cat.', 'We like to play.']), spellSet('Spell 4-letter words', '🔤', SPELL.mid), spellSet('Spell CVC words', '🧩', SPELL.easy), copySet('Copy: days', '📅', ['Monday', 'Friday', 'Sunday']), copySet('Copy: about me', '😊', [`My name is ${a}.`, 'I am six.']), spellSet('Spelling mix', '🔠', [...SPELL.easy, ...SPELL.mid])],
    6: [copySet('Copy: sentences', '✏️', [`${a} has a red bag.`, 'The sun is hot today.', 'We go to school.']), spellSet('Spell 4-letter words', '🔤', SPELL.mid), spellSet('Spell longer words', '📏', SPELL.hard), copySet('Copy: questions', '❓', ['What is your name?', 'Where do you live?']), compose('Write about your pet or favourite animal', '🐶', 'Write 2 or 3 sentences about an animal you love.', 10), spellSet('Spelling mix', '🔠', [...SPELL.mid, ...SPELL.hard])],
    7: [spellSet('Spell longer words', '📏', SPELL.hard), copySet('Joined-up sentences', '✒️', ['I love to read.', 'The bird can fly.'], true), compose('My family', '👪', 'Write 3 sentences about your family.', 15), compose('My best friend', '🧑‍🤝‍🧑', `Write about your best friend, like ${b}. What do you do together?`, 15), spellSet('Tricky words 1', '🤔', SPELL.tricky.slice(0, 7)), copySet('Copy: a poem', '🎵', ['Twinkle, twinkle, little star,', 'How I wonder what you are!'])],
    8: [spellSet('Tricky words 1', '🤔', SPELL.tricky.slice(0, 7)), spellSet('Tricky words 2', '🤔', SPELL.tricky.slice(7)), compose('A day at the ' + t.place, '🧺', `Describe a visit to the ${t.place}. What did you see, hear and smell?`, 25), compose('Letter to a friend', '✉️', 'Write a short friendly letter to a friend. Start with "Dear…".', 25), copySet('Joined-up writing', '✒️', ['Practice makes perfect.', 'Knowledge is power.'], true), compose('My dream job', '🧑‍🚀', 'What do you want to be when you grow up? Why?', 25)],
    9: [spellSet('Tricky words', '🤔', SPELL.tricky), compose('Story: The lost key', '🔑', 'Write a short story that begins: "I found a strange key under my bed…"', 40), compose('Should children have homework?', '📝', 'Give your opinion with two reasons.', 40), compose('Describe your town', '🏘️', `Describe ${t.town === 'the city' ? 'your town' : t.town} to a visitor.`, 40), compose('A news report', '📰', 'Write a short news report about an exciting event at your school.', 40), spellSet('Spelling challenge', '🏆', [...SPELL.hard, ...SPELL.tricky])],
    10: [compose('Letter to the mayor', '🏛️', 'Write a formal letter asking for a cleaner, greener town. Give three ideas.', 60), compose('Story: The rain that never stopped', '🌧️', 'Write a story with a beginning, a problem and an ending.', 60), compose('Argument: phones at school', '📱', 'Should pupils be allowed phones at school? Argue for or against.', 60), compose('Biography of a hero', '🦸', 'Write about a person you admire and what they achieved.', 60), spellSet('Spelling challenge', '🏆', SPELL.tricky), compose('My plans for secondary school', '🎒', 'Write about your goals for the next stage of school.', 50)],
  };
  return L[n] || [];
}

// ---------- generated rounds (used after the core lessons, up to 1000 per subject) ----------

export const COLOUR_WORDS = [
  { name: 'red', hex: '#ef4444', emoji: '🔴' },
  { name: 'orange', hex: '#f97316', emoji: '🟠' },
  { name: 'yellow', hex: '#facc15', emoji: '🟡' },
  { name: 'green', hex: '#22c55e', emoji: '🟢' },
  { name: 'blue', hex: '#3b82f6', emoji: '🔵' },
  { name: 'purple', hex: '#8b5cf6', emoji: '🟣' },
  { name: 'pink', hex: '#ec4899', emoji: '🩷' },
  { name: 'brown', hex: '#92400e', emoji: '🟤' },
  { name: 'black', hex: '#1f2937', emoji: '⚫' },
];

// Things with a real-world colour are coloured correctly; everything else can be any colour.
const NATURAL = { sky: 'blue', water: 'blue', sea: 'blue', grass: 'green', leaf: 'green', stem: 'green', sun: 'yellow', trunk: 'brown', stick: 'brown', sand: 'yellow', apple: 'red', flame: 'orange', ground: 'brown', road: 'black', 'middle of the flower': 'yellow' };

/** "Colour the sky blue, the door red…": teaches colour names and following instructions. */
export function colourByInstruction(r, n) {
  const pics = PICTURES.filter((p) => p.min <= n && PICTURE_ART[p.id]?.names);
  const p = pick(r, pics);
  const names = Object.entries(PICTURE_ART[p.id].names);
  const count = Math.min(names.length, n <= 2 ? 2 : n <= 5 ? 3 : 4);
  const chosen = sample(r, names, count);
  const free = sample(r, COLOUR_WORDS.filter((c) => !chosen.some(([, nm]) => NATURAL[nm] === c.name)), count);
  const targets = chosen.map(([idx, name], i) => {
    const c = COLOUR_WORDS.find((x) => x.name === NATURAL[name]) || free[i];
    return { idx: Number(idx), name, colour: c.name, hex: c.hex, emoji: c.emoji };
  });
  const list = targets.map((tg) => `the ${tg.name} ${tg.colour}`).join(', ');
  return [
    { type: 'learn', title: 'Find these colours', big: targets.map((tg) => tg.emoji).join(' '), text: targets.map((tg) => `${tg.emoji} ${tg.colour}`).join('   '), say: `Today we use ${targets.map((tg) => tg.colour).join(', ')}. Let's find them!` },
    { type: 'colour', picture: p.id, targets, say: `Colour ${list}.` },
  ];
}

const tracePool = (n, childName) => {
  const nums = Array.from({ length: n <= 1 ? 5 : 10 }, (_, i) => String(i + 1));
  const words = ['cat', 'dog', 'sun', 'pig', 'hat', 'bus', 'map', 'pen', 'cup', 'box', 'red', 'big', 'mum', 'dad', 'run', 'sit'];
  const sight = ['the', 'and', 'is', 'my', 'we', 'you', 'look', 'play', 'come', 'said', 'here', 'like'];
  const P = (arr, kind) => arr.map((target) => ({ target, kind }));
  const name = childName ? [{ target: childName, kind: 'word' }] : [];
  if (n <= 1) return [...P(TRACE_PATH_IDS, 'path'), ...P(nums, 'number'), ...P(UPPER.slice(0, 8), 'letter')];
  if (n === 2) return [...P(TRACE_PATH_IDS, 'path'), ...P(nums, 'number'), ...P(UPPER, 'letter')];
  if (n === 3) return [...P(nums, 'number'), ...P(UPPER, 'letter'), ...P(LOWER, 'letter'), ...name];
  if (n === 4) return [...P(LOWER, 'letter'), ...P(words, 'word'), ...name];
  if (n === 5) return [...P(words, 'word'), ...P(sight, 'word'), ...name, ...P(LOWER, 'cursive')];
  return [...P(LOWER, 'cursive'), ...P([...sight, 'Ghana', 'happy', 'friend', 'school', 'learn'], 'cursive')];
};

const DRAW_THINGS = ['sun', 'ball', 'fish', 'flower', 'tree', 'house', 'cat', 'car', 'star', 'apple', 'bird', 'butterfly', 'boat', 'goat', 'cloud', 'mango'];
const DRAW_ADJ = ['big', 'small', 'happy', 'colourful', 'tall', 'round', 'spotty', 'stripy'];
const COUNT = ['one', 'two', 'three'];
const DRAW_PLACES = ['at the market', 'in the river', 'at school', 'on the farm', 'at the beach', 'in the forest', 'in space', 'at a party', 'in the rain', 'on a bus'];
const DRAW_WHO = ['a goat', 'a family', 'a robot', 'a lion', 'children', 'a footballer', 'a farmer', 'a dancer', 'an elephant', 'a teacher'];
const DESIGN = ['a machine that cleans the beach', 'a school bag for the future', 'a new national park', 'a poster about saving water', 'a game for your class', 'a house that floats', 'a car that runs on sunshine', 'a kente-patterned book cover', 'a comic hero who plants trees', 'a map of your dream town'];

function drawPrompt(r, n) {
  if (n <= 3) {
    const c = int(r, 0, 2);
    return `Draw ${COUNT[c]} ${pick(r, DRAW_ADJ)} ${pick(r, DRAW_THINGS)}${c ? 's' : ''}`.replace('fishs', 'fish').replace('butterflys', 'butterflies').replace('mangos', 'mangoes').replace('buss', 'buses');
  }
  if (n <= 7) return `Draw ${pick(r, DRAW_WHO)} ${pick(r, DRAW_PLACES)}`;
  return `Design ${pick(r, DESIGN)}`;
}

const SCRIBBLE_MODES = [
  ['rainbow', 'Scribble big rainbow loops!', '🌈'],
  ['stamps', 'Make a stamp picture!', '⭐'],
  ['glow', 'Paint glowing fireworks!', '🎆'],
  ['free', 'Draw zig zags and wiggles', '〰️'],
  ['rainbow', 'Make it rain colours!', '🌧️'],
  ['free', 'Fill the page with dots', '🔴'],
  ['stamps', 'Stamp a whole zoo!', '🦁'],
  ['glow', 'Draw a glowing night sky', '✨'],
];

/** One generated lesson for a creative subject. `i` is the lesson number. */
export function creativeRound(subjectId, n, i, childName) {
  const round = i + 1;
  if (subjectId === 'trace')
    return {
      title: `Tracing practice ${round}`,
      emoji: '✍️',
      build: (r) => sample(r, tracePool(n, childName), 4).map(({ target, kind }) => ({ type: 'trace', target, kind })),
    };
  if (subjectId === 'colour') {
    const instruct = i % 2 === 0;
    const pics = PICTURES.filter((p) => p.min <= n);
    const p = pics[i % pics.length];
    return instruct
      ? { title: `Colour by words ${Math.ceil(round / 2)}`, emoji: '🖍️', build: (r) => colourByInstruction(r, n) }
      : { title: `${p.name} · free colouring`, emoji: p.emoji, build: () => [{ type: 'colour', picture: p.id }] };
  }
  if (subjectId === 'draw') return { title: `Drawing challenge ${round}`, emoji: '🖌️', build: (r) => [{ type: 'draw', mode: 'draw', prompt: drawPrompt(r, n), emoji: '🖌️' }] };
  const [brush, hint, emoji] = SCRIBBLE_MODES[i % SCRIBBLE_MODES.length];
  return { title: `${hint.replace(/!$/, '')}`, emoji, build: () => [{ type: 'draw', mode: 'scribble', brush, prompt: hint, emoji }] };
}

// Writing practice rounds: copy generated sentences, then spell.
const NOUNS = [['cat', '🐱'], ['goat', '🐐'], ['ball', '⚽'], ['book', '📖'], ['mango', '🥭'], ['bus', '🚌'], ['kite', '🪁'], ['fish', '🐟'], ['drum', '🥁'], ['bag', '🎒']];
const ADJS = ['big', 'red', 'happy', 'small', 'new', 'yellow', 'fast', 'funny'];
const VERBS = ['likes', 'has', 'sees', 'wants', 'finds', 'draws'];
export function writingRound(n, t, i) {
  return {
    title: `Writing practice ${i + 1}`,
    emoji: '📝',
    build: (r) => {
      const name = pick(r, t.names);
      const [noun, e] = pick(r, NOUNS);
      const sentence = n <= 4 ? `${noun}` : n <= 6 ? `${name} ${pick(r, VERBS)} a ${pick(r, ADJS)} ${noun}.` : `${name} ${pick(r, VERBS)} a ${pick(r, ADJS)} ${noun} at the ${t.place}.`;
      const spells = sample(r, NOUNS, 2).map(([word, emoji]) => ({ type: 'spell', word, emoji }));
      return [{ type: 'write', text: sentence, cursive: n >= 7 }, { type: 'spell', word: noun, emoji: e }, ...spells];
    },
  };
}
