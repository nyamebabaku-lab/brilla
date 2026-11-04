// Foundations: alphabet, vowels, word building and colour identification.
import { pick, sample, shuffle } from '../../lib/format';
import { choice, learn, objOptions, repeat, textOptions } from './helpers';

const UP = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const ALPHA_WORDS = {
  A: ['apple', '🍎'], B: ['ball', '⚽'], C: ['cat', '🐱'], D: ['dog', '🐶'], E: ['egg', '🥚'], F: ['fish', '🐟'], G: ['goat', '🐐'], H: ['hat', '🎩'], I: ['insect', '🐛'],
  J: ['jellyfish', '🪼'], K: ['kite', '🪁'], L: ['lion', '🦁'], M: ['mango', '🥭'], N: ['nest', '🪺'], O: ['orange', '🍊'], P: ['pig', '🐷'], Q: ['queen', '👸'], R: ['rabbit', '🐰'],
  S: ['sun', '☀️'], T: ['tiger', '🐯'], U: ['umbrella', '☂️'], V: ['van', '🚐'], W: ['watch', '⌚'], X: ['box', '📦'], Y: ['yo-yo', '🪀'], Z: ['zebra', '🦓'],
};
const VOWELS = ['a', 'e', 'i', 'o', 'u'];
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz'.split('');
const CVC = [['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['pig', '🐷'], ['hat', '🎩'], ['bed', '🛏️'], ['bus', '🚌'], ['fox', '🦊'], ['hen', '🐔'], ['map', '🗺️'], ['pen', '🖊️'], ['cup', '🥤'], ['net', '🥅'], ['box', '📦'], ['bag', '👜'], ['six', '6️⃣'], ['jam', '🍯'], ['log', '🪵'], ['web', '🕸️'], ['van', '🚐']];
const COMPOUND = [['sun', 'flower', '🌻'], ['foot', 'ball', '⚽'], ['rain', 'bow', '🌈'], ['tooth', 'brush', '🪥'], ['butter', 'fly', '🦋'], ['pan', 'cake', '🥞'], ['star', 'fish', '⭐'], ['bed', 'room', '🛏️'], ['class', 'room', '🏫'], ['home', 'work', '📝'], ['air', 'plane', '✈️'], ['snow', 'man', '⛄'], ['cup', 'cake', '🧁'], ['pine', 'apple', '🍍']];
const FAMILIES = { at: ['cat', 'hat', 'bat', 'mat', 'rat', 'sat'], an: ['can', 'fan', 'man', 'pan', 'van', 'ran'], ig: ['pig', 'big', 'dig', 'wig', 'fig'], op: ['hop', 'mop', 'top', 'pop', 'stop'], ug: ['bug', 'hug', 'mug', 'rug', 'jug'], en: ['hen', 'pen', 'ten', 'men', 'den'] };
const COLOUR_THINGS = {
  red: [['apple', '🍎'], ['strawberry', '🍓'], ['tomato', '🍅'], ['fire engine', '🚒']],
  yellow: [['banana', '🍌'], ['sun', '🌞'], ['chick', '🐥'], ['lemon', '🍋']],
  green: [['frog', '🐸'], ['leaf', '🍃'], ['cucumber', '🥒'], ['tree', '🌳']],
  blue: [['blueberries', '🫐'], ['whale', '🐳'], ['jeans', '👖'], ['blue heart', '💙']],
  orange: [['orange', '🍊'], ['carrot', '🥕'], ['pumpkin', '🎃'], ['tiger', '🐯']],
  purple: [['grapes', '🍇'], ['aubergine', '🍆'], ['purple heart', '💜'], ['umbrella', '☂️']],
  brown: [['bear', '🐻'], ['chocolate', '🍫'], ['tree trunk', '🪵'], ['horse', '🐴']],
  black: [['black cat', '🐈‍⬛'], ['spider', '🕷️'], ['black heart', '🖤'], ['gorilla', '🦍']],
};
const HEX = { red: '#ef4444', yellow: '#facc15', green: '#22c55e', blue: '#3b82f6', orange: '#f97316', purple: '#a855f7', brown: '#92400e', black: '#1f2937' };

// ---- question factories (each with an `explain` the instructor uses in worked examples) ----
const findLetter = (lower) => (r) => {
  const L = pick(r, UP);
  const l = lower ? L.toLowerCase() : L;
  const [w, e] = ALPHA_WORDS[L];
  const pool = (lower ? UP.map((x) => x.toLowerCase()) : UP).filter((x) => x !== l);
  return choice(`Find the letter ${l}`, textOptions(r, l, pool, 4), { bigText: true, say: `Find the letter ${L}`, explain: `${L} is for ${w} ${e}.` });
};
const letterAfter = (r) => {
  const i = Math.floor(r() * 25);
  return choice(`What letter comes after ${UP[i]}?`, textOptions(r, UP[i + 1], UP.filter((x) => x !== UP[i + 1] && x !== UP[i]), 3), { bigText: true, explain: `Sing the ABC: ${UP.slice(Math.max(0, i - 2), i + 2).join(', ')}. After ${UP[i]} comes ${UP[i + 1]}.` });
};
const letterBefore = (r) => {
  const i = 1 + Math.floor(r() * 25);
  return choice(`What letter comes before ${UP[i]}?`, textOptions(r, UP[i - 1], UP.filter((x) => x !== UP[i - 1] && x !== UP[i]), 3), { bigText: true, explain: `${UP.slice(Math.max(0, i - 3), i + 1).join(', ')}. Before ${UP[i]} comes ${UP[i - 1]}.` });
};
const matchCase = (r) => {
  const L = pick(r, UP);
  return choice(`Which small letter matches big ${L}?`, textOptions(r, L.toLowerCase(), UP.map((x) => x.toLowerCase()).filter((x) => x !== L.toLowerCase()), 4), { bigText: true, explain: `Big ${L} and small ${L.toLowerCase()} are the same letter.` });
};
const letterPicture = (r) => {
  const L = pick(r, UP.filter((x) => x !== 'X'));
  const [w, e] = ALPHA_WORDS[L];
  const others = UP.filter((x) => x !== L && x !== 'X').map((x) => ({ label: ALPHA_WORDS[x][0], emoji: ALPHA_WORDS[x][1] }));
  return choice(`Which picture starts with ${L}?`, objOptions(r, { label: w, emoji: e }, sample(r, others, 6), 3), { say: `Which picture starts with the letter ${L}?`, answerText: w, explain: `${w} starts with ${L}.` });
};
const isVowel = (r) => {
  const v = r() < 0.5;
  const l = v ? pick(r, VOWELS) : pick(r, CONSONANTS);
  return choice(`Is "${l}" a vowel?`, { options: [{ label: 'Yes, a vowel' }, { label: 'No' }], answer: v ? 0 : 1 }, { say: `Is the letter ${l} a vowel?`, explain: 'The vowels are a, e, i, o and u.' });
};
const findVowel = (r) => {
  const v = pick(r, VOWELS);
  return choice('Which letter is a vowel?', textOptions(r, v, CONSONANTS, 4), { bigText: true, explain: `${v} is a vowel. The vowels are a, e, i, o, u.` });
};
const missingVowel = (r) => {
  const [w, e] = pick(r, CVC);
  return choice(`Which vowel is missing? ${w[0]} _ ${w[2]}`, textOptions(r, w[1], VOWELS, 3), { visual: { kind: 'emoji', items: [e], big: true }, bigText: true, say: `Which vowel is missing from ${w}?`, explain: `${w[0]}, ${w[1]}, ${w[2]} makes ${w}.` });
};
const vowelSort = (r) => {
  const vs = sample(r, VOWELS, 3);
  const cs = sample(r, CONSONANTS, 3);
  return { type: 'sort', prompt: 'Vowel or consonant?', bins: [{ label: 'Vowel', emoji: '🅰️' }, { label: 'Consonant', emoji: '🅱️' }], items: shuffle(r, [...vs.map((l) => ({ label: l, bin: 0 })), ...cs.map((l) => ({ label: l, bin: 1 }))]) };
};
const compound = (r) => {
  const [a, b, e] = pick(r, COMPOUND);
  const wrong = COMPOUND.filter((x) => x[0] !== a).map((x) => `${a}${x[1]}`);
  return choice(`${a} + ${b} = ?`, textOptions(r, `${a}${b}`, wrong, 3), { visual: { kind: 'emoji', items: [e], big: true }, say: `Join ${a} and ${b}. What new word do we make?`, explain: `Put ${a} and ${b} together to make ${a}${b}.` });
};
const changeLetter = (r) => {
  const fam = pick(r, Object.keys(FAMILIES));
  const [w1, w2] = sample(r, FAMILIES[fam], 2);
  const wrong = Object.values(FAMILIES).flat().filter((x) => !x.endsWith(fam));
  return choice(`Change "${w1[0]}" in "${w1}" to "${w2[0]}". What word is it?`, textOptions(r, w2, wrong, 3), { explain: `${w1} becomes ${w2}. Only the first sound changes.` });
};
const wordFamily = (r) => {
  const fam = pick(r, Object.keys(FAMILIES));
  const w = pick(r, FAMILIES[fam]);
  const wrong = Object.entries(FAMILIES).filter(([f]) => f !== fam).flatMap(([, v]) => v);
  return choice(`Which word is in the -${fam} family?`, textOptions(r, w, wrong, 3), { explain: `${w} ends with ${fam}, like ${FAMILIES[fam].filter((x) => x !== w).slice(0, 2).join(' and ')}.` });
};
const buildWord = (r) => {
  const [w, e] = pick(r, CVC);
  return { type: 'spell', word: w, emoji: e };
};
const findColour = (r) => {
  const c = pick(r, Object.keys(COLOUR_THINGS));
  const [label, emoji] = pick(r, COLOUR_THINGS[c]);
  const others = Object.entries(COLOUR_THINGS).filter(([k]) => k !== c).flatMap(([, v]) => v).map(([l, e]) => ({ label: l, emoji: e }));
  return choice(`Find something ${c.toUpperCase()}`, objOptions(r, { label, emoji }, sample(r, others, 6), 3), { emojiOnly: true, say: `Find something ${c}`, answerText: `the ${label}`, explain: `The ${label} is ${c}.` });
};
const colourOf = (r) => {
  const c = pick(r, Object.keys(COLOUR_THINGS));
  const [label, emoji] = pick(r, COLOUR_THINGS[c]);
  return choice(`What colour is the ${label}?`, textOptions(r, c, Object.keys(COLOUR_THINGS), 3), { visual: { kind: 'emoji', items: [emoji], big: true }, explain: `A ${label} is ${c}.` });
};
const colourSwatch = (r) => {
  const c = pick(r, Object.keys(HEX));
  return choice('What colour is this?', textOptions(r, c, Object.keys(HEX), 3), { visual: { kind: 'color', hex: HEX[c] }, explain: `This colour is ${c}, like a ${COLOUR_THINGS[c][0][0]}.` });
};

const Q = (title, emoji, q, n, intro) => ({ title, emoji, build: (r) => [...(intro ? [learn(...intro)] : []), ...repeat(n, () => q(r))] });
const ALPHA_INTRO = ['The alphabet', '🔤', 'There are 26 letters: A B C D E F G H I J K L M N O P Q R S T U V W X Y Z'];
const VOWEL_INTRO = ['Vowels', '🅰️', 'Five special letters are vowels: a, e, i, o, u. Every word needs one!'];
const COLOUR_INTRO = ['Colours', '🌈', 'Red, orange, yellow, green, blue and purple are the rainbow colours.'];

export const BASICS = {
  alphabetNames: Q('Letter names A–Z', '🔤', findLetter(false), 6, ALPHA_INTRO),
  smallLetters: Q('Small letters a–z', '🔡', findLetter(true), 6),
  abcOrder: Q('ABC order', '🎶', (r) => (r() < 0.5 ? letterAfter(r) : letterBefore(r)), 6, ALPHA_INTRO),
  bigSmall: Q('Big and small letters', '🔠', matchCase, 6),
  letterPictures: Q('Letters and pictures', '🖼️', letterPicture, 6),
  vowels: Q('Vowels a e i o u', '🅰️', (r) => (r() < 0.5 ? findVowel(r) : isVowel(r)), 6, VOWEL_INTRO),
  missingVowel: Q('Missing vowels', '❓', missingVowel, 6, VOWEL_INTRO),
  vowelSort: { title: 'Vowels and consonants', emoji: '🗂️', build: (r) => [learn(...VOWEL_INTRO), vowelSort(r), ...repeat(4, () => missingVowel(r))] },
  buildWords: { title: 'Build words', emoji: '🧱', build: (r) => [learn('Building words', '🧱', 'Put sounds together to build a word: c + a + t = cat'), ...repeat(4, () => buildWord(r))] },
  compound: Q('Joining words', '➕', compound, 6, ['Compound words', '🌻', 'Two small words can join to make a new word: sun + flower = sunflower']),
  changeLetter: Q('Change a letter', '🔄', changeLetter, 6),
  wordFamilies: Q('Word families', '👪', wordFamily, 6, ['Word families', '👪', 'Words that end the same are a family: cat, hat, mat']),
  findColour: Q('Find the colour', '🎨', findColour, 6, COLOUR_INTRO),
  colourOf: Q('What colour is it?', '🖍️', colourOf, 6, COLOUR_INTRO),
  colourSwatch: Q('Colour names', '🌈', colourSwatch, 6, COLOUR_INTRO),
};
