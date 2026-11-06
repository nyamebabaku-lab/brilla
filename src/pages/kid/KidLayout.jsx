// Shared frame for kid screens: child theme, top bar, time tracking and screen-time limit.
import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ArrowLeft, Music, Volume2, VolumeX } from 'lucide-react';
import { useDB } from '../../data/store';
import { useChild, useTheme } from '../../lib/hooks';
import { totalStars, minutesToday } from '../../lib/progress';
import { GrownUpGate, OfflineBadge } from '../../components/common';
import { Brill } from '../../components/brand';
import { todayKey } from '../../lib/format';
import { setInstructor } from '../../lib/speech';
import { setChildName } from '../../lib/voiceBank';
import { useChildAccess } from '../../lib/access';
import RenewWall from './RenewWall';

export function useKid(childId) {
  const child = useChild(childId);
  const session = useDB((s) => s.session);
  const user = useDB((s) => s.users.find((u) => u.id === s.session.userId));
  // Pupils can only open themselves; parents/teachers only their own children (admin may preview anyone).
  const allowed = child && (session.studentId ? session.studentId === child.id : user && (user.role === 'admin' || child.ownerId === user.id));
  return { child: allowed ? child : null, user, isStudent: !!session.studentId };
}

export default function KidLayout({ child, back, title, children, hideBar }) {
  useTheme(child?.theme);
  const nav = useNavigate();
  const prefs = useDB((s) => s.prefs);
  const setPrefs = useDB((s) => s.setPrefs);
  const prog = useDB((s) => s.progress[child?.id]);
  const usage = useDB((s) => s.usage[child?.id]);
  const addTime = useDB((s) => s.addTime);
  const owner = useDB((s) => s.users.find((u) => u.id === child?.ownerId));
  const [gate, setGate] = useState(false);
  const { expired } = useChildAccess(child);
  const isStudent = useDB((s) => !!s.session.studentId);

  useEffect(() => {
    setInstructor(child?.instructor || 'female');
  }, [child?.instructor]);
  useEffect(() => setChildName(child?.name), [child?.name]);

  useEffect(() => {
    if (!child) return;
    const t = setInterval(() => document.visibilityState === 'visible' && addTime(child.id, 15), 15000);
    return () => clearInterval(t);
  }, [child, addTime]);

  if (!child) return <Navigate to="/home" replace />;
  const extra = usage?.[todayKey()]?.extra || 0;
  const overLimit = child.screenLimit > 0 && minutesToday(usage) >= child.screenLimit + extra;

  const extend = () => {
    useDB.setState((s) => {
      const day = todayKey();
      const u = s.usage[child.id]?.[day] || { secs: 0, lessons: 0 };
      return { usage: { ...s.usage, [child.id]: { ...s.usage[child.id], [day]: { ...u, extra: (u.extra || 0) + 15 } } } };
    });
    setGate(false);
  };

  return (
    <div className="min-h-[100dvh]">
      {!hideBar && (
        <header className="sticky top-0 z-30 px-3 pt-3">
          <div className="mx-auto flex max-w-6xl items-center gap-2 rounded-3xl bg-white/85 p-2 shadow-soft backdrop-blur">
            {back && (
              <button onClick={() => nav(back)} className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-700 active:scale-95" aria-label="Back">
                <ArrowLeft />
              </button>
            )}
            <Link to={`/kid/${child.id}`} className="flex min-w-0 items-center gap-2">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-accent-100 text-3xl">{child.avatar}</span>
              <span className="truncate text-lg font-semibold">{title || child.name}</span>
            </Link>
            <div className="ml-auto flex items-center gap-1.5">
              <Link to={`/kid/${child.id}/stickers`} className="flex h-12 items-center gap-1 rounded-2xl bg-amber-100 px-3 text-lg font-bold text-amber-700">
                ⭐ {totalStars(prog)}
              </Link>
              <button onClick={() => setPrefs({ music: prefs.music === false })} className={`grid h-12 w-12 place-items-center rounded-2xl ${prefs.music === false ? 'bg-slate-100 text-slate-400' : 'bg-brand-100 text-brand-700'}`} aria-label={prefs.music === false ? 'Turn music on' : 'Turn music off'}>
                <Music className={prefs.music === false ? 'opacity-50' : ''} />
              </button>
              <button onClick={() => setPrefs({ voice: !prefs.voice, sound: !prefs.voice })} className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-100 text-slate-600" aria-label={prefs.voice ? 'Turn sound off' : 'Turn sound on'}>
                {prefs.voice ? <Volume2 /> : <VolumeX />}
              </button>
            </div>
          </div>
        </header>
      )}
      <main className="mx-auto max-w-6xl px-3 pb-24 pt-4 sm:px-4">{children}</main>
      <OfflineBadge />
      {expired && <RenewWall child={child} isStudent={isStudent} />}
      {!expired && overLimit && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/60 p-4 backdrop-blur">
          <div className="card max-w-sm p-8 text-center animate-scale-in">
            <Brill size={90} mood="happy" className="mx-auto animate-bob" />
            <h2 className="mt-3 text-3xl font-semibold">Time for a break!</h2>
            <p className="mt-2 text-lg text-slate-600">You learned so much today, {child.name}. Let’s rest our eyes and play outside! 🌞</p>
            <div className="mt-5 flex flex-col gap-2">
              <button onClick={() => nav('/home')} className="btn-accent py-3">
                OK, bye for now
              </button>
              <button onClick={() => setGate(true)} className="btn-ghost text-sm">
                Grown-up: add 15 minutes
              </button>
            </div>
          </div>
          <GrownUpGate open={gate} onClose={() => setGate(false)} onPass={extend} pin={owner?.pin} />
        </div>
      )}
    </div>
  );
}
