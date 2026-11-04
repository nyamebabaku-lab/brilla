// "Watch me first": the instructor solves one example (with a different question) before the child tries.
import { useEffect, useRef, useState } from 'react';
import Visual from '../components/Visual';
import { NextButton } from './common';
import { say, sayLetterSound } from '../lib/speech';
import { playLocal } from '../lib/localAudio';
import { sfx } from '../lib/sfx';
import { cls } from '../lib/format';
import { useDB } from '../data/store';
import { instructorOf } from '../lib/instructors';

const TILE = ['bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-sky-400', 'bg-violet-400', 'bg-pink-400'];
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function Teacher({ child, text }) {
  const t = instructorOf(child);
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-16 w-16 shrink-0 place-items-center rounded-full bg-white text-5xl shadow-chunky-sm animate-bob">{t.emoji}</span>
      <div className="relative rounded-2xl bg-white px-4 py-2.5 shadow-soft">
        <div className="text-xs font-semibold text-brand-600">{t.name}</div>
        <div className="text-lg font-semibold">{text}</div>
        <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 bg-white" />
      </div>
    </div>
  );
}

export default function Example({ step, onDone, child }) {
  const ex = step.example;
  const [phase, setPhase] = useState(0); // 0 = thinking, 1 = showing answer, 2 = your turn
  const [spelled, setSpelled] = useState(0);
  const alive = useRef(true);
  const voiceOn = useDB((s) => s.prefs.voice);

  useEffect(() => {
    alive.current = true;
    (async () => {
      await wait(300);
      if (ex.type === 'spell') {
        await say(`Watch me spell ${ex.word}.`);
        for (let i = 1; i <= ex.word.length && alive.current; i++) {
          setSpelled(i);
          sfx('tap');
          await sayLetterSound(ex.word[i - 1].toLowerCase());
          await wait(250);
        }
        if (!alive.current) return;
        setPhase(1);
        sfx('correct');
        await say(`${ex.word.split('').join(', ')}. ${ex.word}!`);
      } else if (ex.type === 'sort') {
        const it = ex.items[0];
        await say(`Watch me. ${ex.prompt}`);
        if (!alive.current) return;
        setPhase(1);
        sfx('pop');
        await say(`${it.label} goes in ${ex.bins[it.bin].label}.`);
      } else {
        await say(`Watch me. ${ex.say || ex.prompt}`);
        if (ex.localAudio) {
          await playLocal(ex.localAudio.lang, ex.localAudio.word);
          await wait(1200);
        }
        if (!alive.current) return;
        await wait(voiceOn ? 400 : 1200);
        setPhase(1);
        sfx('correct');
        await say(`The answer is ${answerText(ex)}. ${ex.explain || ''}`);
      }
      if (!alive.current) return;
      setPhase(2);
      say('Now you try!');
    })();
    return () => {
      alive.current = false;
    };
  }, [ex]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center gap-5">
      <Teacher child={child} text={phase < 2 ? 'Watch me first! 👀' : 'Now you try! 💪'} />
      <div className="card relative flex w-full max-w-2xl flex-col items-center gap-4 p-5">
        <span className="chip absolute -top-3 left-5 bg-accent-500 text-white">Example</span>
        {ex.type === 'spell' ? (
          <>
            <div className="text-7xl">{ex.emoji}</div>
            <div className="flex gap-2">
              {ex.word.split('').map((ch, i) => (
                <span key={i} className={cls('grid h-16 w-14 place-items-center rounded-2xl text-4xl font-bold', i < spelled ? `${TILE[i % TILE.length]} text-white animate-pop` : 'border-4 border-dashed border-brand-200')}>
                  {i < spelled ? ch : ''}
                </span>
              ))}
            </div>
          </>
        ) : ex.type === 'sort' ? (
          <>
            <h3 className="text-center text-xl font-semibold">{ex.prompt}</h3>
            <div className="grid w-full grid-cols-2 gap-3">
              {ex.bins.map((b, bi) => (
                <div key={bi} className="flex min-h-[7rem] flex-col items-center gap-1 rounded-3xl border-4 border-dashed border-brand-200 bg-brand-50/50 p-3">
                  <span className="text-3xl">{b.emoji}</span>
                  <b>{b.label}</b>
                  {phase >= 1 && ex.items[0].bin === bi && <span className="text-4xl animate-pop">{ex.items[0].emoji || ex.items[0].label}</span>}
                </div>
              ))}
            </div>
            {phase === 0 && (
              <div className="flex flex-col items-center animate-bob">
                <span className="text-5xl">{ex.items[0].emoji}</span>
                <b>{ex.items[0].label}</b>
              </div>
            )}
          </>
        ) : (
          <>
            <h3 className="text-balance text-center text-xl font-semibold sm:text-2xl">{ex.prompt}</h3>
            {ex.visual && <Visual v={ex.visual} />}
            {ex.localAudio && <span className="rounded-2xl bg-amber-100 px-4 py-1.5 text-xl font-bold text-amber-800">🔊 {ex.localAudio.word.w}</span>}
            <div className={cls('grid w-full gap-2', ex.options.length <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-4')}>
              {ex.options.map((o, i) => (
                <div key={i} className={cls('flex min-h-[4rem] flex-col items-center justify-center rounded-2xl border-4 bg-white p-2 text-center font-semibold transition-all duration-500', phase >= 1 && i === ex.answer ? 'scale-110 border-emerald-400 bg-emerald-50' : phase >= 1 ? 'opacity-30' : 'border-slate-100')}>
                  {o.group ? <span className="flex flex-wrap justify-center text-2xl">{o.group.join('')}</span> : o.emoji ? <span className={o.size === 'sm' ? 'text-2xl' : 'text-4xl'}>{o.emoji}</span> : null}
                  {o.label && !(o.group && ex.hideLabels) && <span className="text-xl">{o.label}</span>}
                  {phase >= 1 && i === ex.answer && <span className="text-2xl">👆</span>}
                </div>
              ))}
            </div>
            {phase >= 1 && ex.explain && <p className="rounded-2xl bg-emerald-50 px-4 py-2 text-center text-lg text-emerald-800 animate-fade-in">💡 {ex.explain}</p>}
          </>
        )}
      </div>
      <NextButton onClick={() => onDone({})} disabled={phase < 1}>
        My turn!
      </NextButton>
    </div>
  );
}

export function answerText(q) {
  const o = q.options[q.answer];
  if (q.answerText) return q.answerText;
  if (o.label) return o.label;
  if (o.size) return o.size === 'lg' ? 'the big one' : 'the small one';
  if (o.group) return `the group with ${o.group.length}`;
  return 'this one';
}
