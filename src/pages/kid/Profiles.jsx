import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { LogOut, Plus, Settings } from 'lucide-react';
import { useDB } from '../../data/store';
import { useShallow } from 'zustand/react/shallow';
import { useTheme, useUser } from '../../lib/hooks';
import { Brill, Logo, SpeechBubble } from '../../components/brand';
import { GrownUpGate, InstallButton, OfflineBadge } from '../../components/common';
import { levelName } from '../../curriculum/levels';
import { totalStars } from '../../lib/progress';
import { sfx } from '../../lib/sfx';
import { say } from '../../lib/speech';

export default function Profiles() {
  useTheme();
  const nav = useNavigate();
  const user = useUser();
  const session = useDB((s) => s.session);
  const kids = useDB(useShallow((s) => s.children.filter((c) => c.ownerId === user?.id)));
  const progress = useDB((s) => s.progress);
  const logout = useDB((s) => s.logout);
  const selectChild = useDB((s) => s.selectChild);
  const unlockParent = useDB((s) => s.unlockParent);
  const [gate, setGate] = useState(null);

  if (session.studentId) return <Navigate to={`/kid/${session.studentId}`} replace />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'teacher') return <Navigate to="/teacher" replace />;

  const open = (k) => {
    sfx('pop');
    say(`Hi ${k.name}!`);
    selectChild(k.id);
    nav(`/kid/${k.id}`);
  };

  return (
    <div className="mx-auto flex min-h-[100dvh] max-w-4xl flex-col px-4 py-5">
      <header className="flex items-center justify-between">
        <Logo />
        <div className="flex gap-2">
          <button onClick={() => setGate('/parent')} className="btn-white px-3 sm:px-4">
            <Settings size={18} /> <span className="hidden sm:inline">Grown-ups</span>
          </button>
          <button onClick={() => (logout(), nav('/'))} className="btn-white px-3" aria-label="Log out">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center py-8">
        <div className="mb-8 flex items-center gap-3">
          <Brill size={80} className="animate-bob" />
          <SpeechBubble className="text-xl">Who’s learning today?</SpeechBubble>
        </div>
        <div className="grid w-full grid-cols-2 gap-4 sm:grid-cols-3">
          {kids.map((k, i) => (
            <button key={k.id} onClick={() => open(k)} className="card flex flex-col items-center gap-2 p-5 transition hover:-translate-y-1 animate-pop" style={{ animationDelay: `${i * 80}ms` }}>
              <span className="grid h-24 w-24 place-items-center rounded-full text-6xl shadow-chunky-sm" style={{ background: k.theme?.brand ? `${k.theme.brand}22` : '#ede9fe' }}>
                {k.avatar}
              </span>
              <span className="text-2xl font-semibold">{k.name}</span>
              <span className="text-sm text-slate-500">
                {levelName(k.levelId, k.track)} · ⭐ {totalStars(progress[k.id])}
              </span>
            </button>
          ))}
          <button onClick={() => setGate('/parent?add=1')} className="flex min-h-[12rem] flex-col items-center justify-center gap-2 rounded-3xl border-4 border-dashed border-white/80 bg-white/40 p-5 text-slate-500 transition hover:bg-white/70">
            <Plus size={40} />
            <span className="font-semibold">Add a child</span>
          </button>
        </div>
      </div>
      <div className="flex justify-center">
        <InstallButton />
      </div>
      <GrownUpGate
        open={!!gate}
        onClose={() => setGate(null)}
        pin={user.pin}
        onPass={() => {
          unlockParent();
          nav(gate);
        }}
      />
      <OfflineBadge />
    </div>
  );
}
