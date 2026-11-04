// Starter word banks for Ghanaian languages. Admin can edit these, add words and categories,
// record native-speaker audio, and add more languages (Ewe, Dagbani, Fante…).
// `min` = lowest class level number (0 = Creche … 10 = P6) that sees the category.
// `draft: true` marks a pack that still needs checking by a native speaker.

const cat = (id, title, emoji, min, words) => ({
  id,
  title,
  emoji,
  min,
  words: words.map(([w, en, emoji], i) => ({ id: `${id}${i}`, w, en, emoji })),
});

const TWI = {
  id: 'twi',
  name: 'Twi',
  native: 'Asante Twi',
  flag: '🟡',
  draft: false,
  categories: [
    cat('greet', 'Greetings', '👋', 1, [
      ['Maakye', 'Good morning', '🌅'],
      ['Maaha', 'Good afternoon', '☀️'],
      ['Maadwo', 'Good evening', '🌙'],
      ['Akwaaba', 'Welcome', '🤗'],
      ['Medaase', 'Thank you', '🙏'],
      ['Mepa wo kyɛw', 'Please', '🙇'],
      ['Kafra', 'Sorry', '😔'],
      ['Nante yie', 'Goodbye (walk well)', '👋'],
    ]),
    cat('num', 'Numbers 1–10', '🔢', 1, [
      ['baako', 'one', '1️⃣'], ['mmienu', 'two', '2️⃣'], ['mmiɛnsa', 'three', '3️⃣'], ['ɛnan', 'four', '4️⃣'], ['enum', 'five', '5️⃣'],
      ['nsia', 'six', '6️⃣'], ['nson', 'seven', '7️⃣'], ['nwɔtwe', 'eight', '8️⃣'], ['nkron', 'nine', '9️⃣'], ['edu', 'ten', '🔟'],
    ]),
    cat('family', 'My family', '👨‍👩‍👧', 1, [
      ['maame', 'mother', '👩'], ['papa', 'father', '👨'], ['nua', 'brother / sister', '🧒'], ['nana', 'grandparent', '👵'], ['abofra', 'child', '👶'],
    ]),
    cat('body', 'My body', '🖐️', 1, [
      ['ti', 'head', '👤'], ['ani', 'eye', '👁️'], ['aso', 'ear', '👂'], ['hwene', 'nose', '👃'], ['ano', 'mouth', '👄'], ['se', 'teeth', '🦷'], ['nsa', 'hand', '✋'], ['nan', 'leg / foot', '🦶'],
    ]),
    cat('animals', 'Animals', '🐐', 1, [
      ['akokɔ', 'chicken', '🐔'], ['aponkye', 'goat', '🐐'], ['ɔkraman', 'dog', '🐕'], ['agyinamoa', 'cat', '🐈'], ['nantwie', 'cow', '🐄'], ['odwan', 'sheep', '🐑'],
      ['ɔwɔ', 'snake', '🐍'], ['ɔsono', 'elephant', '🐘'], ['gyata', 'lion', '🦁'], ['akyekyedeɛ', 'tortoise', '🐢'], ['anomaa', 'bird', '🐦'], ['apataa', 'fish', '🐟'], ['ananse', 'spider', '🕷️'],
    ]),
    cat('letters', 'Special letters', '🔤', 2, [
      ['ɛ', 'says "eh", as in ɛpo (sea)', '🌊'],
      ['ɔ', 'says "aw", as in ɔsono (elephant)', '🐘'],
    ]),
    cat('food', 'Food', '🍲', 2, [
      ['nsuo', 'water', '💧'], ['kosua', 'egg', '🥚'], ['bayerɛ', 'yam', '🍠'], ['brɔdeɛ', 'plantain', '🍌'], ['amango', 'mango', '🥭'], ['aborɔbɛ', 'pineapple', '🍍'],
      ['ankaa', 'orange', '🍊'], ['nkateɛ', 'groundnut', '🥜'], ['paanoo', 'bread', '🍞'], ['nam', 'meat', '🍖'],
    ]),
    cat('colours', 'Colours', '🎨', 2, [
      ['kɔkɔɔ', 'red', '🔴'], ['tuntum', 'black', '⚫'], ['fitaa', 'white', '⚪'], ['ahabammono', 'green', '🟢'], ['akokɔsradeɛ', 'yellow', '🟡'], ['bruu', 'blue', '🔵'],
    ]),
    cat('nature', 'Sky and nature', '🌳', 3, [
      ['owia', 'sun', '☀️'], ['ɔsram', 'moon', '🌙'], ['nsoromma', 'star', '⭐'], ['osuo', 'rain', '🌧️'], ['dua', 'tree', '🌳'], ['ɛpo', 'sea', '🌊'],
    ]),
    cat('school', 'Home and school', '🏫', 3, [
      ['sukuu', 'school', '🏫'], ['nwoma', 'book', '📖'], ['akonnwa', 'chair', '🪑'], ['efie', 'home', '🏠'], ['kyerɛkyerɛfoɔ', 'teacher', '🧑‍🏫'], ['sukuuni', 'pupil', '🧒'],
    ]),
    cat('days', 'Days of the week', '📅', 4, [
      ['Dwoada', 'Monday', '📅'], ['Benada', 'Tuesday', '📅'], ['Wukuada', 'Wednesday', '📅'], ['Yawoada', 'Thursday', '📅'], ['Fiada', 'Friday', '📅'], ['Memeneda', 'Saturday', '📅'], ['Kwasiada', 'Sunday', '📅'],
    ]),
    cat('phrases', 'Useful sentences', '💬', 5, [
      ['Wo ho te sɛn?', 'How are you?', '🙂'], ['Me ho yɛ', 'I am fine', '😊'], ['Yɛfrɛ me Ama', 'My name is Ama', '🙋'], ['Mepɛ nsuo', 'I want water', '💧'], ['Bra ha', 'Come here', '👉'], ['Tena ase', 'Sit down', '🪑'],
    ]),
  ],
};

const GA = {
  id: 'ga',
  name: 'Ga',
  native: 'Gã',
  flag: '🔵',
  draft: true,
  categories: [
    cat('greet', 'Greetings', '👋', 1, [
      ['Oyiwaladonn', 'Thank you', '🙏'], ['Ofainɛ', 'Please', '🙇'], ['Ojogbaŋŋ', 'Fine / well', '👍'], ['Ojekoo', 'Well done', '👏'],
    ]),
    cat('num', 'Numbers 1–10', '🔢', 1, [
      ['ekome', 'one', '1️⃣'], ['enyɔ', 'two', '2️⃣'], ['etɛ', 'three', '3️⃣'], ['ejwɛ', 'four', '4️⃣'], ['enumɔ', 'five', '5️⃣'],
      ['ekpaa', 'six', '6️⃣'], ['kpawo', 'seven', '7️⃣'], ['kpaanyɔ', 'eight', '8️⃣'], ['nɛɛhu', 'nine', '9️⃣'], ['nyɔŋma', 'ten', '🔟'],
    ]),
    cat('family', 'My family', '👨‍👩‍👧', 1, [
      ['nyɛ', 'mother', '👩'], ['tsɛ', 'father', '👨'], ['nyɛmi', 'brother / sister', '🧒'], ['bi', 'child', '👶'],
    ]),
    cat('body', 'My body', '🖐️', 1, [
      ['yitso', 'head', '👤'], ['hiŋmɛi', 'eyes', '👁️'], ['toi', 'ear', '👂'], ['naa', 'mouth', '👄'], ['nine', 'hand', '✋'], ['nane', 'leg / foot', '🦶'],
    ]),
    cat('animals', 'Animals', '🐐', 1, [
      ['gbee', 'dog', '🐕'], ['wuɔ', 'fowl / chicken', '🐔'], ['loo', 'fish', '🐟'],
    ]),
    cat('letters', 'Special letters', '🔤', 2, [
      ['ŋ', 'says "ng", as in ŋshɔ (sea)', '🌊'],
      ['gb', 'one sound, as in gbee (dog)', '🐕'],
    ]),
    cat('food', 'Food', '🍲', 2, [
      ['nu', 'water', '💧'], ['komi', 'kenkey', '🍙'], ['amango', 'mango', '🥭'],
    ]),
    cat('colours', 'Colours', '🎨', 2, [
      ['tsuru', 'red', '🔴'], ['diŋ', 'black', '⚫'], ['yɛŋ', 'white', '⚪'],
    ]),
    cat('nature', 'Sky and nature', '🌳', 3, [
      ['hulu', 'sun', '☀️'], ['ŋshɔ', 'sea', '🌊'], ['tso', 'tree', '🌳'],
    ]),
    cat('school', 'Home and school', '🏫', 3, [
      ['wolo', 'book', '📖'], ['skul', 'school', '🏫'],
    ]),
  ],
};

export const DEFAULT_LANGUAGES = { twi: TWI, ga: GA };
