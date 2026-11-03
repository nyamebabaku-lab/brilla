import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import KidLayout, { useKid } from './KidLayout';
import Paywall from './Paywall';
import { useDB } from '../../data/store';
import { lessonsFor } from '../../curriculum';
import { subjectById } from '../../curriculum/subjects';
import { useChildAccess } from '../../lib/access';
import { Stars } from '../../components/ui';
import { Brill } from '../../components/brand';
import { cls } from '../../lib/format';
import { say } from '../../lib/speech';
import { sfx } from '../../lib/sfx';

const OFFSETS = [0, 28, 44, 28, 0, -28, -44, -28];
const DECOR = ['🌳', '🌸', '🍄', '🌻', '🦋', '🌴', '🪨', '🐞'];

export default function SubjectMap() {
  const { childId, subjectId } = useParams();
  const nav = useNavigate();
  const { child, isStudent } = useKid(childId);
  const settings = useDB((s) => s.settings);
  const prog = useDB((s) => s.progress[childId]);
  const { unlocked } = useChildAccess(child);
  const [paywall, setPaywall] = useState(false);
  const subject = subjectById(subjectId);
  const lessons = useMemo(() => (child ? lessonsFor(child.levelId, subjectId, { track: child.track, childName: child.name, settings }) : []), [child, subjectId, settings]);
  if (!child || !subject) return <KidLayout child={child} />;

  const currentIdx = lessons.findIndex((l) => !prog?.[l.id]);
  const open = (l) => {
    if (!l.free && !unlocked) {
      sfx('wrong');
      say('This lesson is locked. Ask a grown-up to unlock it!');
      return setPaywall(true);
    }
    sfx('pop');
    nav(`/kid/${child.id}/l/${l.id}`);
  };

  return (
    <KidLayout child={child} back={`/kid/${child.id}`} title={`${subject.emoji} ${subject.name}`}>
      <div className="mx-auto max-w-md">
        <div className="mb-6 flex items-center justify-center gap-3 rounded-3xl p-4 text-white shadow-chunky" style={{ background: subject.color }}>
          <span className="text-5xl">{subject.emoji}</span>
          <div>
            <h1 className="text-3xl font-semibold drop-shadow">{subject.name}</h1>
            <p className="opacity-90">
              {lessons.filter((l) => prog?.[l.id]).length} of {lessons.length} done
            </p>
          </div>
        </div>
        <div className="relative flex flex-col items-center gap-3 pb-10">
          {lessons.map((l, i) => {
            const done = prog?.[l.id];
            const locked = !l.free && !unlocked;
            const current = i === currentIdx;
            return (
              <div key={l.id} className="relative flex w-full flex-col items-center">
                {i > 0 && <div className="h-6 w-2 rounded-full bg-white/70" style={{ transform: `translateX(${(OFFSETS[i % 8] + OFFSETS[(i - 1) % 8]) / 2}%)` }} />}
                <div className="relative flex flex-col items-center" style={{ transform: `translateX(${OFFSETS[i % 8] * 2}%)` }}>
                  {current && !locked && <Brill size={46} className="absolute -left-14 top-2 animate-bob" />}
                  <button
                    onClick={() => open(l)}
                    className={cls(
                      'relative grid h-24 w-24 place-items-center rounded-full border-[6px] text-4xl shadow-chunky transition active:translate-y-1 active:shadow-none',
                      locked ? 'border-slate-200 bg-slate-100 grayscale' : done ? 'border-amber-300 bg-white' : 'border-white',
                      current && !locked && 'ring-8 ring-white/70 animate-pulse',
                    )}
                    style={!locked && !done ? { background: subject.color } : undefined}
                    aria-label={l.title}
                  >
                    <span className={locked ? 'opacity-40' : ''}>{l.emoji}</span>
                    {locked && (
                      <span className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-slate-700 text-white">
                        <Lock size={18} />
                      </span>
                    )}
                    {l.free && !unlocked && <span className="chip absolute -top-2 bg-emerald-500 text-white">FREE</span>}
                  </button>
                  <div className="mt-1.5 max-w-[11rem] rounded-xl bg-white/85 px-2 py-0.5 text-center text-sm font-semibold leading-tight">{l.title}</div>
                  {done && <Stars n={done.stars} size="text-base" />}
                </div>
                {i % 3 === 1 && <span className="pointer-events-none absolute top-6 text-3xl opacity-80" style={{ left: OFFSETS[i % 8] > 0 ? '8%' : '78%' }}>{DECOR[i % DECOR.length]}</span>}
              </div>
            );
          })}
          <div className="mt-4 text-5xl">🏆</div>
        </div>
      </div>
      <Paywall open={paywall} onClose={() => setPaywall(false)} child={child} isStudent={isStudent} />
    </KidLayout>
  );
}
