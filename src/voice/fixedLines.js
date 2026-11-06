// Every fixed line the app speaks outside the generated lesson questions. Used by scripts/voice-script.mjs.
// `@child` stands for the child's own name (typed by parents, so it can't be pre-recorded).
import { INSTRUCTORS } from '../lib/instructors';
import { SUBJECTS } from '../curriculum/subjects';
import { DEFAULT_PRESETS } from '../lib/theme';
import { DEFAULT_LANGUAGES } from '../curriculum/languagePacks';
import { PATH_NAMES } from '../activities/traceText';

const CHEERS = ['Super!', 'Brilliant!', 'Great job!', 'You did it!', 'Amazing!', 'Wow!', 'Fantastic!'];
const GAMES = [
  ['Balloon pop', 'Pop the balloons before they fly away!'],
  ['Memory match', 'Turn two cards. Find the pairs!'],
  ['Catch the fruit', 'Move the basket to catch the fruit. Watch out for rocks!'],
  ['Bubble count', 'Count as you pop the bubbles!'],
];
const COLOURS = ['red', 'orange', 'yellow', 'light green', 'green', 'teal', 'light blue', 'blue', 'purple', 'pink', 'light pink', 'brown', 'cream', 'black', 'white', 'grey', 'a different colour'];

/** [section, text] pairs. Section A = app and teacher, C = creative activities. */
export function fixedLines() {
  const L = [];
  const A = (t) => L.push(['A', t]);
  const C = (t) => L.push(['C', t]);
  // Greetings and home
  ['Good morning', 'Good afternoon', 'Good evening'].forEach((g) => A(`${g} @child! What shall we learn today?`));
  A('Hi @child!');
  SUBJECTS.forEach((s) => A(s.name));
  Object.values(DEFAULT_LANGUAGES).forEach((l) => A(l.name));
  DEFAULT_PRESETS.forEach((p) => A(p.name));
  Object.values(INSTRUCTORS).forEach((t) => A(t.hello));
  // Lessons
  CHEERS.forEach((c) => [1, 2, 3].forEach((n) => A(`${c} You earned ${n} star${n > 1 ? 's' : ''} and a new sticker!`)));
  A('Watch me.');
  A('Now you try!');
  A('The answer is');
  A('Watch me spell');
  A('goes in');
  A('This lesson is locked. Ask a grown-up to unlock it!');
  A('This unit opens soon! A new unit opens every week.');
  A('Listen and say the sound');
  A('Tap each sound. Then blend them together!');
  A("Let's read the story");
  A('Tap a picture, then tap the box it goes in.');
  A('First tap a picture, then tap a box');
  A('Spell');
  A('This letter');
  // Break games
  GAMES.forEach(([name, intro]) => A(`Break time! ${name}. ${intro}`));
  ['red', 'blue', 'yellow', 'green', 'purple', 'orange'].forEach((c) => A(`Pop the ${c} balloons!`));
  for (let n = 3; n <= 10; n++) A(`Pop ${n} bubbles!`);
  A('Great game! Now let’s get back to learning.');
  // Tracing
  Object.values(PATH_NAMES).forEach((p) => C(`Watch me. Trace ${p}`));
  C('Your turn! Start at the green dot and follow the dots.');
  C('Your turn! Follow the dotted lines.');
  C('Keep going! Trace all of it.');
  ['Beautiful!', 'Great tracing!', 'Well done!'].forEach(C);
  // Colouring, drawing, writing
  C('Pick a colour, then tap the picture.');
  C("Let's colour the");
  C('Beautiful colours!');
  C('What a wonderful picture!');
  C('Lovely handwriting!');
  C('Copy:');
  COLOURS.forEach((c) => C(`That is ${c}.`));
  return L;
}
