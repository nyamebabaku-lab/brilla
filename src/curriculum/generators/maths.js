import { int, pick, sample, shuffle } from '../../lib/format';
import { choice, learn, numOptions, pickEmoji, repeat, textOptions, NUM_WORDS } from './helpers';

const SHAPES_2D = ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart', 'oval', 'diamond', 'pentagon', 'hexagon'];
const SHAPE_SIDES = { triangle: 3, square: 4, rectangle: 4, diamond: 4, pentagon: 5, hexagon: 6, circle: 0, oval: 0 };
const SHAPES_3D = [
  { label: 'cube', emoji: '🧊' },
  { label: 'sphere', emoji: '⚽' },
  { label: 'cylinder', emoji: '🥫' },
  { label: 'cone', emoji: '🍦' },
  { label: 'pyramid', emoji: '🔺' },
];
const COLOURS = [
  { label: 'red', hex: '#ef4444' },
  { label: 'blue', hex: '#3b82f6' },
  { label: 'yellow', hex: '#facc15' },
  { label: 'green', hex: '#22c55e' },
  { label: 'orange', hex: '#f97316' },
  { label: 'purple', hex: '#a855f7' },
  { label: 'pink', hex: '#ec4899' },
  { label: 'brown', hex: '#92400e' },
  { label: 'black', hex: '#1f2937' },
  { label: 'white', hex: '#ffffff' },
];

// ---------- question factories (r = rng, t = track) ----------
const count = (max, min = 1) => (r) => {
  const n = int(r, min, max);
  const e = pickEmoji(r);
  return choice('How many can you count?', numOptions(r, n, { count: 3, spread: 2, min: 1 }), { visual: { kind: 'emoji', items: Array(n).fill(e) }, explain: `Touch each one as you count: ${Array.from({ length: n }, (_, i) => i + 1).join(', ')}. There are ${n}.` });
};
const findNumber = (max) => (r) => {
  const n = int(r, 1, max);
  return choice(`Find the number ${NUM_WORDS[n] || n}`, numOptions(r, n, { count: 4, spread: 4, min: 0 }), { say: `Find the number ${n}` });
};
const shapeName = (pool) => (r) => {
  const s = pick(r, pool);
  return choice('What shape is this?', textOptions(r, s, pool, 3), { visual: { kind: 'shape', shape: s } });
};
const colourName = (r) => {
  const c = pick(r, COLOURS);
  return choice('What colour is this?', textOptions(r, c.label, COLOURS.map((x) => x.label), 3), { visual: { kind: 'color', hex: c.hex } });
};
const bigSmall = (r) => {
  const e = pickEmoji(r);
  const big = r() < 0.5;
  const opts = shuffle(r, [{ label: '', emoji: e, size: 'lg' }, { label: '', emoji: e, size: 'sm' }]);
  return choice(`Which one is ${big ? 'BIG' : 'small'}?`, { options: opts, answer: opts.findIndex((o) => o.size === (big ? 'lg' : 'sm')) }, { emojiOptions: true });
};
const moreLess = (max) => (r) => {
  const a = int(r, 1, max);
  let b = int(r, 1, max);
  if (a === b) b = a === max ? a - 1 : a + 1;
  const more = r() < 0.5;
  const e1 = pickEmoji(r);
  const e2 = pickEmoji(r);
  const opts = [
    { label: `${a}`, group: Array(a).fill(e1) },
    { label: `${b}`, group: Array(b).fill(e2) },
  ];
  const ans = more ? (a > b ? 0 : 1) : a < b ? 0 : 1;
  return choice(`Which group has ${more ? 'MORE' : 'FEWER'}?`, { options: opts, answer: ans, hideLabels: true });
};
const beforeAfter = (max) => (r) => {
  const n = int(r, 2, max - 1);
  const after = r() < 0.5;
  return choice(`What number comes ${after ? 'after' : 'before'} ${n}?`, numOptions(r, after ? n + 1 : n - 1, { count: 3, spread: 2 }), { explain: `Count: ${n - 1}, ${n}, ${n + 1}. ${after ? `After ${n} comes ${n + 1}` : `Before ${n} comes ${n - 1}`}.` });
};
const pattern = (r) => {
  const [a, b, c] = sample(r, ['🔴', '🔵', '🟡', '🟢', '🟣', '⭐', '🍎', '🐟'], 3);
  const kind = pick(r, ['ab', 'abb', 'abc']);
  const unit = kind === 'ab' ? [a, b] : kind === 'abb' ? [a, b, b] : [a, b, c];
  const seq = Array.from({ length: unit.length * 2 + 1 }, (_, i) => unit[i % unit.length]);
  const next = seq.pop();
  return choice('What comes next in the pattern?', textOptions(r, next, [a, b, c], 3), { visual: { kind: 'emoji', items: [...seq, '❓'], row: true }, emojiOptions: true });
};
const addPics = (max) => (r) => {
  const a = int(r, 1, max - 1);
  const b = int(r, 1, max - a);
  const e = pickEmoji(r);
  return choice(`${a} + ${b} = ?`, numOptions(r, a + b, { count: 3, spread: 2, min: 1 }), {
    visual: { kind: 'sum', a: Array(a).fill(e), b: Array(b).fill(e), op: '+' },
    say: `${a} plus ${b} makes how many?`,
    explain: `Count the first group: ${a}. Keep counting the next group: ${Array.from({ length: b }, (_, i) => a + i + 1).join(', ')}. That makes ${a + b}.`,
  });
};
const subPics = (max) => (r) => {
  const a = int(r, 2, max);
  const b = int(r, 1, a - 1);
  const e = pickEmoji(r);
  return choice(`${a} − ${b} = ?`, numOptions(r, a - b, { count: 3, spread: 2, min: 0 }), {
    visual: { kind: 'takeaway', items: Array(a).fill(e), gone: b },
    say: `${a} take away ${b} leaves how many?`,
    explain: `Start with ${a}, cross out ${b}, then count what is left: ${a - b}.`,
  });
};
const add = (max, min = 0) => (r) => {
  const a = int(r, min, max);
  const b = int(r, min, max);
  return choice(`${a} + ${b} = ?`, numOptions(r, a + b, { spread: Math.max(2, Math.ceil(max / 8)) }), { say: `What is ${a} plus ${b}?`, explain: a + b <= 20 ? `Start at the bigger number, ${Math.max(a, b)}, and count on ${Math.min(a, b)} more. ${a} + ${b} = ${a + b}.` : `Add the ones, then the tens. ${a} + ${b} = ${a + b}.` });
};
const sub = (max, min = 0) => (r) => {
  let a = int(r, min, max);
  let b = int(r, min, max);
  if (b > a) [a, b] = [b, a];
  return choice(`${a} − ${b} = ?`, numOptions(r, a - b, { spread: Math.max(2, Math.ceil(max / 8)) }), { say: `What is ${a} minus ${b}?`, explain: a <= 20 ? `Start at ${a} and count back ${b}. ${a} − ${b} = ${a - b}.` : `Take away the ones, then the tens. ${a} − ${b} = ${a - b}.` });
};
const bond = (total) => (r) => {
  const a = int(r, 0, total);
  return choice(`${a} + ? = ${total}`, numOptions(r, total - a, { count: 4, spread: 2 }), { say: `${a} and what make ${total}?`, explain: `Count on from ${a} up to ${total}: that is ${total - a} more.` });
};
const mul = (tables, maxB = 12) => (r) => {
  const a = pick(r, tables);
  const b = int(r, 1, maxB);
  return choice(`${a} × ${b} = ?`, numOptions(r, a * b, { spread: 3, min: 0, count: 4 }), { say: `What is ${a} times ${b}?`, explain: `${a} × ${b} means ${b} groups of ${a}. Count in ${a}s: ${Array.from({ length: Math.min(b, 6) }, (_, i) => a * (i + 1)).join(', ')}${b > 6 ? '…' : ''} = ${a * b}.` });
};
const groups = (r) => {
  const g = int(r, 2, 4);
  const each = int(r, 2, 5);
  const e = pickEmoji(r);
  return choice(`${g} groups of ${each} = ?`, numOptions(r, g * each, { spread: 3 }), { visual: { kind: 'groups', groups: Array(g).fill(Array(each).fill(e)) }, say: `${g} groups of ${each} makes how many?` });
};
const div = (tables, maxB = 12) => (r) => {
  const a = pick(r, tables);
  const b = int(r, 1, maxB);
  return choice(`${a * b} ÷ ${a} = ?`, numOptions(r, b, { spread: 2, min: 1 }), { say: `What is ${a * b} divided by ${a}?`, explain: `How many ${a}s make ${a * b}? ${a} × ${b} = ${a * b}, so the answer is ${b}.` });
};
const share = (t) => (r) => {
  const kids = int(r, 2, 4);
  const each = int(r, 2, 5);
  const f = pick(r, t.foods);
  const [n1] = sample(r, t.names, 1);
  return choice(`${n1} shares ${kids * each} ${f.name} equally among ${kids} friends. How many does each friend get?`, numOptions(r, each, { spread: 2, min: 1 }), { visual: { kind: 'emoji', items: Array(kids * each).fill(f.emoji) } });
};
const placeValue = (digits) => (r) => {
  const n = int(r, 10 ** (digits - 1), 10 ** digits - 1);
  const places = ['ones', 'tens', 'hundreds', 'thousands'].slice(0, digits);
  const pi = int(r, 0, digits - 1);
  const digit = Math.floor(n / 10 ** pi) % 10;
  return choice(`In ${n.toLocaleString()}, what is the ${places[pi]} digit?`, numOptions(r, digit, { spread: 3, min: 0 }));
};
const tensOnes = (r) => {
  const n = int(r, 11, 99);
  return choice(`How many tens are in ${n}?`, numOptions(r, Math.floor(n / 10), { spread: 2, min: 0 }), { visual: { kind: 'blocks', tens: Math.floor(n / 10), ones: n % 10 }, explain: `${n} is ${Math.floor(n / 10)} tens and ${n % 10} ones. The first digit tells the tens.` });
};
const missing = (max) => (r) => {
  const step = pick(r, [1, 2, 5, 10].filter((s) => s * 5 <= max));
  const start = int(r, 0, Math.max(0, max - step * 5));
  const seq = Array.from({ length: 5 }, (_, i) => start + i * step);
  const hole = int(r, 1, 3);
  const ans = seq[hole];
  return choice('Which number is missing?', numOptions(r, ans, { spread: step, min: 0 }), { visual: { kind: 'text', text: seq.map((v, i) => (i === hole ? '__' : v)).join(',  ') } });
};
const skip = (by, max) => (r) => {
  const start = int(r, 0, Math.floor(max / by) - 4) * by;
  const seq = [start, start + by, start + 2 * by];
  return choice(`Count in ${by}s: ${seq.join(', ')}, ?`, numOptions(r, start + 3 * by, { spread: by, min: 0 }));
};
const evenOdd = (r) => {
  const n = int(r, 1, 50);
  return choice(`Is ${n} even or odd?`, { options: [{ label: 'even' }, { label: 'odd' }], answer: n % 2 === 0 ? 0 : 1 }, { explain: `Look at the last digit, ${n % 10}. Numbers ending in 0, 2, 4, 6 or 8 are even.` });
};
const compare = (max) => (r) => {
  const a = int(r, 0, max);
  let b = int(r, 0, max);
  if (r() < 0.15) b = a;
  const sign = a > b ? '>' : a < b ? '<' : '=';
  return choice(`${a.toLocaleString()}  ?  ${b.toLocaleString()}`, { options: [{ label: '>' }, { label: '<' }, { label: '=' }], answer: ['>', '<', '='].indexOf(sign) }, { say: `Is ${a} greater than, less than, or equal to ${b}?` });
};
const ordinal = (r) => {
  const animals = sample(r, ['🐶', '🐱', '🐰', '🐻', '🐼', '🦊'], 5);
  const pos = int(r, 0, 4);
  const words = ['1st', '2nd', '3rd', '4th', '5th'];
  return choice(`Who is ${words[pos]} in the line?`, { options: animals.map((e) => ({ label: '', emoji: e })), answer: pos }, { visual: { kind: 'text', text: '🏁 ← start here' }, emojiOptions: true, say: `Who is ${['first', 'second', 'third', 'fourth', 'fifth'][pos]} in the line? Start at the flag.` });
};
const clock = (mins) => (r) => {
  const h = int(r, 1, 12);
  const m = pick(r, mins);
  const fmt = (hh, mm) => (mm === 0 ? `${hh} o'clock` : mm === 30 ? `half past ${hh}` : mm === 15 ? `quarter past ${hh}` : mm === 45 ? `quarter to ${(hh % 12) + 1}` : `${hh}:${String(mm).padStart(2, '0')}`);
  const right = fmt(h, m);
  const wrong = [fmt((h % 12) + 1, m), fmt(h, pick(r, mins.filter((x) => x !== m)) ?? (m + 30) % 60), fmt(((h + 4) % 12) + 1, m), fmt(h === 1 ? 12 : h - 1, m)];
  return choice('What time does the clock show?', textOptions(r, right, [...new Set(wrong)].filter((w) => w !== right), 3), { visual: { kind: 'clock', h, m }, explain: `The short hand shows the hour (${h}). The long hand shows the minutes (${m === 0 ? 'pointing at 12 means o\'clock' : `${m} minutes`}). It is ${right}.` });
};
const coins = (t) => (r) => {
  const items = t.id === 'ges' ? [1, 2, 5, 10, 20] : [1, 2, 5, 10, 20];
  const a = pick(r, items);
  const b = pick(r, items);
  return choice(`You have ${t.currency}${a} and ${t.currency}${b}. How much altogether?`, numOptions(r, a + b, { spread: 3, min: 1, fmt: (n) => `${t.currency}${n}` }), { visual: { kind: 'money', notes: [a, b], cur: t.currency } });
};
const change = (t) => (r) => {
  const price = int(r, 2, 18);
  const paid = price <= 5 ? 5 : price <= 10 ? 10 : 20;
  const f = pick(r, t.foods);
  const n = pick(r, t.names);
  return choice(`${n} buys ${f.name} for ${t.currency}${price} at the ${t.place} and pays ${t.currency}${paid}. What is the change?`, numOptions(r, paid - price, { spread: 2, min: 0, fmt: (v) => `${t.currency}${v}` }), { visual: { kind: 'emoji', items: [f.emoji] } });
};
const wordAdd = (t, max) => (r) => {
  const [a, b] = sample(r, t.names, 2);
  const f = pick(r, t.foods);
  const x = int(r, 2, max);
  const y = int(r, 2, max);
  const plus = r() < 0.5;
  if (plus) return choice(`${a} has ${x} ${f.name}. ${b} gives ${a} ${y} more. How many ${f.name} does ${a} have now?`, numOptions(r, x + y, { spread: 3 }), { visual: { kind: 'emoji', items: [f.emoji] } });
  const big = Math.max(x, y) + 2;
  const small = Math.min(x, y);
  return choice(`${a} had ${big} ${f.name} and ate ${small}. How many are left?`, numOptions(r, big - small, { spread: 3 }), { visual: { kind: 'emoji', items: [f.emoji] } });
};
const wordMul = (t) => (r) => {
  const n = pick(r, t.names);
  const bags = int(r, 3, 9);
  const each = int(r, 3, 12);
  const f = pick(r, t.foods);
  return choice(`${n} has ${bags} bags with ${each} ${f.name} in each bag. How many ${f.name} altogether?`, numOptions(r, bags * each, { spread: 4 }), { visual: { kind: 'emoji', items: [f.emoji, '🛍️'] } });
};
const fracShape = (dens) => (r) => {
  const d = pick(r, dens);
  const n = int(r, 1, d - 1);
  const right = `${n}/${d}`;
  const wrong = [`${d - n}/${d}`, `${n}/${d + 1}`, `${d}/${n}`, `${n + 1}/${d}`].filter((w) => w !== right && !w.startsWith('0'));
  return choice('What fraction is coloured?', textOptions(r, right, [...new Set(wrong)], 3), { visual: { kind: 'fraction', n, d, shape: r() < 0.5 ? 'pie' : 'bar' }, explain: `There are ${d} equal parts (the bottom number) and ${n} ${n === 1 ? 'is' : 'are'} coloured (the top number): ${n}/${d}.` });
};
const fracOf = (r) => {
  const d = pick(r, [2, 3, 4, 5, 10]);
  const n = int(r, 1, d - 1);
  const whole = d * int(r, 2, 10);
  return choice(`What is ${n}/${d} of ${whole}?`, numOptions(r, (whole / d) * n, { spread: 3, min: 1 }), { explain: `Divide by the bottom number, then multiply by the top: ${whole} ÷ ${d} = ${whole / d}, × ${n} = ${(whole / d) * n}.` });
};
const fracEquiv = (r) => {
  const d = pick(r, [2, 3, 4, 5]);
  const n = int(r, 1, d - 1);
  const k = int(r, 2, 4);
  const right = `${n * k}/${d * k}`;
  return choice(`Which fraction is equal to ${n}/${d}?`, textOptions(r, right, [`${n + k}/${d + k}`, `${n * k}/${d + k}`, `${n}/${d * k}`, `${n * k + 1}/${d * k}`], 4));
};
const fracAdd = (r) => {
  const d = pick(r, [4, 5, 6, 8, 10, 12]);
  const a = int(r, 1, d - 2);
  const b = int(r, 1, d - a - 1);
  const right = `${a + b}/${d}`;
  return choice(`${a}/${d} + ${b}/${d} = ?`, textOptions(r, right, [`${a + b}/${d * 2}`, `${a + b + 1}/${d}`, `${a * b}/${d}`, `${Math.abs(a - b) || 1}/${d}`], 4));
};
const fracCompare = (r) => {
  const d = pick(r, [3, 4, 5, 6, 8]);
  const a = int(r, 1, d - 1);
  let b = int(r, 1, d - 1);
  if (b === a) b = a === 1 ? 2 : a - 1;
  return choice(`Which is bigger: ${a}/${d} or ${b}/${d}?`, { options: [{ label: `${a}/${d}` }, { label: `${b}/${d}` }], answer: a > b ? 0 : 1 });
};
const dec = (op) => (r) => {
  const a = int(r, 1, 99) / 10;
  const b = int(r, 1, 99) / 10;
  const v = op === '+' ? a + b : op === '-' ? Math.max(a, b) - Math.min(a, b) : a * int(r, 2, 9);
  const shownB = op === '×' ? Math.round(v / a) : op === '-' ? Math.min(a, b) : b;
  const shownA = op === '-' ? Math.max(a, b) : a;
  const ans = Math.round(v * 100) / 100;
  return choice(`${shownA} ${op} ${shownB} = ?`, numOptions(r, ans, { spread: 2, min: 0, fmt: (n) => String(Math.round(n * 100) / 100) }));
};
const decTenths = (r) => {
  const n = int(r, 1, 9);
  return choice(`Write ${n}/10 as a decimal`, textOptions(r, `0.${n}`, [`${n}.0`, `0.0${n}`, `${n}.1`, `1.${n}`], 4));
};
const pct = (easy) => (r) => {
  const p = pick(r, easy ? [10, 25, 50, 100] : [5, 10, 15, 20, 25, 30, 40, 50, 75]);
  const whole = pick(r, [20, 40, 60, 80, 100, 120, 200, 400]);
  return choice(`What is ${p}% of ${whole}?`, numOptions(r, (p * whole) / 100, { spread: 5, min: 0 }), { explain: `${p}% means ${p} out of 100. ${whole} ÷ 100 × ${p} = ${(p * whole) / 100}.` });
};
const ratio = (t) => (r) => {
  const a = int(r, 1, 5);
  const b = int(r, 1, 5);
  const k = int(r, 2, 6);
  const [n1, n2] = sample(r, t.names, 2);
  return choice(`${n1} and ${n2} share ${(a + b) * k} sweets in the ratio ${a}:${b}. How many does ${n1} get?`, numOptions(r, a * k, { spread: 3, min: 1 }));
};
const algebra = (r) => {
  const x = int(r, 1, 12);
  const a = int(r, 2, 9);
  const b = int(r, 1, 20);
  const kind = pick(r, ['add', 'mul', 'two']);
  if (kind === 'add') return choice(`x + ${b} = ${x + b}. What is x?`, numOptions(r, x, { spread: 3, min: 0 }));
  if (kind === 'mul') return choice(`${a}x = ${a * x}. What is x?`, numOptions(r, x, { spread: 3, min: 0 }));
  return choice(`${a}x + ${b} = ${a * x + b}. What is x?`, numOptions(r, x, { spread: 3, min: 0 }));
};
const bodmas = (r) => {
  const a = int(r, 2, 9);
  const b = int(r, 2, 9);
  const c = int(r, 2, 9);
  const kind = pick(r, [0, 1, 2]);
  const [q, ans] = kind === 0 ? [`${a} + ${b} × ${c}`, a + b * c] : kind === 1 ? [`(${a} + ${b}) × ${c}`, (a + b) * c] : [`${a * c} ÷ ${c} + ${b}`, a + b];
  return choice(`${q} = ?`, numOptions(r, ans, { spread: 6, min: 0 }), { say: `Work out ${q.replace('×', 'times').replace('÷', 'divided by')}` });
};
const negatives = (r) => {
  const a = int(r, -10, 10);
  const b = int(r, -10, 10);
  return choice(`${a} + (${b}) = ?`, numOptions(r, a + b, { spread: 3, min: -30 }));
};
const perimeter = (r) => {
  const w = int(r, 2, 12);
  const h = int(r, 2, 12);
  return choice(`A rectangle is ${w} cm long and ${h} cm wide. What is its perimeter?`, numOptions(r, 2 * (w + h), { spread: 4, fmt: (n) => `${n} cm` }), { visual: { kind: 'rect', w, h }, explain: `Perimeter is the distance all the way round: ${w} + ${h} + ${w} + ${h} = ${2 * (w + h)} cm.` });
};
const area = (r) => {
  const w = int(r, 2, 12);
  const h = int(r, 2, 12);
  return choice(`A rectangle is ${w} m long and ${h} m wide. What is its area?`, numOptions(r, w * h, { spread: 5, fmt: (n) => `${n} m²` }), { visual: { kind: 'rect', w, h }, explain: `Area = length × width = ${w} × ${h} = ${w * h} m².` });
};
const volume = (r) => {
  const [a, b, c] = [int(r, 2, 6), int(r, 2, 6), int(r, 2, 6)];
  return choice(`A box is ${a} cm × ${b} cm × ${c} cm. What is its volume?`, numOptions(r, a * b * c, { spread: 6, fmt: (n) => `${n} cm³` }), { visual: { kind: 'emoji', items: ['📦'] } });
};
const angles = (r) => {
  const deg = pick(r, [30, 45, 60, 90, 120, 135, 150, 180]);
  const name = deg < 90 ? 'acute' : deg === 90 ? 'right angle' : deg < 180 ? 'obtuse' : 'straight';
  return choice('What type of angle is this?', textOptions(r, name, ['acute', 'right angle', 'obtuse', 'straight'], 4), { visual: { kind: 'angle', deg } });
};
const sides = (r) => {
  const s = pick(r, ['triangle', 'square', 'rectangle', 'pentagon', 'hexagon']);
  return choice(`How many sides does a ${s} have?`, numOptions(r, SHAPE_SIDES[s], { count: 3, spread: 2, min: 3 }), { visual: { kind: 'shape', shape: s }, explain: `Count each straight side as you go round: a ${s} has ${SHAPE_SIDES[s]} sides.` });
};
const shapes3d = (r) => {
  const s = pick(r, SHAPES_3D);
  return choice('What 3D shape does this look like?', textOptions(r, s.label, SHAPES_3D.map((x) => x.label), 3), { visual: { kind: 'emoji', items: [s.emoji], big: true } });
};
const rounding = (to) => (r) => {
  const n = int(r, to, to * 99);
  const ans = Math.round(n / to) * to;
  return choice(`Round ${n.toLocaleString()} to the nearest ${to}`, numOptions(r, ans, { spread: 2, fmt: (v) => v.toLocaleString() }), { explain: `Look at the digit after the ${to}s place: 5 or more rounds up, 4 or less rounds down. ${n.toLocaleString()} → ${ans.toLocaleString()}.` });
};
const factors = (r) => {
  const n = pick(r, [12, 16, 18, 20, 24, 30, 36]);
  const fs = [];
  for (let i = 2; i < n; i++) if (n % i === 0) fs.push(i);
  const right = pick(r, fs);
  const wrong = [5, 7, 9, 11, 13, 14].filter((w) => n % w !== 0);
  return choice(`Which number is a factor of ${n}?`, textOptions(r, String(right), wrong.map(String), 4));
};
const primes = (r) => {
  const p = pick(r, [2, 3, 5, 7, 11, 13, 17, 19, 23, 29]);
  return choice('Which number is prime?', textOptions(r, String(p), ['4', '6', '9', '15', '21', '25', '27', '12'], 4));
};
const mean = (r) => {
  const k = int(r, 3, 5);
  const avg = int(r, 3, 15);
  const nums = Array.from({ length: k - 1 }, () => int(r, 1, avg * 2 - 1));
  const last = avg * k - nums.reduce((a, b) => a + b, 0);
  if (last < 0) return mean(r);
  const all = shuffle(r, [...nums, last]);
  return choice(`Find the mean (average): ${all.join(', ')}`, numOptions(r, avg, { spread: 3, min: 0 }));
};
const length = (r) => {
  const items = sample(r, [
    { label: 'pencil', emoji: '✏️', l: 2 },
    { label: 'snake', emoji: '🐍', l: 4 },
    { label: 'bus', emoji: '🚌', l: 6 },
    { label: 'ant', emoji: '🐜', l: 1 },
    { label: 'giraffe', emoji: '🦒', l: 5 },
    { label: 'train', emoji: '🚆', l: 7 },
  ], 3);
  const longest = r() < 0.5;
  const target = [...items].sort((a, b) => (longest ? b.l - a.l : a.l - b.l))[0];
  return choice(`Which is ${longest ? 'the longest' : 'the shortest'}?`, { options: items.map((i) => ({ label: i.label, emoji: i.emoji })), answer: items.indexOf(target) });
};
const units = (r) => {
  const q = pick(r, [
    ['How many centimetres are in 1 metre?', 100],
    ['How many grams are in 1 kilogram?', 1000],
    ['How many minutes are in 1 hour?', 60],
    ['How many days are in 1 week?', 7],
    ['How many months are in 1 year?', 12],
    ['How many millilitres are in 1 litre?', 1000],
    ['How many seconds are in 1 minute?', 60],
  ]);
  return choice(q[0], textOptions(r, String(q[1]), ['10', '100', '1000', '60', '24', '7', '12', '30'], 4));
};
const largeNum = (r) => {
  const n = int(r, 1000, 999999);
  const words = (x) => x.toLocaleString();
  return choice(`Which number is the biggest?`, textOptions(r, words(n), [words(Math.floor(n / 10)), words(n - int(r, 100, 900)), words(Math.floor(n * 0.9))], 4));
};
const roman = (r) => {
  const table = [[1, 'I'], [4, 'IV'], [5, 'V'], [9, 'IX'], [10, 'X'], [40, 'XL'], [50, 'L']];
  const toRoman = (n) => {
    let s = '';
    for (let i = table.length - 1; i >= 0; i--) while (n >= table[i][0]) (s += table[i][1]), (n -= table[i][0]);
    return s;
  };
  const n = int(r, 1, 50);
  return choice(`What number is ${toRoman(n)}?`, numOptions(r, n, { spread: 4, min: 1 }));
};
const colourSort = () => ({
  type: 'sort',
  prompt: 'Put each thing in its colour box!',
  bins: [{ label: 'red', emoji: '🟥' }, { label: 'yellow', emoji: '🟨' }],
  items: [{ label: 'apple', emoji: '🍎', bin: 0 }, { label: 'banana', emoji: '🍌', bin: 1 }, { label: 'strawberry', emoji: '🍓', bin: 0 }, { label: 'sun', emoji: '🌞', bin: 1 }, { label: 'car', emoji: '🚗', bin: 0 }, { label: 'chick', emoji: '🐥', bin: 1 }],
});
const evenOddSort = (r) => {
  const nums = sample(r, Array.from({ length: 30 }, (_, i) => i + 1), 6);
  return { type: 'sort', prompt: 'Sort the numbers: even or odd?', bins: [{ label: 'Even', emoji: '2️⃣' }, { label: 'Odd', emoji: '1️⃣' }], items: nums.map((n) => ({ label: String(n), bin: n % 2 ? 1 : 0 })) };
};

// ---------- topic lists per level ----------
const T = (title, emoji, q, intro) => ({ title, emoji, q, intro });

export function mathsTopics(n, t) {
  const L = [
    // Creche
    [T('Count to 3', '🍎', count(3), ['Let\'s count!', '1️⃣2️⃣3️⃣', 'One, two, three!']), T('Big and small', '🐘', bigSmall), T('Colours', '🌈', colourName), T('Circles and squares', '⚪', shapeName(['circle', 'square'])), T('Count to 3 again', '🐥', count(3)), T('Which has more?', '🍓', moreLess(3)), T('Red, blue, yellow', '🎨', colourName)],
    // N1
    [T('Count to 5', '🖐️', count(5), ['Count with your fingers', '🖐️', 'One, two, three, four, five!']), T('Numbers 1 to 5', '🔢', findNumber(5)), T('Shapes', '🔺', shapeName(['circle', 'square', 'triangle'])), T('Big and small', '🐘', bigSmall), T('More or fewer', '⚖️', moreLess(5)), T('Patterns', '🔴', pattern), T('Colours', '🎨', colourName), T('Long and short', '🐍', length)],
    // N2
    [T('Count to 10', '🔟', count(10), ['Count to ten', '🔟', 'Point and count each one']), T('Numbers 1 to 10', '🔢', findNumber(10)), T('Before and after', '↔️', beforeAfter(10)), T('More or fewer', '⚖️', moreLess(8)), T('Shapes all around', '⭐', shapeName(['circle', 'square', 'triangle', 'rectangle', 'star', 'heart'])), T('Patterns', '🟡', pattern), { title: 'Sort by colour', emoji: '🟥', build: (r) => [colourSort(), ...repeat(4, () => colourName(r))] }, T('Long and short', '📏', length), T('Adding with pictures', '➕', addPics(5))],
    // KG1
    [T('Count to 20', '🎯', count(20, 8)), T('Adding to 5', '➕', addPics(5)), T('Taking away', '➖', subPics(5)), T('Before and after', '↔️', beforeAfter(20)), T('Bigger or smaller', '⚖️', compare(20)), T('1st, 2nd, 3rd', '🏁', ordinal), T('Shapes', '🔷', shapeName(['circle', 'square', 'triangle', 'rectangle', 'oval', 'diamond'])), T('Patterns', '🔵', pattern), T('Missing numbers', '❓', missing(20)), T('Adding to 10', '🍌', addPics(10))],
    // KG2
    [T('Adding to 10', '➕', addPics(10)), T('Taking away to 10', '➖', subPics(10)), T('Number bonds to 10', '🔗', bond(10), ['Number bonds', '🔗', 'Two numbers that make ten, like 7 and 3']), T('Counting in 2s', '👟', skip(2, 20)), T('Tens and ones', '🧱', tensOnes), T('O\'clock', '🕐', clock([0]), ['Telling time', '🕐', 'When the long hand points to 12, it is o\'clock']), T('Money', '💵', coins(t)), T('Long and short', '📏', length), T('Story sums', '📖', wordAdd(t, 5)), T('Bigger or smaller', '⚖️', compare(50)), T('Missing numbers', '❓', missing(30))],
    // P1
    [T('Add within 20', '➕', add(10, 1)), T('Subtract within 20', '➖', sub(20, 1)), T('Tens and ones', '🧱', tensOnes), T('Numbers to 100', '💯', compare(100)), T('Missing numbers', '❓', missing(100)), T('Half past', '🕧', clock([0, 30])), T('Even and odd', '⚖️', evenOdd), { title: 'Sort even and odd', emoji: '🔢', build: (r) => [evenOddSort(r), ...repeat(5, () => evenOdd(r))] }, T('Money', '💰', coins(t)), T('2D shapes', '🔺', sides), T('3D shapes', '🧊', shapes3d), T('Story sums', '📖', wordAdd(t, 9)), T('Count in 5s and 10s', '🖐️', skip(5, 100))],
    // P2
    [T('2-digit adding', '➕', add(50, 10)), T('2-digit taking away', '➖', sub(99, 10)), T('Groups of', '🍪', groups, ['Multiplying', '✖️', 'Multiplying means adding equal groups']), T('2, 5 and 10 times tables', '✖️', mul([2, 5, 10])), T('Sharing equally', '🤝', share(t)), T('Halves and quarters', '🍕', fracShape([2, 4])), T('Quarter past and to', '🕒', clock([0, 15, 30, 45])), T('Giving change', '🪙', change(t)), T('Place value', '🔢', placeValue(3)), T('Length and units', '📏', units), T('Story problems', '📖', wordAdd(t, 30)), { title: 'Even and odd', emoji: '⚖️', build: (r) => [evenOddSort(r), ...repeat(6, () => evenOdd(r))] }],
    // P3
    [T('Times tables 2–5', '✖️', mul([2, 3, 4, 5])), T('Times tables 6–10', '✖️', mul([6, 7, 8, 9, 10])), T('Division facts', '➗', div([2, 3, 4, 5, 10])), T('3-digit adding', '➕', add(500, 100)), T('3-digit taking away', '➖', sub(999, 100)), T('Fractions of shapes', '🥧', fracShape([2, 3, 4, 5, 6, 8])), T('Comparing fractions', '⚖️', fracCompare), T('Telling time', '⏰', clock([0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55])), T('Perimeter', '📐', perimeter), T('Round to 10', '🎯', rounding(10)), T('Multiplying stories', '📖', wordMul(t)), T('Giving change', '🪙', change(t))],
    // P4
    [T('Bigger times tables', '✖️', mul([11, 12], 12)), T('Multiplying 2-digit numbers', '✖️', mul([12, 15, 20, 25], 9)), T('Division', '➗', div([6, 7, 8, 9, 12])), T('Equivalent fractions', '🟰', fracEquiv), T('Fraction of an amount', '🍰', fracOf), T('Tenths and decimals', '🔟', decTenths), T('Area', '🟩', area), T('Angles', '📐', angles), T('Round to 100', '🎯', rounding(100)), T('Roman numerals', '🏛️', roman), T('Factors', '🧩', factors), T('Place value to 10,000', '🔢', placeValue(4)), T('Word problems', '📖', wordMul(t))],
    // P5
    [T('Adding fractions', '➕', fracAdd), T('Adding decimals', '🔢', dec('+')), T('Subtracting decimals', '➖', dec('-')), T('Percentages', '💯', pct(true)), T('Factors', '🧩', factors), T('Prime numbers', '🔐', primes), T('Area', '🟩', area), T('Perimeter', '📐', perimeter), T('Averages', '📊', mean), T('Large numbers', '🌍', largeNum), T('Angles', '📐', angles), T('Units of measure', '⚖️', units), T('Word problems', '📖', wordMul(t))],
    // P6
    [T('Order of operations', '🧮', bodmas, ['BODMAS', '🧮', 'Brackets first, then divide and multiply, then add and subtract']), T('Simple algebra', '🔤', algebra), T('Percentages of amounts', '💯', pct(false)), T('Ratio', '⚖️', ratio(t)), T('Multiplying decimals', '✖️', dec('×')), T('Fraction operations', '🥧', fracAdd), T('Equivalent fractions', '🟰', fracEquiv), T('Negative numbers', '🌡️', negatives), T('Volume', '📦', volume), T('Mean average', '📊', mean), T('Area and perimeter', '🟩', area), T('Prime numbers', '🔐', primes), T('Large numbers', '🌍', largeNum)],
  ];
  return L[n];
}

/** Builds one lesson's steps from a topic. */
export function mathsSteps(topic, r, n, steps) {
  if (topic.build) return topic.build(r);
  const out = [];
  if (topic.intro) out.push(learn(topic.intro[0], topic.intro[1], topic.intro[2]));
  out.push(...repeat(steps, () => topic.q(r)));
  return out;
}
