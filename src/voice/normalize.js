// Turns anything the app says into a list of spoken words, so recorded clips can be matched to it.
// Used by the app (to find clips) and by scripts/voice-script.mjs (to build the recording script),
// so both always agree on what a "phrase" is.

const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
const ORD = { one: 'first', two: 'second', three: 'third', five: 'fifth', eight: 'eighth', nine: 'ninth', twelve: 'twelfth' };
const DENOM = { 2: ['half', 'halves'], 4: ['quarter', 'quarters'] };

/** 1234 → "one thousand two hundred and thirty four" (British "and"). */
export function numberWords(n) {
  n = Math.round(Math.abs(n));
  if (n < 20) return ONES[n];
  if (n < 100) return TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : '');
  if (n < 1000) return `${ONES[Math.floor(n / 100)]} hundred${n % 100 ? ` and ${numberWords(n % 100)}` : ''}`;
  for (const [size, name] of [[1e9, 'billion'], [1e6, 'million'], [1e3, 'thousand']]) {
    if (n >= size) {
      const rest = n % size;
      return `${numberWords(Math.floor(n / size))} ${name}${rest ? (rest < 100 ? ` and ${numberWords(rest)}` : ` ${numberWords(rest)}`) : ''}`;
    }
  }
  return String(n);
}

/** 3 → "third", 21 → "twenty first". */
export function ordinalWords(n) {
  const w = numberWords(n).split(' ');
  const last = w.pop();
  const ord = ORD[last] || (last.endsWith('y') ? `${last.slice(0, -1)}ieth` : `${last}th`);
  return [...w, ord].join(' ');
}

function fractionWords(a, b) {
  const num = Number(a);
  const den = Number(b);
  const name = DENOM[den] ? DENOM[den][num === 1 ? 0 : 1] : `${ordinalWords(den)}${num === 1 ? '' : 's'}`;
  return `${numberWords(num)} ${name}`;
}

const decimalWords = (s) => {
  const [i, d] = s.split('.');
  return `${numberWords(Number(i))} point ${d.split('').map((c) => ONES[Number(c)]).join(' ')}`;
};
const plainNumber = (s) => (s.includes('.') ? decimalWords(s) : numberWords(Number(s.replace(/,/g, ''))));

/**
 * Normalised speech chunks for `text`: split at sentence breaks and commas (natural pauses).
 * Each chunk is { words: [...], question: bool }.
 */
export function toChunks(text) {
  let t = ` ${String(text)} `;
  t = t.replace(/\p{Extended_Pictographic}|\u{FE0F}|\u{200D}|\u{20E3}|[\u{1F1E6}-\u{1F1FF}]/gu, ' ');
  t = t.replace(/’/g, "'").replace(/[“”]/g, '"');
  // Roman numerals (XLIV) are read letter by letter
  t = t.replace(/\b[IVXLC]{2,}\b/g, (r) => ` ${r.split('').join(' ')} `);
  // money
  t = t.replace(/GH₵\s?(\d[\d,]*(?:\.\d+)?)/g, (_, n) => ` ${plainNumber(n)} cedis `);
  t = t.replace(/\$\s?(\d[\d,]*(?:\.\d+)?)/g, (_, n) => ` ${plainNumber(n)} dollars `);
  t = t.replace(/GH₵/g, ' cedis ');
  // units
  t = t.replace(/(\d)\s?m²/g, '$1 square metres').replace(/(\d)\s?cm³/g, '$1 cubic centimetres');
  t = t.replace(/(\d)\s?cm\b/g, '$1 centimetres').replace(/(\d)\s?m\b/g, '$1 metres');
  t = t.replace(/(\d)\s?°C/g, '$1 degrees celsius').replace(/(\d)\s?%/g, '$1 percent');
  // times 4:05 → four oh five
  t = t.replace(/\b(\d{1,2}):(\d{2})\b/g, (_, h, m) => ` ${numberWords(Number(h))} ${m === '00' ? "o'clock" : Number(m) < 10 ? `oh ${numberWords(Number(m))}` : numberWords(Number(m))} `);
  // fractions and ratios
  t = t.replace(/\b(\d+)\/(\d+)\b/g, (_, a, b) => ` ${fractionWords(a, b)} `);
  t = t.replace(/\b(\d+):(\d+)\b/g, (_, a, b) => ` ${numberWords(Number(a))} to ${numberWords(Number(b))} `);
  // ordinals 1st 2nd
  t = t.replace(/\b(\d+)(st|nd|rd|th)\b/g, (_, n) => ` ${ordinalWords(Number(n))} `);
  // algebra like 3x → three x
  t = t.replace(/\b(\d+)x\b/g, '$1 x');
  // negative numbers
  t = t.replace(/(^|[\s(])[-−](\d)/g, '$1minus $2');
  // plain numbers (with thousands commas / decimals)
  t = t.replace(/\d{1,3}(?:,\d{3})+(?:\.\d+)?|\d+(?:\.\d+)?/g, (n) => ` ${plainNumber(n)} `);
  // symbols
  t = t
    .replace(/\s\+\s|\+/g, ' plus ')
    .replace(/\s[−-]\s/g, ' minus ')
    .replace(/×/g, ' times ')
    .replace(/÷/g, ' divided by ')
    .replace(/=/g, ' equals ')
    .replace(/&/g, ' and ')
    .replace(/_+/g, ' ');
  t = t.toLowerCase();
  const out = [];
  // Split at sentence ends and commas, remembering which pieces are questions.
  for (const m of t.matchAll(/([^.!?,;:…]+)([.!?,;:…]*)/g)) {
    const words = m[1]
      // keep apostrophes inside words (don't, it's, o'clock), drop other punctuation
      .replace(/[^a-z0-9'ɛɔŋ\s-]/g, ' ')
      .replace(/(^|\s)'+|'+(\s|$)/g, ' ')
      .replace(/\s-+|-+\s|^-+|-+$/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    if (words.length) out.push({ words, question: m[2].includes('?') });
  }
  return out;
}

/** Normalised word list for `text` (all chunks joined). */
export const toWords = (text) => toChunks(text).flatMap((c) => c.words);

export const phraseKey = (words) => words.join(' ');
