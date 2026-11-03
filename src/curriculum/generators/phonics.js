import { pick, sample } from '../../lib/format';
import { choice, learn, objOptions, repeat, textOptions } from './helpers';

// Jolly Phonics-style groups.
export const SOUND_GROUPS = [
  ['s', 'a', 't', 'i', 'p', 'n'],
  ['c', 'k', 'e', 'h', 'r', 'm', 'd'],
  ['g', 'o', 'u', 'l', 'f', 'b'],
  ['ai', 'j', 'oa', 'ie', 'ee', 'or'],
  ['z', 'w', 'ng', 'v', 'oo'],
  ['y', 'x', 'ch', 'sh', 'th'],
  ['qu', 'ou', 'oi', 'ue', 'er', 'ar'],
];

const W = (label, emoji) => ({ label, emoji });
export const SOUND_WORDS = {
  s: [W('sun', '☀️'), W('snake', '🐍'), W('sock', '🧦')],
  a: [W('apple', '🍎'), W('ant', '🐜'), W('alligator', '🐊')],
  t: [W('tiger', '🐯'), W('tent', '⛺'), W('tomato', '🍅')],
  i: [W('insect', '🐛'), W('ink', '🖋️'), W('igloo', '🏠')],
  p: [W('pig', '🐷'), W('pen', '🖊️'), W('pizza', '🍕')],
  n: [W('nose', '👃'), W('nest', '🪺'), W('net', '🥅')],
  c: [W('cat', '🐱'), W('cup', '🥤'), W('car', '🚗')],
  k: [W('kite', '🪁'), W('key', '🔑'), W('king', '🤴')],
  e: [W('egg', '🥚'), W('elephant', '🐘'), W('elf', '🧝')],
  h: [W('hat', '🎩'), W('horse', '🐴'), W('house', '🏠')],
  r: [W('rabbit', '🐰'), W('rain', '🌧️'), W('robot', '🤖')],
  m: [W('moon', '🌙'), W('mouse', '🐭'), W('milk', '🥛')],
  d: [W('dog', '🐶'), W('duck', '🦆'), W('drum', '🥁')],
  g: [W('goat', '🐐'), W('gift', '🎁'), W('grapes', '🍇')],
  o: [W('octopus', '🐙'), W('ox', '🐂'), W('orange', '🍊')],
  u: [W('umbrella', '☂️'), W('up', '⬆️'), W('under', '⬇️')],
  l: [W('lion', '🦁'), W('leaf', '🍃'), W('lemon', '🍋')],
  f: [W('fish', '🐟'), W('frog', '🐸'), W('fire', '🔥')],
  b: [W('ball', '⚽'), W('bus', '🚌'), W('bear', '🐻')],
  ai: [W('rain', '🌧️'), W('snail', '🐌'), W('train', '🚆')],
  j: [W('jellyfish', '🪼'), W('juice', '🧃'), W('jet', '✈️')],
  oa: [W('boat', '⛵'), W('goat', '🐐'), W('coat', '🧥')],
  ie: [W('tie', '👔'), W('pie', '🥧'), W('magpie', '🐦')],
  ee: [W('tree', '🌳'), W('bee', '🐝'), W('sheep', '🐑')],
  or: [W('fork', '🍴'), W('corn', '🌽'), W('horse', '🐴')],
  z: [W('zebra', '🦓'), W('zoo', '🦒'), W('zip', '🤐')],
  w: [W('watch', '⌚'), W('web', '🕸️'), W('worm', '🪱')],
  ng: [W('ring', '💍'), W('king', '🤴'), W('wing', '🪽')],
  v: [W('van', '🚐'), W('violin', '🎻'), W('volcano', '🌋')],
  oo: [W('moon', '🌙'), W('spoon', '🥄'), W('book', '📖')],
  y: [W('yo-yo', '🪀'), W('yellow', '💛'), W('yawn', '🥱')],
  x: [W('box', '📦'), W('fox', '🦊'), W('six', '6️⃣')],
  ch: [W('chick', '🐥'), W('cheese', '🧀'), W('chair', '🪑')],
  sh: [W('shell', '🐚'), W('ship', '🚢'), W('shoe', '👟')],
  th: [W('thumb', '👍'), W('three', '3️⃣'), W('throne', '👑')],
  qu: [W('queen', '👸'), W('quilt', '🛏️'), W('question', '❓')],
  ou: [W('cloud', '☁️'), W('mouth', '👄'), W('house', '🏠')],
  oi: [W('coin', '🪙'), W('oil', '🛢️'), W('boil', '♨️')],
  ue: [W('glue', '🧴'), W('statue', '🗽'), W('blue', '🔵')],
  er: [W('letter', '✉️'), W('ladder', '🪜'), W('tiger', '🐯')],
  ar: [W('car', '🚗'), W('star', '⭐'), W('shark', '🦈')],
};
// Sounds heard at the start of a word (digraphs like ng/er/ue/oo/oi/ou appear inside words).
const START_SOUND = (g) => !['ng', 'er', 'ue', 'oo', 'oi', 'ou', 'ai', 'ie', 'ee', 'oa', 'or', 'ar', 'x'].includes(g);

export const CVC = [
  W('cat', '🐱'), W('dog', '🐶'), W('sun', '☀️'), W('pig', '🐷'), W('hat', '🎩'), W('bed', '🛏️'), W('bus', '🚌'), W('fox', '🦊'),
  W('hen', '🐔'), W('map', '🗺️'), W('pen', '🖊️'), W('cup', '🥤'), W('bat', '🦇'), W('jam', '🍯'), W('net', '🥅'), W('box', '📦'),
  W('mug', '☕'), W('log', '🪵'), W('rat', '🐀'), W('web', '🕸️'), W('van', '🚐'), W('pot', '🍲'), W('bag', '👜'), W('six', '6️⃣'),
];
const BLENDS = [
  W('frog', '🐸'), W('crab', '🦀'), W('star', '⭐'), W('snake', '🐍'), W('plane', '✈️'), W('flag', '🚩'), W('drum', '🥁'), W('tree', '🌳'),
  W('clock', '⏰'), W('glove', '🧤'), W('brush', '🖌️'), W('spoon', '🥄'), W('swan', '🦢'), W('snail', '🐌'), W('train', '🚆'), W('grapes', '🍇'),
  W('bread', '🍞'), W('globe', '🌍'), W('plug', '🔌'), W('sled', '🛷'),
];
const RHYMES = [
  ['cat', 'hat', 'bat', 'rat', 'mat'], ['dog', 'log', 'frog', 'jog'], ['sun', 'bun', 'run', 'fun'], ['pig', 'wig', 'dig', 'big'],
  ['bee', 'tree', 'three', 'key'], ['cake', 'snake', 'lake', 'bake'], ['moon', 'spoon', 'soon', 'noon'], ['star', 'car', 'jar', 'far'],
  ['bear', 'chair', 'pear', 'hair'], ['boat', 'goat', 'coat', 'float'], ['king', 'ring', 'sing', 'wing'], ['fox', 'box', 'socks'],
  ['ball', 'wall', 'tall', 'fall'], ['night', 'light', 'kite', 'bite'], ['bed', 'red', 'bread', 'head'],
];
const MAGIC_E = [['cap', 'cape'], ['kit', 'kite'], ['hop', 'hope'], ['cub', 'cube'], ['tap', 'tape'], ['pin', 'pine'], ['not', 'note'], ['can', 'cane'], ['rob', 'robe'], ['tub', 'tube'], ['hat', 'hate'], ['bit', 'bite'], ['mad', 'made'], ['rid', 'ride']];
const SYLLABLES = [['cat', 1], ['dog', 1], ['sun', 1], ['tiger', 2], ['rabbit', 2], ['monkey', 2], ['pencil', 2], ['elephant', 3], ['banana', 3], ['butterfly', 3], ['umbrella', 3], ['crocodile', 3], ['pineapple', 3], ['watermelon', 4], ['helicopter', 4], ['caterpillar', 4]];
const VOWEL_TEAMS = [
  ['ai', ['rain', 'snail', 'paint', 'tail']], ['ay', ['play', 'day', 'tray', 'clay']], ['ee', ['tree', 'feet', 'green', 'sheep']], ['ea', ['leaf', 'sea', 'read', 'beach']],
  ['oa', ['boat', 'coat', 'road', 'soap']], ['ow', ['snow', 'bowl', 'yellow', 'window']], ['igh', ['night', 'light', 'high', 'right']], ['oo', ['moon', 'food', 'pool', 'zoo']],
];

const allGraphemes = SOUND_GROUPS.flat();

/** Teach-then-test for a set of graphemes. */
function soundLesson(graphemes, r) {
  const steps = [];
  graphemes.forEach((g) => steps.push({ type: 'sound', grapheme: g, words: SOUND_WORDS[g] }));
  graphemes.forEach((g) => {
    const target = pick(r, SOUND_WORDS[g]);
    const others = allGraphemes.filter((x) => x !== g && START_SOUND(x)).flatMap((x) => SOUND_WORDS[x]);
    if (START_SOUND(g)) {
      steps.push(choice(`Which one starts with the "${g}" sound?`, objOptions(r, target, sample(r, others, 6), 3), { say: `Which one starts with the sound ${g}?`, sound: g }));
    } else {
      const has = target;
      const without = sample(r, others.filter((o) => !o.label.includes(g)), 6);
      steps.push(choice(`Which word has the "${g}" sound?`, objOptions(r, has, without, 3), { sound: g }));
    }
    steps.push(choice(`What sound do you hear in "${target.label}"?`, textOptions(r, g, sample(r, allGraphemes.filter((x) => x !== g && !target.label.includes(x)), 5), 3), { visual: { kind: 'emoji', items: [target.emoji], big: true, caption: target.label }, soundOptions: true, say: `${target.label}. What sound do you hear?` }));
  });
  return steps;
}

function reviewSounds(pool, r, n = 7) {
  return repeat(n, () => {
    const g = pick(r, pool.filter(START_SOUND));
    const w = pick(r, SOUND_WORDS[g]);
    return choice(`What sound does "${w.label}" start with?`, textOptions(r, g, sample(r, pool.filter((x) => x !== g && START_SOUND(x)), 5), 3), { visual: { kind: 'emoji', items: [w.emoji], big: true, caption: w.label }, soundOptions: true, say: `${w.label}. What sound does it start with?` });
  });
}

function blendLesson(words, r, n = 5) {
  const ws = sample(r, words, n);
  const steps = [];
  ws.forEach((w, i) => {
    if (i % 2 === 0) steps.push({ type: 'blend', word: w.label, emoji: w.emoji });
    steps.push(choice(`Sound it out: ${w.label.split('').join(' - ')}`, objOptions(r, w, sample(r, words, 6), 3), { say: `${w.label.split('').join(', ')}. What word is it?`, blendWord: w.label }));
  });
  steps.push({ type: 'spell', word: ws[0].label, emoji: ws[0].emoji });
  return steps;
}

function rhymeLesson(r, n = 6) {
  return repeat(n, () => {
    const set = pick(r, RHYMES);
    const [a, b] = sample(r, set, 2);
    const wrong = sample(r, RHYMES.filter((x) => x !== set).flat(), 4);
    return choice(`Which word rhymes with "${a}"?`, textOptions(r, b, wrong, 3), { say: `Which word rhymes with ${a}?`, sayOptions: true });
  });
}

function endSoundLesson(r, n = 6) {
  return repeat(n, () => {
    const w = pick(r, CVC);
    const last = w.label.at(-1);
    return choice(`What sound does "${w.label}" end with?`, textOptions(r, last, 'stpnmdgbx'.split('').filter((x) => x !== last), 3), { visual: { kind: 'emoji', items: [w.emoji], big: true, caption: w.label }, soundOptions: true });
  });
}

function magicELesson(r, n = 6) {
  const steps = [learn('Magic e', '🪄', 'When e sits at the end, it makes the vowel say its name: cap becomes cape!')];
  steps.push(...repeat(n, () => {
    const [short, long] = pick(r, MAGIC_E);
    const wrong = MAGIC_E.map((x) => x[1]).filter((x) => x !== long);
    return choice(`Add magic e to "${short}". What new word do you get?`, textOptions(r, long, wrong, 3), { sayOptions: true });
  }));
  return steps;
}

function syllableLesson(r, n = 6) {
  const steps = [learn('Clap the beats', '👏', 'Each beat in a word is a syllable. Ba-na-na has 3 beats!')];
  steps.push(...repeat(n, () => {
    const [w, c] = pick(r, SYLLABLES);
    return choice(`How many syllables (claps) in "${w}"?`, textOptions(r, String(c), ['1', '2', '3', '4'], 4), { say: `Clap and count the beats in ${w}` });
  }));
  return steps;
}

function vowelTeamLesson(teams, r, n = 6) {
  const steps = teams.map(([g, ws]) => learn(`"${g}" makes one sound`, g, `Listen: ${ws.join(', ')}`));
  steps.push(...repeat(n, () => {
    const [g, ws] = pick(r, teams);
    const w = pick(r, ws);
    const others = VOWEL_TEAMS.filter((x) => !w.includes(x[0])).map((x) => x[0]);
    return choice(`Which letters make the vowel sound in "${w}"?`, textOptions(r, g, others, 3), { say: w });
  }));
  return steps;
}

function blendSoundLesson(r, n = 6) {
  return repeat(n, () => {
    const w = pick(r, BLENDS);
    const start = w.label.slice(0, 2);
    const wrong = ['fr', 'cr', 'st', 'sn', 'pl', 'fl', 'dr', 'tr', 'cl', 'gl', 'br', 'sp', 'sw', 'gr', 'sl'].filter((x) => x !== start);
    return choice(`Which blend does "${w.label}" start with?`, textOptions(r, start, wrong, 3), { visual: { kind: 'emoji', items: [w.emoji], big: true, caption: w.label }, say: w.label });
  });
}

const T = (title, emoji, build) => ({ title, emoji, build });
const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));

export function phonicsTopics(n) {
  if (n === 2) {
    const g = SOUND_GROUPS.slice(0, 3).flat();
    return [
      ...chunk(g, 2).map((pair) => T(`Sounds ${pair.join(' & ')}`, pair[0], (r) => soundLesson(pair, r))),
      T('Sound check: group 1', '🎧', (r) => reviewSounds(SOUND_GROUPS[0], r)),
      T('Sound check: group 2', '🎧', (r) => reviewSounds(SOUND_GROUPS[1], r)),
      T('Sound check: group 3', '🎧', (r) => reviewSounds(SOUND_GROUPS[2], r)),
    ];
  }
  if (n === 3) {
    const g = SOUND_GROUPS.slice(3).flat();
    return [
      T('Revise s a t i p n', '🔁', (r) => reviewSounds(SOUND_GROUPS[0], r)),
      ...chunk(g, 2).map((pair) => T(`Sounds ${pair.join(' & ')}`, pair[0], (r) => soundLesson(pair, r))),
      T('First sounds mix', '🎧', (r) => reviewSounds(allGraphemes, r, 8)),
      T('Blend 3 sounds', '🧩', (r) => blendLesson(CVC.slice(0, 12), r, 4)),
    ];
  }
  if (n === 4)
    return [
      T('Blending CVC words 1', '🧩', (r) => blendLesson(CVC.slice(0, 12), r)),
      T('Blending CVC words 2', '🧩', (r) => blendLesson(CVC.slice(12), r)),
      T('Blending mix', '🧩', (r) => blendLesson(CVC, r, 6)),
      T('Rhyming words', '🎵', (r) => rhymeLesson(r)),
      T('End sounds', '🔚', (r) => endSoundLesson(r)),
      T('ch, sh, th', '🐥', (r) => soundLesson(['ch', 'sh', 'th'], r)),
      T('qu, ng, x', '👸', (r) => soundLesson(['qu', 'ng', 'x'], r)),
      T('Sound check', '🎧', (r) => reviewSounds(allGraphemes, r, 8)),
      T('More rhymes', '🎶', (r) => rhymeLesson(r, 7)),
    ];
  if (n === 5)
    return [
      T('Consonant blends', '🐸', (r) => blendSoundLesson(r)),
      T('Long a: ai, ay', '🌧️', (r) => vowelTeamLesson(VOWEL_TEAMS.slice(0, 2), r)),
      T('Long e: ee, ea', '🌳', (r) => vowelTeamLesson(VOWEL_TEAMS.slice(2, 4), r)),
      T('Long o: oa, ow', '⛵', (r) => vowelTeamLesson(VOWEL_TEAMS.slice(4, 6), r)),
      T('igh and oo', '🌙', (r) => vowelTeamLesson(VOWEL_TEAMS.slice(6), r)),
      T('Magic e', '🪄', (r) => magicELesson(r)),
      T('Rhyming', '🎵', (r) => rhymeLesson(r, 7)),
      T('Blending words', '🧩', (r) => blendLesson([...CVC, ...BLENDS.filter((b) => b.label.length <= 5)], r, 6)),
      T('or, ar, er', '⭐', (r) => soundLesson(['or', 'ar', 'er'], r)),
      T('ou, oi, ue', '☁️', (r) => soundLesson(['ou', 'oi', 'ue'], r)),
    ];
  return [
    T('Syllables', '👏', (r) => syllableLesson(r)),
    T('Vowel teams', '👯', (r) => vowelTeamLesson(VOWEL_TEAMS, r, 8)),
    T('Magic e words', '🪄', (r) => magicELesson(r, 8)),
    T('Blends challenge', '🐸', (r) => blendSoundLesson(r, 8)),
    T('Rhyme time', '🎵', (r) => rhymeLesson(r, 8)),
    T('More syllables', '🥁', (r) => syllableLesson(r, 8)),
    T('Spelling with sounds', '🔤', (r) => sample(r, [...CVC, ...BLENDS], 5).map((w) => ({ type: 'spell', word: w.label, emoji: w.emoji }))),
  ];
}

export { CVC as CVC_WORDS, BLENDS as BLEND_WORDS };
