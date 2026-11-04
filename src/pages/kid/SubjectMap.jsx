import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Lock } from 'lucide-react';
import KidLayout, { useKid } from './KidLayout';
import Paywall from './Paywall';
import UnitLocked from './UnitLocked';
import { useDB } from '../../data/store';
import { lessonsFor, UNIT_SIZE } from '../../curriculum';
import { subjectById } from '../../curriculum/subjects';
import { useChildAccess } from '../../lib/access';
import { Stars } from '../../components/ui';
import { Brill } from '../../components/brand';
import { cls, daysBetween } from '../../lib/format';
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
  const { canOpen, paid, expired, units: openUnits, nextUnit } = useChildAccess(child);
  const [unitLock, setUnitLock] = useState(null);
  const update = useDB((s) => s.update);
  const [paywall, setPaywall] = useState(false);
  const [unit, setUnit] = useState(null);
  const unitBar = useRef(null);
  const subject = subjectById(subjectId);
  const lessons = useMemo(() => (child ? lessonsFor(child.levelId, subjectId, { track: child.track, childName: child.name, lang: child.localLang, settings }) : []), [child, subjectId, settings]);
  useEffect(() => {
    unitBar.current?.querySelector('[data-active="true"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [unit, lessons.length]);
  if (!child || !subject) return <KidLayout child={child} />;

  const currentIdx = lessons.findIndex((l) => !prog?.[l.id]);
  const units = Math.ceil(lessons.length / UNIT_SIZE);
  // Start on the unit the child is working in (but never past the last open unit).
  const workingUnit = Math.max(0, Math.floor(Math.max(0, currentIdx) / UNIT_SIZE));
  const activeUnit = unit ?? (paid ? Math.min(workingUnit, Math.max(0, openUnits - 1)) : workingUnit);
  const unitIsLocked = (u) => paid && !expired && u >= openUnits && !lessons.slice(u * UNIT_SIZE, (u + 1) * UNIT_SIZE).every((l) => l.custom);
  const shown = lessons.slice(activeUnit * UNIT_SIZE, (activeUnit + 1) * UNIT_SIZE);
  const open = (l) => {
    if (!canOpen(l)) {
      sfx('wrong');
      if (paid && !l.custom && Math.floor(l.order / UNIT_SIZE) >= openUnits) {
        say('This unit opens soon! A new unit opens every week.');
        return setUnitLock(Math.floor(l.order / UNIT_SIZE));
      }
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
        {subjectId === 'language' && (
          <div className="mb-6 flex flex-wrap justify-center gap-2">
            {Object.values(settings.languages || {}).map((l) => (
              <button
                key={l.id}
                onClick={() => {
                  update('children', child.id, { localLang: l.id });
                  sfx('pop');
                  say(l.name);
                }}
                className={cls('rounded-2xl px-5 py-2.5 text-lg font-bold shadow-chunky-sm transition', (child.localLang || 'twi') === l.id ? 'bg-amber-500 text-white' : 'bg-white text-slate-700')}
              >
                {l.flag} {l.name}
              </button>
            ))}
          </div>
        )}
        <div ref={unitBar} className="no-scrollbar -mx-3 mb-5 flex gap-2 overflow-x-auto px-3 pb-1">
          {Array.from({ length: units }, (_, u) => {
            const part = lessons.slice(u * UNIT_SIZE, (u + 1) * UNIT_SIZE);
            const done = part.filter((l) => prog?.[l.id]).length;
            const bonus = part.every((l) => l.custom);
            const locked = unitIsLocked(u);
            const days = u === openUnits && nextUnit ? Math.max(1, daysBetween(new Date(), nextUnit)) : null;
            return (
              <button key={u} data-active={u === activeUnit} onClick={() => (setUnit(u), sfx('tap'))} className={cls('flex shrink-0 flex-col items-center rounded-2xl px-3 py-1.5 text-sm font-semibold shadow-chunky-sm', u === activeUnit ? 'bg-brand-600 text-white' : locked ? 'bg-white/60 text-slate-400' : 'bg-white text-slate-600')}>
                <span>{bonus ? '⭐ Bonus' : `${locked ? '🔒 ' : ''}Unit ${u + 1}`}</span>
                <span className={cls('text-xs', u === activeUnit ? 'opacity-90' : 'text-slate-400')}>{locked ? (days ? `in ${days} day${days > 1 ? 's' : ''}` : u === openUnits ? 'next week' : `week ${u + 1}`) : done === part.length ? '✅ done' : `${done}/${part.length}`}</span>
              </button>
            );
          })}
        </div>
        {unitIsLocked(activeUnit) && (
          <button onClick={() => setUnitLock(activeUnit)} className="card mb-5 flex w-full items-center gap-3 p-4 text-left">
            <span className="text-4xl">🎁</span>
            <span>
              <span className="block text-lg font-semibold">Unit {activeUnit + 1} opens {activeUnit === openUnits && nextUnit ? `on ${new Date(nextUnit).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'short' })}` : activeUnit === openUnits ? 'with next week’s payment' : `in week ${activeUnit + 1}`}</span>
              <span className="text-sm text-slate-500">A new unit of 50 lessons opens every paid week.</span>
            </span>
          </button>
        )}
        <div className="relative flex flex-col items-center gap-3 pb-10">
          {shown.map((l, k) => {
            const i = activeUnit * UNIT_SIZE + k;
            const done = prog?.[l.id];
            const locked = !canOpen(l);
            const current = i === currentIdx;
            return (
              <div key={l.id} className="relative flex w-full flex-col items-center">
                {k > 0 && <div className="h-6 w-2 rounded-full bg-white/70" style={{ transform: `translateX(${(OFFSETS[i % 8] + OFFSETS[(i - 1) % 8]) / 2}%)` }} />}
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
                    {l.free && !paid && <span className="chip absolute -top-2 bg-emerald-500 text-white">FREE</span>}
                  </button>
                  <div className="mt-1.5 max-w-[11rem] rounded-xl bg-white/85 px-2 py-0.5 text-center text-sm font-semibold leading-tight">{l.title}</div>
                  {done && <Stars n={done.stars} size="text-base" />}
                </div>
                {i % 3 === 1 && <span className="pointer-events-none absolute top-6 text-3xl opacity-80" style={{ left: OFFSETS[i % 8] > 0 ? '8%' : '78%' }}>{DECOR[i % DECOR.length]}</span>}
              </div>
            );
          })}
          {activeUnit < units - 1 ? (
            <button onClick={() => (setUnit(activeUnit + 1), window.scrollTo({ top: 0, behavior: 'smooth' }))} className="btn-accent mt-4 px-6 py-3 text-lg">
              Next: Unit {activeUnit + 2} →
            </button>
          ) : (
            <div className="mt-4 text-5xl">🏆</div>
          )}
        </div>
      </div>
      <Paywall open={paywall} onClose={() => setPaywall(false)} child={child} isStudent={isStudent} />
      <UnitLocked open={unitLock != null} unit={unitLock ?? 0} onClose={() => setUnitLock(null)} openUnits={openUnits} nextUnit={nextUnit} />
    </KidLayout>
  );
}
