import { pick, sample, shuffle } from '../../lib/format';
import { choice, learn, objOptions, repeat, textOptions } from './helpers';

const W = (label, emoji) => ({ label, emoji });
const VOCAB = {
  animals: [W('lion', '🦁'), W('elephant', '🐘'), W('monkey', '🐒'), W('zebra', '🦓'), W('giraffe', '🦒'), W('crocodile', '🐊'), W('snake', '🐍'), W('tortoise', '🐢'), W('parrot', '🦜'), W('goat', '🐐'), W('chicken', '🐔'), W('cow', '🐄')],
  fruits: [W('mango', '🥭'), W('banana', '🍌'), W('orange', '🍊'), W('pineapple', '🍍'), W('watermelon', '🍉'), W('apple', '🍎'), W('grapes', '🍇'), W('coconut', '🥥'), W('lemon', '🍋'), W('avocado', '🥑')],
  body: [W('eye', '👁️'), W('ear', '👂'), W('nose', '👃'), W('mouth', '👄'), W('hand', '✋'), W('foot', '🦶'), W('leg', '🦵'), W('tooth', '🦷'), W('brain', '🧠'), W('arm', '💪')],
  home: [W('bed', '🛏️'), W('chair', '🪑'), W('door', '🚪'), W('cup', '🥤'), W('spoon', '🥄'), W('broom', '🧹'), W('bucket', '🪣'), W('clock', '⏰'), W('lamp', '💡'), W('key', '🔑')],
  transport: [W('car', '🚗'), W('bus', '🚌'), W('bicycle', '🚲'), W('aeroplane', '✈️'), W('boat', '⛵'), W('train', '🚆'), W('lorry', '🚚'), W('motorbike', '🏍️'), W('taxi', '🚕'), W('helicopter', '🚁')],
  jobs: [W('doctor', '🧑‍⚕️'), W('teacher', '🧑‍🏫'), W('farmer', '🧑‍🌾'), W('cook', '🧑‍🍳'), W('police officer', '👮'), W('firefighter', '🧑‍🚒'), W('pilot', '🧑‍✈️'), W('nurse', '👩‍⚕️'), W('mechanic', '🧑‍🔧'), W('artist', '🧑‍🎨')],
  family: [W('mother', '👩'), W('father', '👨'), W('baby', '👶'), W('grandmother', '👵'), W('grandfather', '👴'), W('sister', '👧'), W('brother', '👦')],
};
const SIGHT = [
  ['the', 'a', 'I', 'is', 'to', 'and', 'in', 'it', 'my', 'we'],
  ['he', 'she', 'you', 'are', 'was', 'they', 'said', 'have', 'like', 'go'],
  ['come', 'some', 'what', 'there', 'when', 'where', 'were', 'one', 'two', 'out'],
];
const OPPOSITES = [['big', 'small'], ['hot', 'cold'], ['up', 'down'], ['happy', 'sad'], ['fast', 'slow'], ['old', 'new'], ['open', 'closed'], ['day', 'night'], ['tall', 'short'], ['wet', 'dry'], ['full', 'empty'], ['in', 'out'], ['light', 'dark'], ['clean', 'dirty'], ['early', 'late'], ['loud', 'quiet']];
const SYNONYMS = [['big', 'large'], ['small', 'tiny'], ['happy', 'glad'], ['fast', 'quick'], ['begin', 'start'], ['shut', 'close'], ['afraid', 'scared'], ['shout', 'yell'], ['look', 'see'], ['easy', 'simple'], ['finish', 'end'], ['gift', 'present'], ['smart', 'clever'], ['angry', 'cross'], ['rich', 'wealthy'], ['brave', 'bold']];
const PLURALS = [['cat', 'cats'], ['dog', 'dogs'], ['box', 'boxes'], ['bus', 'buses'], ['baby', 'babies'], ['child', 'children'], ['mouse', 'mice'], ['tooth', 'teeth'], ['foot', 'feet'], ['man', 'men'], ['leaf', 'leaves'], ['knife', 'knives'], ['sheep', 'sheep'], ['church', 'churches'], ['lady', 'ladies'], ['woman', 'women']];
const PAST = [['jump', 'jumped'], ['play', 'played'], ['walk', 'walked'], ['go', 'went'], ['eat', 'ate'], ['see', 'saw'], ['run', 'ran'], ['swim', 'swam'], ['write', 'wrote'], ['sing', 'sang'], ['take', 'took'], ['buy', 'bought'], ['think', 'thought'], ['catch', 'caught'], ['teach', 'taught'], ['drink', 'drank']];
const NOUNS = ['school', 'teacher', 'ball', 'river', 'book', 'mango', 'house', 'tree', 'pencil', 'market', 'goat', 'phone'];
const VERBS = ['run', 'jump', 'sing', 'write', 'swim', 'dance', 'read', 'cook', 'climb', 'sweep', 'play', 'eat'];
const ADJS = ['tall', 'red', 'happy', 'soft', 'noisy', 'sweet', 'tiny', 'shiny', 'cold', 'brave', 'beautiful', 'heavy'];
const ADVS = ['quickly', 'slowly', 'loudly', 'quietly', 'happily', 'carefully', 'badly', 'neatly'];
const PREPS = [['The cat is ___ the table.', 'under', '🐱'], ['The bird is ___ the tree.', 'in', '🐦'], ['The book is ___ the bag.', 'in', '🎒'], ['The cup is ___ the table.', 'on', '☕'], ['She walked ___ the bridge.', 'across', '🌉'], ['The ball rolled ___ the hill.', 'down', '⚽'], ['He sat ___ his friends.', 'between', '🧑‍🤝‍🧑'], ['The plane flew ___ the clouds.', 'above', '✈️']];
const HOMOPHONES = [['I can ___ the sea from here.', 'see', ['sea']], ['She has ___ pencils.', 'two', ['to', 'too']], ['The wind ___ the leaves.', 'blew', ['blue']], ['I ___ the answer.', 'know', ['no']], ['We ate the whole ___ of bread.', 'piece', ['peace']], ['They put ___ bags down.', 'their', ['there', "they're"]], ['The ___ is shining.', 'sun', ['son']], ['I would like a ___ of shoes.', 'pair', ['pear']]];
const CONTRACTIONS = [['do not', "don't"], ['can not', "can't"], ['I am', "I'm"], ['it is', "it's"], ['we are', "we're"], ['they are', "they're"], ['she is', "she's"], ['will not', "won't"], ['I have', "I've"], ['you are', "you're"]];
const COLLECTIVE = [['a ___ of fish', 'school'], ['a ___ of cows', 'herd'], ['a ___ of birds', 'flock'], ['a ___ of bees', 'swarm'], ['a ___ of lions', 'pride'], ['a ___ of wolves', 'pack'], ['a ___ of sheep', 'flock'], ['a ___ of puppies', 'litter']];
const SIMILES = [['as brave as a ___', 'lion'], ['as busy as a ___', 'bee'], ['as slow as a ___', 'tortoise'], ['as white as ___', 'snow'], ['as cold as ___', 'ice'], ['as light as a ___', 'feather'], ['as sly as a ___', 'fox'], ['as tall as a ___', 'giraffe']];
const CONJ = [['I was hungry, ___ I ate some food.', 'so'], ['I like tea ___ I do not like coffee.', 'but'], ['We stayed inside ___ it was raining.', 'because'], ['Do you want rice ___ beans?', 'or'], ['She sang ___ danced.', 'and'], ['He was tired ___ he kept working.', 'but']];
const PROVERBS_GES = [['"One finger cannot lift a stone." What does it teach?', 'We should work together', ['Stones are heavy', 'Fingers are weak', 'Do not touch stones']], ['"When a fowl drinks water, it shows it to God." It teaches us to be…', 'thankful', ['hungry', 'thirsty', 'quiet']], ['"The ruin of a nation begins in the homes of its people." It means…', 'good homes build a good nation', ['houses fall down', 'nations are old', 'stay at home']], ['"Wisdom is like a baobab tree; no one person can embrace it." It means…', 'no one knows everything', ['trees are big', 'hug trees', 'baobabs are wise']]];
const PROVERBS_INTL = [['"Practice makes perfect." It means…', 'doing something often makes you better', ['never practise', 'perfect people never try', 'stop after one try']], ['"Don\'t judge a book by its cover." It means…', 'don\'t judge by looks alone', ['read every book', 'covers are bad', 'books are heavy']], ['"Look before you leap." It means…', 'think before you act', ['jump high', 'always look down', 'never jump']], ['"Many hands make light work." It means…', 'working together makes jobs easier', ['hands are light', 'work alone', 'lights need hands']]];
const PASSIVE = [['The dog chased the cat.', 'The cat was chased by the dog.'], ['Ama wrote a letter.', 'A letter was written by Ama.'], ['The boy kicked the ball.', 'The ball was kicked by the boy.'], ['The farmer planted the seeds.', 'The seeds were planted by the farmer.'], ['The teacher marked the books.', 'The books were marked by the teacher.']];
const REPORTED = [['"I am tired," said Kofi.', 'Kofi said that he was tired.'], ['"We are going home," they said.', 'They said that they were going home.'], ['"I like mangoes," said Esi.', 'Esi said that she liked mangoes.']];

/** Reading passages; {n} = names, {food}, {place}, {town}, {sport}. */
const PASSAGES = [
  {
    lv: [5, 6],
    text: '{n0} has a red ball. {n0} plays with the ball in the garden. The ball rolls under a tree. {n1} helps {n0} find it.',
    qs: [['What colour is the ball?', 'red', ['blue', 'green', 'yellow']], ['Where does the ball roll?', 'under a tree', ['into the river', 'on the bed', 'to school']], ['Who helps find the ball?', '{n1}', ['{n2}', 'the teacher', 'a dog']]],
  },
  {
    lv: [5, 6],
    text: 'It is Saturday. {n0} goes to the {place} with Mum. They buy {food} and bread. {n0} carries the small bag home.',
    qs: [['What day is it?', 'Saturday', ['Monday', 'Sunday', 'Friday']], ['What do they buy?', '{food} and bread', ['shoes', 'books', 'toys']], ['What does {n0} carry?', 'the small bag', ['the big bag', 'a box', 'a chair']]],
  },
  {
    lv: [6, 7],
    text: '{n0} wakes up early every morning. First, {n0} brushes their teeth. Then they eat breakfast and walk to school with {n1}. Their teacher is always happy to see them.',
    qs: [['When does {n0} wake up?', 'early', ['late', 'at noon', 'at night']], ['What does {n0} do first?', 'brushes their teeth', ['eats breakfast', 'walks to school', 'goes to sleep']], ['Who walks with {n0}?', '{n1}', ['{n2}', 'the teacher', 'nobody']]],
  },
  {
    lv: [7, 8],
    text: 'The tortoise wanted to keep all the wisdom of the world for himself. He put it in a pot and tried to climb a tall tree. The pot kept slipping. His son said, "Tie the pot to your back!" The tortoise realised he did not have all the wisdom after all.',
    qs: [['What did the tortoise want to keep?', 'all the wisdom', ['all the food', 'all the gold', 'all the water']], ['Where did he try to hide it?', 'up a tall tree', ['under a rock', 'in a river', 'in a cave']], ['What is the lesson of the story?', 'nobody knows everything', ['tortoises can climb', 'pots are heavy', 'trees are tall']]],
  },
  {
    lv: [7, 8, 9],
    text: 'In {town}, the children planted a school garden. They grew tomatoes, peppers and okra. Every morning, {n0} watered the plants while {n1} pulled out weeds. After two months, they shared the vegetables with their families.',
    qs: [['Where was the garden?', 'at school', ['at the hospital', 'at the market', 'at the beach']], ['What did {n1} do?', 'pulled out weeds', ['watered the plants', 'sold vegetables', 'cooked food']], ['How long before the vegetables were ready?', 'two months', ['two days', 'one week', 'one year']]],
  },
  {
    lv: [8, 9, 10],
    text: 'Plastic waste is a big problem in many towns. When plastic is thrown into gutters, it blocks the water, and this can cause floods. {n0}\'s class started a recycling club. They collect bottles every Friday and send them to a factory that turns them into new products.',
    qs: [['What can blocked gutters cause?', 'floods', ['fires', 'earthquakes', 'droughts']], ['What did the class start?', 'a recycling club', ['a football team', 'a choir', 'a farm']], ['When do they collect bottles?', 'every Friday', ['every Monday', 'once a year', 'every hour']], ['What is the main idea?', 'reducing plastic waste helps our towns', ['plastic is beautiful', 'factories are big', 'Friday is the best day']]],
  },
  {
    lv: [9, 10],
    text: 'Dr. {n0} grew up in a small village with no hospital. As a child, she walked many kilometres to see a nurse. She promised herself that she would become a doctor. After years of hard work, she returned and opened the village\'s first clinic, which now treats hundreds of people every month.',
    qs: [['Why did she walk many kilometres?', 'to see a nurse', ['to go to school', 'to visit friends', 'to buy food']], ['What did she open?', 'a clinic', ['a school', 'a shop', 'a farm']], ['Which word best describes her?', 'determined', ['lazy', 'careless', 'afraid']], ['What does "returned" mean?', 'came back', ['ran away', 'stayed', 'forgot']]],
  },
  {
    lv: [9, 10],
    text: 'The {sport} final was tied at the last minute. {n0}, the youngest player, had never scored in a big match. The coach looked at her and nodded. She took a deep breath, ran forward and kicked the ball into the top corner. The crowd erupted with joy.',
    qs: [['What was the score near the end?', 'tied', ['3 to 0', 'they were losing badly', 'no one knows']], ['Why was the goal special?', 'she had never scored in a big match', ['she was the oldest', 'it was her 100th goal', 'it was an own goal']], ['"The crowd erupted with joy" means the crowd…', 'cheered loudly', ['left quietly', 'became angry', 'fell asleep']]],
  },
];

function fill(str, ctx) {
  return str.replace(/\{n(\d)\}/g, (_, i) => ctx.names[i]).replace('{food}', ctx.food).replace('{place}', ctx.place).replace('{town}', ctx.town).replace('{sport}', ctx.sport);
}
function passageLesson(r, t, n) {
  const pool = PASSAGES.filter((p) => p.lv.includes(n));
  const p = pick(r, pool.length ? pool : PASSAGES);
  const ctx = { names: sample(r, t.names, 3), food: pick(r, t.foods).name, place: t.place, town: t.town, sport: t.sport };
  const text = fill(p.text, ctx);
  return [
    { type: 'read', text, say: text },
    ...p.qs.map(([q, a, w]) => choice(fill(q, ctx), textOptions(r, fill(a, ctx), w.map((x) => fill(x, ctx)), 4), { passage: text })),
  ];
}

const vocab = (cat) => (r) => {
  const w = pick(r, VOCAB[cat]);
  return r() < 0.5
    ? choice('What is this?', textOptions(r, w.label, VOCAB[cat].map((x) => x.label), 3), { visual: { kind: 'emoji', items: [w.emoji], big: true }, sayOptions: true })
    : choice(`Find the ${w.label}`, objOptions(r, w, VOCAB[cat], 3), { emojiOnly: true });
};
const sight = (set) => (r) => {
  const w = pick(r, SIGHT[set]);
  return choice(`Tap the word "${w}"`, textOptions(r, w, SIGHT.flat(), 4), { say: `Find the word: ${w}`, bigText: true });
};
const opposite = (r) => {
  const [a, b] = shuffle(r, pick(r, OPPOSITES));
  return choice(`What is the opposite of "${a}"?`, textOptions(r, b, OPPOSITES.flat().filter((x) => x !== a), 4));
};
const synonym = (r) => {
  const [a, b] = shuffle(r, pick(r, SYNONYMS));
  return choice(`Which word means the same as "${a}"?`, textOptions(r, b, SYNONYMS.flat().filter((x) => x !== a), 4));
};
const plural = (easy) => (r) => {
  const pool = easy ? PLURALS.slice(0, 5) : PLURALS;
  const [s, p] = pick(r, pool);
  const wrong = [`${s}s`, `${s}es`, `${s}ies`, `${s}en`].filter((x) => x !== p);
  return choice(`One ${s}, two …?`, textOptions(r, p, wrong, 3));
};
const past = (irregular) => (r) => {
  const pool = irregular ? PAST.slice(3) : PAST.slice(0, 3).concat(PAST.slice(3, 6));
  const [v, p] = pick(r, pool);
  const n = pick(r, ['Yesterday I', 'Last week we', 'Yesterday they']);
  return choice(`${n} ___ (${v}).`, textOptions(r, p, [`${v}ed`, `${v}s`, `${v}ing`, PAST.find((x) => x[0] !== v)[1]].filter((x) => x !== p), 3));
};
const aOrAn = (r) => {
  const w = pick(r, ['apple', 'egg', 'orange', 'umbrella', 'ant', 'owl', 'ball', 'cat', 'dog', 'house', 'banana', 'igloo', 'elephant', 'book']);
  return choice(`___ ${w}`, { options: [{ label: 'a' }, { label: 'an' }], answer: 'aeiou'.includes(w[0]) ? 1 : 0 }, { say: `Do we say a, or an, ${w}?` });
};
const wordClass = (kind) => (r) => {
  const map = { noun: NOUNS, verb: VERBS, adjective: ADJS, adverb: ADVS };
  const right = pick(r, map[kind]);
  const wrong = Object.entries(map).filter(([k]) => k !== kind).flatMap(([, v]) => v);
  const what = { noun: 'a naming word (noun)', verb: 'an action word (verb)', adjective: 'a describing word (adjective)', adverb: 'a word that tells how (adverb)' }[kind];
  return choice(`Which word is ${what}?`, textOptions(r, right, wrong, 4));
};
const capital = (r) => {
  const names = ['ghana', 'monday', 'accra', 'kofi', 'january', 'africa', 'london', 'ama'];
  const w = pick(r, names);
  const right = w[0].toUpperCase() + w.slice(1);
  return choice(`Which is written correctly?`, textOptions(r, right, [w, w.toUpperCase().slice(0, 1).toLowerCase() + w.slice(1).toUpperCase(), w.slice(0, -1) + w.at(-1).toUpperCase()], 3));
};
const punctuation = (r) => {
  const q = pick(r, [['Where are you going', '?'], ['I like to read', '.'], ['Watch out', '!'], ['What is your name', '?'], ['We went to the park', '.'], ['Wow, that is amazing', '!'], ['How old are you', '?']]);
  return choice(`Which mark ends this sentence? "${q[0]}…"`, { options: [{ label: '.' }, { label: '?' }, { label: '!' }], answer: ['.', '?', '!'].indexOf(q[1]) }, { bigText: true });
};
const sentenceOrder = (r) => {
  const s = pick(r, ['The cat is on the mat', 'I can see a bird', 'We go to school', 'My dog likes to run', 'She has a red bag', 'The sun is hot']);
  const words = s.split(' ');
  const wrong = [shuffle(r, words).join(' '), [...words].reverse().join(' '), [words[1], words[0], ...words.slice(2)].join(' ')];
  return choice('Which sentence is in the right order?', textOptions(r, s, wrong.filter((w) => w !== s), 3));
};
const pronoun = (r) => {
  const [s, p] = pick(r, [['Ama is my friend. ___ is kind.', 'She'], ['Kofi plays football. ___ is fast.', 'He'], ['The boys are here. ___ are hungry.', 'They'], ['My sister and I like music. ___ sing every day.', 'We'], ['The book is on the table. ___ is new.', 'It']]);
  return choice(s, textOptions(r, p, ['She', 'He', 'They', 'We', 'It'], 4));
};
const fromTable = (table, prompt, extraWrong = []) => (r) => {
  const [q, a, emoji] = pick(r, table);
  const wrong = [...new Set([...table.map((x) => x[1]), ...extraWrong])].filter((x) => x !== a);
  return choice(prompt ? prompt(q) : q, textOptions(r, a, wrong, 4), typeof emoji === 'string' ? { visual: { kind: 'emoji', items: [emoji], big: true } } : {});
};
const homophone = (r) => {
  const [s, a, w] = pick(r, HOMOPHONES);
  return choice(s, textOptions(r, a, w, Math.min(4, w.length + 1)));
};
const contraction = (r) => {
  const [l, s] = pick(r, CONTRACTIONS);
  return choice(`Shorten "${l}"`, textOptions(r, s, CONTRACTIONS.map((x) => x[1]), 4));
};
const alphaOrder = (r) => {
  const ws = sample(r, ['apple', 'banana', 'cat', 'dog', 'egg', 'fish', 'goat', 'hat', 'ink', 'jam', 'kite', 'lion', 'moon'], 3);
  const right = [...ws].sort().join(', ');
  return choice('Which list is in ABC order?', textOptions(r, right, [ws.join(', '), [...ws].sort().reverse().join(', '), shuffle(r, ws).join(', ')].filter((x) => x !== right), 3));
};
const prefix = (r) => {
  const [w, p] = pick(r, [['happy', 'un'], ['kind', 'un'], ['tidy', 'un'], ['agree', 'dis'], ['like', 'dis'], ['possible', 'im'], ['correct', 'in'], ['legal', 'il'], ['write', 're'], ['visible', 'in']]);
  return choice(`Which prefix makes the opposite of "${w}"?`, textOptions(r, p, ['un', 'dis', 'im', 'in', 'il', 're', 'pre'], 4));
};
const suffix = (r) => {
  const [w, a] = pick(r, [['help', 'helpful'], ['care', 'careless'], ['kind', 'kindness'], ['quick', 'quickly'], ['teach', 'teacher'], ['enjoy', 'enjoyment'], ['hope', 'hopeful']]);
  return choice(`Add a suffix to "${w}". Which word is correct?`, textOptions(r, a, [`${w}ful`, `${w}less`, `${w}ness`, `${w}ly`, `${w}er`].filter((x) => x !== a), 4));
};
const compareAdj = (r) => {
  const [b, c, s] = pick(r, [['tall', 'taller', 'tallest'], ['big', 'bigger', 'biggest'], ['happy', 'happier', 'happiest'], ['good', 'better', 'best'], ['bad', 'worse', 'worst'], ['fast', 'faster', 'fastest']]);
  const most = r() < 0.5;
  return choice(most ? `Kofi is the ___ in the class. (${b})` : `An elephant is ___ than a goat. (${b})`, textOptions(r, most ? s : c, [b, c, s, `more ${b}`].filter((x) => x !== (most ? s : c)), 3));
};
const subjectVerb = (r) => {
  const [s, a, w] = pick(r, [['The children ___ playing.', 'are', 'is'], ['She ___ to school every day.', 'goes', 'go'], ['The dogs ___ loudly.', 'bark', 'barks'], ['My father ___ a car.', 'drives', 'drive'], ['We ___ happy.', 'are', 'is'], ['He ___ his homework.', 'does', 'do']]);
  return choice(s, { options: shuffle(r, [{ label: a }, { label: w }]).map((o) => o), answer: undefined, _a: a }, {});
};
const tense = (r) => {
  const [s, a] = pick(r, [['I will eat rice tomorrow.', 'future'], ['She is reading a book.', 'present'], ['They played football yesterday.', 'past'], ['We are singing now.', 'present'], ['He went to Accra last week.', 'past'], ['I shall visit you next year.', 'future']]);
  return choice(`What tense is this? "${s}"`, { options: [{ label: 'past' }, { label: 'present' }, { label: 'future' }], answer: ['past', 'present', 'future'].indexOf(a) });
};
const passive = (r) => {
  const [a, p] = pick(r, PASSIVE);
  const other = PASSIVE.filter((x) => x[0] !== a).map((x) => x[1]);
  return choice(`Change to passive: "${a}"`, textOptions(r, p, other, 3));
};
const reported = (r) => {
  const [d, rp] = pick(r, REPORTED);
  return choice(`Which is the reported speech for: ${d}`, textOptions(r, rp, REPORTED.map((x) => x[1]), 3));
};
const simile = (r) => {
  const [q, a] = pick(r, SIMILES);
  return choice(`Complete the simile: ${q}`, textOptions(r, a, SIMILES.map((x) => x[1]), 4));
};
const proverb = (t) => (r) => {
  const [q, a, w] = pick(r, t.id === 'ges' ? PROVERBS_GES : PROVERBS_INTL);
  return choice(q, textOptions(r, a, w, 4));
};
const days = (r) => {
  const D = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const i = Math.floor(r() * 6);
  return choice(`What day comes after ${D[i]}?`, textOptions(r, D[i + 1], D.filter((d, j) => j !== i + 1), 3));
};
const months = (r) => {
  const M = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const i = Math.floor(r() * 11);
  return choice(`What month comes after ${M[i]}?`, textOptions(r, M[i + 1], M.filter((d, j) => j !== i + 1), 3));
};
const position = (r) => {
  const [q, a, e] = pick(r, [['Where is the cat? (on the box)', 'on', '🐱📦'], ['Where is the ball? (in the box)', 'in', '⚽📦'], ['Where is the dog? (under the table)', 'under', '🐶'], ['Where is the bird? (above the tree)', 'above', '🐦🌳'], ['Where is the car? (behind the house)', 'behind', '🏠🚗']]);
  return choice(q.replace(/\(.*\)/, '').trim(), textOptions(r, a, ['on', 'in', 'under', 'above', 'behind'], 3), { visual: { kind: 'emoji', items: [e], big: true, caption: q.match(/\((.*)\)/)[1] }, sayOptions: true });
};

const Q = (title, emoji, q, n = 7, intro) => ({ title, emoji, q, n, intro });
const B = (title, emoji, build) => ({ title, emoji, build });

export function englishTopics(n, t) {
  const L = {
    3: [Q('Animals', '🦁', vocab('animals'), 6), Q('Fruits', '🥭', vocab('fruits'), 6), Q('My body', '👂', vocab('body'), 6), Q('My family', '👪', vocab('family'), 6), Q('Sight words 1', '👀', sight(0), 6), Q('Opposites', '↔️', opposite, 6), Q('At home', '🏠', vocab('home'), 6), Q('Where is it?', '📦', position, 5), Q('Getting around', '🚌', vocab('transport'), 6)],
    4: [Q('Sight words 1', '👀', sight(0)), Q('Sight words 2', '👀', sight(1)), Q('a or an?', '🅰️', aOrAn), Q('One or many', '🐱', plural(true)), Q('Opposites', '↔️', opposite), Q('People who help us', '🧑‍⚕️', vocab('jobs'), 6), Q('Where is it?', '📦', position, 5), Q('Transport', '🚌', vocab('transport')), Q('Days of the week', '📅', days), B('My first story', '📖', (r) => passageLesson(r, t, 5))],
    5: [Q('Naming words', '🏷️', wordClass('noun')), Q('Action words', '🏃', wordClass('verb')), Q('Describing words', '🌈', wordClass('adjective')), Q('Capital letters', '🔠', capital), Q('Full stops and questions', '❓', punctuation), Q('Sentence order', '🧩', sentenceOrder, 5), Q('Sight words 3', '👀', sight(2)), Q('Days of the week', '📅', days), Q('a or an?', '🅰️', aOrAn), B('Reading: story 1', '📖', (r) => passageLesson(r, t, 5)), B('Reading: story 2', '📚', (r) => passageLesson(r, t, 6)), Q('Opposites', '↔️', opposite)],
    6: [Q('Plurals', '🐑', plural(false)), Q('Past tense', '⏪', past(false)), Q('Pronouns', '🙋', pronoun), Q('Same meaning', '🟰', synonym), Q('Opposites', '↔️', opposite), Q('Months of the year', '🗓️', months), Q('Naming and action words', '🏷️', wordClass('verb')), Q('Punctuation', '❗', punctuation), B('Reading: story 1', '📖', (r) => passageLesson(r, t, 6)), B('Reading: story 2', '📚', (r) => passageLesson(r, t, 6)), Q('Sentence order', '🧩', sentenceOrder, 5)],
    7: [Q('Irregular past tense', '⏪', past(true)), Q('Comparing: -er and -est', '📏', compareAdj), Q('Joining words', '🔗', fromTable(CONJ, null, ['so', 'but', 'because', 'or', 'and'])), Q('Prefixes', '➕', prefix), Q('Synonyms', '🟰', synonym), Q('ABC order', '🔤', alphaOrder), Q('Punctuation', '❗', punctuation), Q('Describing words', '🌈', wordClass('adjective')), B('Reading: fable', '🐢', (r) => passageLesson(r, t, 7)), B('Reading: school garden', '🌱', (r) => passageLesson(r, t, 7)), Q('Plurals', '🐑', plural(false))],
    8: [Q('Adverbs', '💨', wordClass('adverb')), Q('Prepositions', '📍', fromTable(PREPS, null, ['under', 'in', 'on', 'across', 'down', 'between', 'above'])), Q('Homophones', '👂', homophone), Q('Contractions', "'", contraction), Q('Collective nouns', '🐝', fromTable(COLLECTIVE, (q) => `Complete: ${q}`, ['herd', 'flock', 'swarm', 'pride', 'pack', 'school', 'litter'])), Q('Suffixes', '➕', suffix), Q('Irregular verbs', '⏪', past(true)), B('Reading: recycling', '♻️', (r) => passageLesson(r, t, 8)), B('Reading: fable', '🐢', (r) => passageLesson(r, t, 8)), Q('Synonyms', '🟰', synonym), Q('Comparing words', '📏', compareAdj)],
    9: [Q('Tenses', '⏳', tense), Q('Subject–verb agreement', '🤝', subjectVerb), Q('Similes', '🦁', simile), Q('Prefixes', '➕', prefix), Q('Suffixes', '➕', suffix), Q('Homophones', '👂', homophone), Q('Joining words', '🔗', fromTable(CONJ, null, ['so', 'but', 'because', 'or', 'and'])), B('Reading: the clinic', '🏥', (r) => passageLesson(r, t, 9)), B('Reading: the final', '⚽', (r) => passageLesson(r, t, 9)), B('Reading: recycling', '♻️', (r) => passageLesson(r, t, 9)), Q('Synonyms', '🟰', synonym)],
    10: [Q('Active and passive', '🔄', passive, 5), Q('Reported speech', '💬', reported, 4), Q('Similes', '🦁', simile), Q('Proverbs', '🦉', proverb(t), 4), Q('Tenses', '⏳', tense), Q('Subject–verb agreement', '🤝', subjectVerb), Q('Collective nouns', '🐝', fromTable(COLLECTIVE, (q) => `Complete: ${q}`)), Q('Contractions', "'", contraction), B('Reading: the clinic', '🏥', (r) => passageLesson(r, t, 10)), B('Reading: the final', '⚽', (r) => passageLesson(r, t, 10)), Q('Homophones', '👂', homophone)],
  };
  return L[n] || [];
}

export function englishSteps(topic, r) {
  if (topic.build) return topic.build(r);
  const out = [];
  if (topic.intro) out.push(learn(...topic.intro));
  out.push(...repeat(topic.n, () => fixSV(topic.q(r))));
  return out;
}

// subjectVerb builds two options and needs its answer index resolved after shuffling.
function fixSV(s) {
  if (s._a) {
    const { _a, ...rest } = s;
    return { ...rest, answer: rest.options.findIndex((o) => o.label === _a) };
  }
  return s;
}

export { VOCAB, SIGHT, OPPOSITES };
