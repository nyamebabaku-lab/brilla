import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { LogOut, Palette, Sticker, Users } from 'lucide-react';
import KidLayout, { useKid } from './KidLayout';
import Paywall from './Paywall';
import { useDB } from '../../data/store';
import { catalogFor } from '../../curriculum';
import { levelName } from '../../curriculum/levels';
import { useChildAccess } from '../../lib/access';
import { streak, subjectProgress } from '../../lib/progress';
import { Brill, SpeechBubble } from '../../components/brand';
import { GrownUpGate } from '../../components/common';
import { cls, fmtDate } from '../../lib/format';
import { say } from '../../lib/speech';
import { sfx } from '../../lib/sfx';

function Ring({ pct, color }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" className="absolute -right-1 -top-1 h-12 w-12 -rotate-90">
      <circle cx="32" cy="32" r={r} fill="white" stroke="#fff" strokeWidth="8" />
      <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="8" strokeDasharray={c} strokeDashoffset={c * (1 - pct)} strokeLinecap="round" />
    </svg>
  );
}

export default function KidHome() {
  const { childId } = useParams();
  const nav = useNavigate();
  const { child, user, isStudent } = useKid(childId);
  const settings = useDB((s) => s.settings);
  const prog = useDB((s) => s.progress[childId]);
  const usage = useDB((s) => s.usage[childId]);
  const assignments = useDB((s) => s.assignments);
  const logout = useDB((s) => s.logout);
  const { unlocked } = useChildAccess(child);
  const [paywall, setPaywall] = useState(false);
  const [gate, setGate] = useState(false);

  const catalog = useMemo(() => (child ? catalogFor(child.levelId, { track: child.track, childName: child.name, settings }) : []), [child, settings]);
  const per = useMemo(() => subjectProgress(catalog, prog), [catalog, prog]);
  if (!child) return <KidLayout child={null} />;

  const homework = child.classId ? assignments.filter((a) => a.classId === child.classId && !prog?.[a.lessonId]) : [];
  // Suggest the first unfinished lesson the child can open.
  let next = null;
  for (const g of catalog) {
    const l = g.lessons.find((x) => !prog?.[x.id] && (x.free || unlocked));
    if (l) {
      next = { ...l, subject: g.subject };
      break;
    }
  }
  const s = streak(usage);
  const hour = new Date().getHours();
  const greet = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <KidLayout child={child}>
      <section className="mb-5 flex flex-wrap items-center gap-3">
        <button onClick={() => say(`${greet} ${child.name}! What shall we learn today?`)} aria-label="Hear Brill">
          <Brill size={78} className="animate-bob" />
        </button>
        <SpeechBubble className="text-lg sm:text-xl">
          {greet}, {child.name}! {s > 1 ? `🔥 ${s} days in a row!` : 'What shall we learn today?'}
        </SpeechBubble>
        <span className="on-bg-muted ml-auto text-sm font-medium">{levelName(child.levelId, child.track)}</span>
      </section>

      {homework.length > 0 && (
        <section className="mb-5">
          <h2 className="on-bg mb-2 text-xl font-semibold">📌 From your teacher</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {homework.map((a) => (
              <Link key={a.id} to={`/kid/${child.id}/l/${a.lessonId}`} className="card flex items-center gap-3 p-4 transition hover:-translate-y-0.5">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-100 text-3xl">📝</span>
                <span className="min-w-0">
                  <span className="block truncate text-lg font-semibold">{a.title}</span>
                  <span className="text-sm text-slate-500">Due {fmtDate(a.due)}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {next && (
        <Link to={`/kid/${child.id}/l/${next.id}`} onClick={() => sfx('pop')} className="mb-6 flex items-center gap-4 rounded-[2rem] bg-brand-600 p-4 text-white shadow-chunky transition active:translate-y-1 active:shadow-none sm:p-5">
          <span className="grid h-16 w-16 shrink-0 place-items-center rounded-3xl bg-white/20 text-4xl">{next.emoji}</span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-medium opacity-80">Up next · {next.subject.name}</span>
            <span className="block truncate text-2xl font-semibold">{next.title}</span>
          </span>
          <span className="rounded-2xl bg-white px-4 py-2 text-lg font-bold text-brand-700">Play ▶</span>
        </Link>
      )}

      <section className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {per.map(({ subject, done, total }, i) => (
          <button
            key={subject.id}
            onClick={() => {
              sfx('pop');
              say(subject.name);
              nav(`/kid/${child.id}/s/${subject.id}`);
            }}
            className="kid-tile min-h-[10rem] animate-pop"
            style={{ background: subject.color, animationDelay: `${i * 50}ms` }}
          >
            <Ring pct={total ? done / total : 0} color={subject.color} />
            <span className="text-6xl drop-shadow">{subject.emoji}</span>
            <span className="text-xl drop-shadow">{subject.name}</span>
            <span className="rounded-full bg-white/30 px-2 text-xs">
              {done}/{total}
            </span>
          </button>
        ))}
      </section>

      {!unlocked && (
        <button onClick={() => setPaywall(true)} className="card mt-6 flex w-full items-center gap-3 p-4 text-left">
          <span className="text-4xl">🔓</span>
          <span className="flex-1">
            <span className="block text-lg font-semibold">You’re using free lessons</span>
            <span className="text-slate-500">{isStudent ? 'Ask your teacher to unlock every lesson.' : 'Ask a grown-up to unlock every lesson.'}</span>
          </span>
          <span className="btn-accent hidden sm:inline-flex">Unlock</span>
        </button>
      )}

      <nav className="fixed inset-x-0 bottom-0 z-30 px-3 safe-b">
        <div className="mx-auto flex max-w-md justify-around rounded-3xl bg-white/90 p-2 shadow-lift backdrop-blur">
          <Link to={`/kid/${child.id}/stickers`} className={cls('flex flex-col items-center px-4 py-1 text-xs font-semibold text-slate-600')}>
            <Sticker /> Stickers
          </Link>
          <Link to={`/kid/${child.id}/theme`} className="flex flex-col items-center px-4 py-1 text-xs font-semibold text-slate-600">
            <Palette /> Colours
          </Link>
          {isStudent ? (
            <button onClick={() => (logout(), nav('/class'))} className="flex flex-col items-center px-4 py-1 text-xs font-semibold text-slate-600">
              <LogOut /> Log out
            </button>
          ) : user?.role === 'teacher' ? (
            <button onClick={() => nav('/teacher')} className="flex flex-col items-center px-4 py-1 text-xs font-semibold text-slate-600">
              <Users /> Teacher
            </button>
          ) : (
            <button onClick={() => nav('/home')} className="flex flex-col items-center px-4 py-1 text-xs font-semibold text-slate-600">
              <Users /> Switch
            </button>
          )}
        </div>
      </nav>
      <Paywall open={paywall} onClose={() => setPaywall(false)} child={child} isStudent={isStudent} />
      <GrownUpGate open={gate} onClose={() => setGate(false)} pin={user?.pin} onPass={() => nav('/parent')} />
    </KidLayout>
  );
}
