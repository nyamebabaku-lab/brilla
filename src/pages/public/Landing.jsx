import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Headphones, Palette, ShieldCheck, Smartphone, WifiOff, GraduationCap, Music, Languages, Presentation } from 'lucide-react';
import { PublicHeader, InstallButton } from '../../components/common';
import { Brill, SpeechBubble } from '../../components/brand';
import { SUBJECTS } from '../../curriculum/subjects';
import { LEVELS } from '../../curriculum/levels';
import { countAllLessons, UNIT_SIZE } from '../../curriculum';
import { useDB } from '../../data/store';
import { useTheme } from '../../lib/hooks';
import { money } from '../../lib/format';

const FEATURES = [
  { icon: <WifiOff />, title: 'Works offline', body: 'Install once and every lesson works without data. Perfect for the car, the village or a power cut.' },
  { icon: <Presentation />, title: 'Example first, then practise', body: 'Auntie Akos or Uncle Kwame shows a worked example before every new kind of question, then children try it themselves.' },
  { icon: <Languages />, title: 'Twi and Ga', body: 'Greetings, numbers, family, animals and more in Ghanaian languages, with recordings by native speakers.' },
  { icon: <Music />, title: 'Gentle music', body: 'Soft background tunes (classic nursery melodies) that quieten when the teacher speaks. Easy to switch off.' },
  { icon: <Headphones />, title: 'Reads aloud', body: 'Every instruction is spoken, so even children who can’t read yet can learn on their own.' },
  { icon: <GraduationCap />, title: 'GES or International', body: 'Lessons follow the Ghana curriculum with local examples, or switch to an international track.' },
  { icon: <Palette />, title: 'Their colours, their way', body: 'Kids pick a theme (Rainbow, Ocean, Jungle, Candy, Space…) or mix their own colours.' },
  { icon: <ShieldCheck />, title: 'Safe for kids', body: 'No ads, no chat. Grown-up areas are locked behind a PIN and a maths question.' },
  { icon: <Smartphone />, title: 'Every device', body: 'Phones, tablets and computers: iPhone, Android, Windows, Mac or Chromebook.' },
];

export default function Landing() {
  useTheme();
  const settings = useDB((s) => s.settings);
  const total = useMemo(() => countAllLessons(settings), [settings]);
  const family = settings.plans.family;

  return (
    <div>
      <PublicHeader />
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-6 md:grid-cols-2 md:pt-12">
        <div className="animate-fade-in">
          <span className="chip mb-4 bg-white text-brand-700 shadow-soft">🎉 Ages 2–12 · Creche to Primary 6</span>
          <h1 className="on-bg text-balance text-5xl font-bold leading-[1.05] sm:text-6xl">
            Learning that feels like <span className="rainbow-text">play</span>.
          </h1>
          <p className="on-bg-muted mt-5 max-w-lg text-xl">Tracing, colouring, drawing, phonics, maths, science and English, with lessons made for each child’s class. {total.toLocaleString()} lessons, 1,000 per subject for every class, that work offline.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/signup" className="btn-accent px-7 py-3.5 text-lg">
              Start free
            </Link>
            <Link to="/login" className="btn-white px-7 py-3.5 text-lg">
              Try the demo
            </Link>
          </div>
          <p className="on-bg-muted mt-4 text-sm">
            {settings.freeLessons} free lessons in every subject. One plan for up to {family?.maxKids || 5} children: {money(family?.prices.weekly, settings.currency)}/week. Pay with MoMo or card.
          </p>
        </div>
        <div className="relative mx-auto aspect-square w-full max-w-md">
          <div className="absolute inset-6 rounded-[3rem] bg-white/70 shadow-lift" />
          <div className="absolute inset-0 grid grid-cols-3 gap-3 p-10">
            {SUBJECTS.map((s, i) => (
              <div key={s.id} className="kid-tile animate-pop text-sm" style={{ background: s.color, animationDelay: `${i * 70}ms` }}>
                <span className="text-4xl">{s.emoji}</span>
                <span className="leading-tight">{s.name}</span>
              </div>
            ))}
          </div>
          <div className="absolute -bottom-4 -left-2 flex items-center gap-2 animate-float">
            <Brill size={86} />
            <SpeechBubble>Hi! I’m Brill. Let’s learn!</SpeechBubble>
          </div>
        </div>
      </section>

      {/* Levels */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="on-bg mb-2 text-center text-3xl font-semibold">A learning path for every class</h2>
        <p className="on-bg-muted mb-6 text-center">Each child gets lessons for their class, and the difficulty grows with them.</p>
        <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2 md:flex-wrap md:justify-center">
          {LEVELS.map((l) => (
            <div key={l.id} className="card flex w-32 shrink-0 flex-col items-center p-3 text-center">
              <span className="grid h-12 w-12 place-items-center rounded-2xl text-2xl" style={{ background: `${l.color}33` }}>
                {l.emoji}
              </span>
              <span className="mt-1 font-semibold">{l.name}</span>
              <span className="text-xs text-slate-500">Age {l.age}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Subjects */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <h2 className="on-bg mb-6 text-center text-3xl font-semibold">Ten subjects, thousands of activities</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SUBJECTS.map((s) => (
            <div key={s.id} className="card flex items-center gap-4 p-5">
              <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl text-4xl shadow-chunky-sm" style={{ background: s.color }}>
                {s.emoji}
              </span>
              <div>
                <h3 className="text-xl font-semibold">{s.name}</h3>
                <p className="text-slate-500">{s.blurb}</p>
                <p className="text-xs text-slate-400">
                  {LEVELS[s.from].name} – {LEVELS[s.to].name}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="card p-6">
              <div className="mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700">{f.icon}</div>
              <h3 className="text-lg font-semibold">{f.title}</h3>
              <p className="text-slate-500">{f.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Packages */}
      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="card grid items-center gap-6 p-8 md:grid-cols-[1fr_auto]">
          <div>
            <h2 className="text-3xl font-semibold">One simple plan for the whole family</h2>
            <p className="mt-2 text-slate-500">
              Up to {family?.maxKids || 5} children for {money(family?.prices.weekly, settings.currency)} a week. Every paid week opens a new unit of {UNIT_SIZE} lessons in every subject. Pay weekly, monthly or yearly with MTN MoMo, Telecel Cash, AirtelTigo Money or card.
            </p>
          </div>
          <Link to="/pricing" className="btn-primary px-7 py-3.5 text-lg">
            See prices
          </Link>
        </div>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-12 text-center">
        <InstallButton />
        <p className="on-bg-muted text-sm">© {new Date().getFullYear()} Brilla · Made with ❤️ for curious kids</p>
      </footer>
    </div>
  );
}
