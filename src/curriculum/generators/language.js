// Ghanaian language lessons built from the editable word banks (settings.languages).
import { sample, shuffle } from '../../lib/format';
import { learn } from './helpers';

const chunk = (arr, size) => Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size));
const audio = (lang, w) => ({ lang, word: { id: w.id, w: w.w, audio: !!w.audio } });

const uniqueBy = (arr, key) => [...new Map(arr.map((x) => [x[key], x])).values()];

function quiz(r, pack, w, pool, kind) {
  // Picture questions need a picture that belongs to this word only (e.g. all days share 📅).
  const pictureKind = kind === 'picture' || kind === 'listen';
  if (pictureKind && pool.filter((x) => x.emoji === w.emoji).length > 1) kind = 'meaning';
  const key = kind === 'say' ? 'w' : kind === 'meaning' ? 'en' : 'emoji';
  const others = sample(r, uniqueBy(pool.filter((x) => x.id !== w.id && x[key] !== w[key] && x.emoji !== w.emoji), key), 3);
  const opts = shuffle(r, [w, ...others]);
  const answer = opts.indexOf(w);
  if (kind === 'picture')
    return { type: 'choice', prompt: `Which one is "${w.w}"?`, say: `Which one is this word?`, localAudio: audio(pack.id, w), options: opts.map((o) => ({ label: '', emoji: o.emoji })), answer, emojiOptions: true };
  if (kind === 'listen')
    return { type: 'choice', prompt: 'Listen! Which one is it?', say: '', localAudio: audio(pack.id, w), listen: true, options: opts.map((o) => ({ label: '', emoji: o.emoji })), answer, emojiOptions: true };
  if (kind === 'meaning')
    return { type: 'choice', prompt: `What does "${w.w}" mean?`, say: `What does this word mean?`, localAudio: audio(pack.id, w), options: opts.map((o) => ({ label: o.en })), answer };
  return {
    type: 'choice',
    prompt: `How do you say "${w.en}" in ${pack.name}?`,
    visual: { kind: 'emoji', items: [w.emoji], big: true },
    options: opts.map((o) => ({ label: o.w, local: audio(pack.id, o) })),
    answer,
  };
}

function wordsLesson(pack, words, pool, n) {
  return (r) => {
    const steps = words.map((w) => ({ type: 'word', lang: pack.id, langName: pack.name, ...w }));
    const kinds = n <= 2 ? ['picture', 'picture', 'listen'] : n <= 5 ? ['picture', 'meaning', 'say', 'listen'] : ['say', 'meaning', 'listen', 'say'];
    const quizWords = shuffle(r, words).slice(0, Math.min(words.length + 1, 5));
    quizWords.forEach((w, i) => pool.length >= 4 && steps.push(quiz(r, pack, w, pool, kinds[i % kinds.length])));
    return steps;
  };
}

function practiceLesson(pack, pool, n) {
  return (r) => {
    const words = sample(r, pool, Math.min(8, n <= 3 ? 5 : 8));
    const kinds = n <= 3 ? ['picture', 'listen'] : ['listen', 'say', 'meaning', 'picture'];
    return words.map((w, i) => quiz(r, pack, w, pool, kinds[i % kinds.length]));
  };
}

/** Lesson topics for one language at one level. */
export function languageTopics(n, pack) {
  if (!pack) return [];
  const cats = pack.categories.filter((c) => c.min <= n && c.words.length);
  // Letter cards teach sounds; they are not quiz material.
  const isLetters = (c) => c.id === 'letters';
  const pool = cats.filter((c) => !isLetters(c)).flatMap((c) => c.words.filter((w) => w.w && w.en));
  const topics = [];
  topics.push({
    title: `Hello, ${pack.name}!`,
    emoji: '🇬🇭',
    build: () => [learn(`Let's learn ${pack.name}`, '🇬🇭', `${pack.name} is spoken in Ghana. Listen to each word, then say it out loud!`), ...(cats[0]?.words.slice(0, 3).map((w) => ({ type: 'word', lang: pack.id, langName: pack.name, ...w })) || [])],
  });
  cats.forEach((c) => {
    const parts = chunk(c.words, n <= 2 ? 5 : 6);
    parts.forEach((words, i) =>
      topics.push({
        title: parts.length > 1 ? `${c.title} ${i + 1}` : c.title,
        emoji: c.emoji,
        build: isLetters(c) ? () => words.map((w) => ({ type: 'word', lang: pack.id, langName: pack.name, ...w })) : wordsLesson(pack, words, pool, n),
      }),
    );
  });
  // Mixed practice lessons revisit everything learnt so far.
  const practice = Math.max(2, Math.ceil(cats.length / 2));
  for (let i = 0; i < practice && pool.length >= 4; i++) topics.push({ title: `${pack.name} practice ${i + 1}`, emoji: ['🎧', '🏆', '🎯', '⭐'][i % 4], build: practiceLesson(pack, pool, n) });
  return topics;
}
