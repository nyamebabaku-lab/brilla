// Demo data so every role has something to look at on first open.
import { DEFAULT_PRESETS, DEFAULT_THEME } from '../lib/theme';
import { DEFAULT_LANGUAGES } from '../curriculum/languagePacks';
import { addDays, rng, int, pick, todayKey } from '../lib/format';

export const AVATARS = ['🦁', '🐯', '🐼', '🐨', '🐸', '🦊', '🐰', '🐵', '🦄', '🐲', '🐙', '🦋', '🐬', '🦖', '🐧', '🐱', '🐶', '🦉'];
export const SECRET_PICTURES = ['🍎', '🚗', '⭐', '🐟', '🌸', '⚽', '🎈', '🌙', '🍌'];
export const STICKERS = ['🦄', '🌈', '🚀', '🦖', '🍦', '🎸', '🏆', '🐙', '🌻', '🎨', '🦋', '🍩', '⚡', '🐳', '🎉', '👑', '🐝', '🍉', '🪐', '🦜', '🧸', '🎁', '🐢', '🌟'];

export const DEFAULT_PLANS = {
  single: { id: 'single', name: 'Single', tagline: 'One child, all lessons', emoji: '🧒', maxKids: 1, perSeat: false, prices: { weekly: 10, monthly: 30, yearly: 300 }, features: ['1 child profile', 'All subjects for their class', 'Progress reports', 'Works offline'] },
  family: { id: 'family', name: 'Family', tagline: 'Up to 5 children', emoji: '👨‍👩‍👧‍👦', maxKids: 5, perSeat: false, prices: { weekly: 20, monthly: 60, yearly: 600 }, features: ['Up to 5 child profiles', 'Each child at their own level', 'Parent dashboard and screen time', 'Works offline'], popular: true },
  school: { id: 'school', name: 'School', tagline: 'Per student, for teachers', emoji: '🏫', maxKids: 500, perSeat: true, prices: { weekly: 5, monthly: 15, yearly: 150 }, features: ['Classes with join codes', 'Assign lessons and due dates', 'Class progress reports', 'Picture-password logins for pupils'] },
};
export const PERIODS = [
  { id: 'weekly', label: 'Weekly', days: 7, per: 'week' },
  { id: 'monthly', label: 'Monthly', days: 30, per: 'month' },
  { id: 'yearly', label: 'Yearly', days: 365, per: 'year' },
];

export const DEFAULT_SETTINGS = {
  appName: 'Brilla',
  currency: 'GH₵',
  freeLessons: 3,
  plans: DEFAULT_PLANS,
  presets: DEFAULT_PRESETS,
  defaultTheme: DEFAULT_THEME,
  lessonOverrides: {},
  languages: DEFAULT_LANGUAGES,
  ttsFallback: true,
  customLessons: [
    {
      id: 'custom_ghana1',
      levelId: 'p2',
      subjectId: 'science',
      title: 'Ghana: our country',
      emoji: '🇬🇭',
      intro: 'Ghana is in West Africa. Its capital city is Accra.',
      questions: [
        { prompt: 'What is the capital of Ghana?', options: ['Accra', 'Kumasi', 'Tamale', 'Cape Coast'], answer: 0, emoji: '🏙️' },
        { prompt: 'Which colour is NOT on the Ghana flag?', options: ['Blue', 'Red', 'Gold', 'Green'], answer: 0, emoji: '🇬🇭' },
        { prompt: 'What is in the middle of the Ghana flag?', options: ['A black star', 'A moon', 'A sun', 'An eagle'], answer: 0, emoji: '⭐' },
      ],
    },
  ],
};

const iso = (daysAgo) => addDays(new Date().toISOString(), -daysAgo);

export function buildSeed() {
  const r = rng(42);
  const users = [
    { id: 'u_admin', role: 'admin', name: 'Brilla Admin', email: 'admin@brilla.app', phone: '0240000001', password: 'demo123', createdAt: iso(200) },
    { id: 'u_parent', role: 'parent', plan: 'family', name: 'Adwoa Mensah', email: 'parent@brilla.app', phone: '0244123456', password: 'demo123', pin: '1234', createdAt: iso(60) },
    { id: 'u_single', role: 'parent', plan: 'single', name: 'Kwesi Boateng', email: 'single@brilla.app', phone: '0201234567', password: 'demo123', pin: '1234', createdAt: iso(3) },
    { id: 'u_expired', role: 'parent', plan: 'family', name: 'Efua Ansah', email: 'expired@brilla.app', phone: '0277123456', password: 'demo123', pin: '1234', createdAt: iso(40) },
    { id: 'u_teacher', role: 'teacher', plan: 'school', name: 'Mrs. Agyeman', schoolName: 'Sunrise Academy', email: 'teacher@brilla.app', phone: '0559876543', password: 'demo123', pin: '1234', createdAt: iso(90) },
  ];
  const kid = (id, ownerId, name, age, levelId, avatar, extra = {}) => ({ id, ownerId, name, age, levelId, track: 'ges', avatar, theme: DEFAULT_THEME, screenLimit: 0, createdAt: iso(50), ...extra });
  const children = [
    kid('c_ama', 'u_parent', 'Ama', 5, 'kg2', '🦄', { theme: { preset: 'candy', brand: '#db2777', accent: '#8b5cf6', bg: 'candy' } }),
    kid('c_kofi', 'u_parent', 'Kofi', 8, 'p3', '🦖', { theme: { preset: 'space', brand: '#6366f1', accent: '#facc15', bg: 'space' }, screenLimit: 60 }),
    kid('c_esi', 'u_parent', 'Esi', 3, 'n1', '🐰'),
    kid('c_yaw', 'u_single', 'Yaw', 6, 'p1', '🦁', { track: 'intl' }),
    kid('c_nana', 'u_expired', 'Nana', 7, 'p2', '🐼', { instructor: 'male' }),
  ];
  const classes = [
    { id: 'cl_gold', teacherId: 'u_teacher', name: 'P2 Gold', levelId: 'p2', code: 'GOLD42', createdAt: iso(80) },
    { id: 'cl_kg', teacherId: 'u_teacher', name: 'KG1 Stars', levelId: 'kg1', code: 'STAR17', createdAt: iso(80) },
  ];
  const pupils = [['Abena', '🐼'], ['Kojo', '🐯'], ['Efua', '🦋'], ['Kwame', '🐸'], ['Akosua', '🐬'], ['Fiifi', '🦊']];
  pupils.forEach(([name, avatar], i) => children.push(kid(`c_p${i}`, 'u_teacher', name, 7, 'p2', avatar, { classId: 'cl_gold', picture: SECRET_PICTURES[i] })));
  [['Nana', '🐨'], ['Selasi', '🐧'], ['Dede', '🐱']].forEach(([name, avatar], i) => children.push(kid(`c_k${i}`, 'u_teacher', name, 4, 'kg1', avatar, { classId: 'cl_kg', picture: SECRET_PICTURES[i + 3] })));

  const assignments = [
    { id: 'as1', classId: 'cl_gold', lessonId: 'p2.maths.3', title: '2, 5 and 10 times tables', due: addDays(new Date().toISOString(), 3).slice(0, 10), createdAt: iso(2) },
    { id: 'as2', classId: 'cl_gold', lessonId: 'p2.english.0', title: 'Plurals', due: addDays(new Date().toISOString(), 5).slice(0, 10), createdAt: iso(1) },
    { id: 'as3', classId: 'cl_kg', lessonId: 'kg1.phonics.0', title: 'Revise s a t i p n', due: addDays(new Date().toISOString(), 2).slice(0, 10), createdAt: iso(1) },
  ];

  // Subscriptions + payment history (extra customers give the admin dashboard real-looking numbers).
  const subscriptions = [
    { id: 's_parent', userId: 'u_parent', plan: 'family', period: 'monthly', seats: 1, amount: 60, status: 'active', autoRenew: true, startedAt: iso(12), expiresAt: addDays(iso(12), 30) },
    { id: 's_expired', userId: 'u_expired', plan: 'family', period: 'monthly', seats: 1, amount: 60, status: 'active', autoRenew: true, startedAt: iso(31), expiresAt: addDays(iso(31), 30) },
    { id: 's_teacher', userId: 'u_teacher', plan: 'school', period: 'yearly', seats: 30, amount: 4500, status: 'active', autoRenew: true, startedAt: iso(85), expiresAt: addDays(iso(85), 365) },
  ];
  const payments = [
    { id: 'p_1', ref: 'BRL204611A', userId: 'u_parent', plan: 'family', period: 'monthly', seats: 1, amount: 60, method: 'mtn', account: '0244123456', status: 'success', at: iso(42) },
    { id: 'p_2', ref: 'BRL318872C', userId: 'u_parent', plan: 'family', period: 'monthly', seats: 1, amount: 60, method: 'mtn', account: '0244123456', status: 'success', at: iso(12) },
    { id: 'p_e1', ref: 'BRL771204Q', userId: 'u_expired', plan: 'family', period: 'monthly', seats: 1, amount: 60, method: 'telecel', account: '0277123456', status: 'success', at: iso(31) },
    { id: 'p_3', ref: 'BRL551023K', userId: 'u_teacher', plan: 'school', period: 'yearly', seats: 30, amount: 4500, method: 'card', account: '**** 4242', status: 'success', at: iso(85) },
  ];
  const firstNames = ['Akua', 'Kweku', 'Afia', 'Yaa', 'Kofi', 'Mavis', 'Elikem', 'Sena', 'Ato', 'Naa', 'Joyce', 'Daniel', 'Grace', 'Samuel', 'Linda', 'Isaac'];
  const lastNames = ['Owusu', 'Asante', 'Addo', 'Darko', 'Quaye', 'Tetteh', 'Ofori', 'Amoah', 'Sarpong', 'Nkrumah'];
  for (let i = 0; i < 22; i++) {
    const plan = pick(r, ['single', 'single', 'family', 'family', 'family', 'school']);
    const period = pick(r, ['weekly', 'monthly', 'monthly', 'monthly', 'yearly']);
    const seats = plan === 'school' ? int(r, 15, 40) : 1;
    const price = DEFAULT_PLANS[plan].prices[period] * seats;
    const ago = int(r, 1, 170);
    const days = PERIODS.find((p) => p.id === period).days;
    const id = `u_demo${i}`;
    users.push({ id, role: plan === 'school' ? 'teacher' : 'parent', plan, name: `${pick(r, firstNames)} ${pick(r, lastNames)}`, email: `user${i}@example.com`, phone: `02${int(r, 40000000, 59999999)}`, password: 'demo123', pin: '1234', createdAt: iso(ago + 2), schoolName: plan === 'school' ? `${pick(r, lastNames)} Preparatory` : undefined });
    const method = pick(r, ['mtn', 'mtn', 'telecel', 'airteltigo', 'card']);
    payments.push({ id: `p_d${i}`, ref: `BRL${int(r, 100000, 999999)}${String.fromCharCode(65 + int(r, 0, 25))}`, userId: id, plan, period, seats, amount: price, method, account: method === 'card' ? '**** 1881' : '024xxxxxxx', status: r() < 0.08 ? 'failed' : 'success', at: iso(ago) });
    subscriptions.push({ id: `s_d${i}`, userId: id, plan, period, seats, amount: price, status: ago > days ? 'expired' : 'active', autoRenew: true, startedAt: iso(ago), expiresAt: addDays(iso(ago), days) });
  }

  // A few weeks of progress so dashboards and maps look lived-in.
  const progress = {};
  const usage = {};
  const stickers = {};
  const seedProgress = (childId, lessons) => {
    progress[childId] = {};
    lessons.forEach((id, i) => (progress[childId][id] = { stars: int(r, 1, 3), attempts: int(r, 1, 3), lastAt: iso(lessons.length - i) }));
    usage[childId] = {};
    for (let d = 0; d < 14; d++) if (r() < 0.75) usage[childId][todayKey(new Date(Date.now() - d * 86400000))] = { secs: int(r, 300, 2400), lessons: int(r, 1, 5) };
    stickers[childId] = Array.from({ length: Math.min(lessons.length, 12) }, () => pick(r, STICKERS));
  };
  seedProgress('c_ama', ['kg2.maths.0', 'kg2.maths.1', 'kg2.maths.2', 'kg2.phonics.0', 'kg2.phonics.1', 'kg2.trace.0', 'kg2.colour.0', 'kg2.english.0', 'kg2.english.1', 'kg2.science.0']);
  seedProgress('c_kofi', ['p3.maths.0', 'p3.maths.1', 'p3.maths.2', 'p3.maths.3', 'p3.english.0', 'p3.english.1', 'p3.science.0', 'p3.science.1', 'p3.science.2', 'p3.draw.0', 'p3.writing.0', 'p3.trace.0']);
  seedProgress('c_esi', ['n1.scribble.0', 'n1.colour.0', 'n1.maths.0']);
  seedProgress('c_yaw', ['p1.maths.0', 'p1.phonics.0']);
  ['c_p0', 'c_p1', 'c_p2', 'c_p3', 'c_p4', 'c_p5'].forEach((c, i) => seedProgress(c, ['p2.maths.0', 'p2.maths.1', 'p2.maths.2', 'p2.english.0', 'p2.science.0', 'p2.maths.3'].slice(0, 2 + i % 5)));
  ['c_k0', 'c_k1', 'c_k2'].forEach((c, i) => seedProgress(c, ['kg1.phonics.0', 'kg1.maths.0', 'kg1.maths.1'].slice(0, 1 + i)));

  return { users, children, classes, assignments, subscriptions, payments, progress, usage, stickers, gallery: {}, settings: DEFAULT_SETTINGS };
}
