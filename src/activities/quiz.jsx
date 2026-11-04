// Tap-to-answer activities: choice, learn card, phonics sound card, blending, reading, sorting and spelling.
import { useEffect, useMemo, useState } from 'react';
import Visual from '../components/Visual';
import { NextButton, Prompt, SpeakButton } from './common';
import { say, sayLetterSound } from '../lib/speech';
import { sfx } from '../lib/sfx';
import { cls, shuffle, rng, hash } from '../lib/format';
import { Brill } from '../components/brand';
import { playLocal } from '../lib/localAudio';
import { Volume2 } from 'lucide-react';

const TILE_COLORS = ['bg-rose-400', 'bg-amber-400', 'bg-emerald-400', 'bg-sky-400', 'bg-violet-400', 'bg-pink-400'];

export function Choice({ step, onDone }) {
  const [wrong, setWrong] = useState([]);
  const [right, setRight] = useState(null);
  const [shake, setShake] = useState(null);
  const [showPassage, setShowPassage] = useState(false);
  const emojiOnly = step.emojiOnly || step.emojiOptions;
  const hasGroups = step.options.some((o) => o.group);
  const short = step.options.every((o) => (o.label || '').length <= 4);

  // Ghanaian-language questions play the word itself (after the English question for non-listening steps).
  useEffect(() => {
    if (!step.localAudio) return;
    const t = setTimeout(() => playLocal(step.localAudio.lang, step.localAudio.word), step.listen ? 300 : 1700);
    return () => clearTimeout(t);
  }, [step]);

  const pickOpt = (i) => {
    if (right != null || wrong.includes(i)) return;
    const o = step.options[i];
    if (o.local) playLocal(o.local.lang, o.local.word);
    else if (step.soundOptions) sayLetterSound(o.label);
    else if (step.sayOptions || emojiOnly) say(o.label || '', { interrupt: true });
    if (i === step.answer) {
      setRight(i);
      sfx('correct');
      setTimeout(() => onDone({ mistakes: wrong.length, questions: 1 }), 900);
    } else {
      sfx('wrong');
      setShake(i);
      setWrong((w) => [...w, i]);
      setTimeout(() => setShake(null), 450);
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {step.passage && (
        <button onClick={() => setShowPassage((s) => !s)} className="btn-soft text-sm">
          📖 {showPassage ? 'Hide the story' : 'Read the story again'}
        </button>
      )}
      {showPassage && <p className="max-w-2xl rounded-2xl bg-white/90 p-4 text-lg leading-relaxed shadow-soft">{step.passage}</p>}
      <Prompt text={step.prompt} say={step.say || step.prompt} />
      {step.localAudio && (
        <button onClick={() => playLocal(step.localAudio.lang, step.localAudio.word)} className="flex items-center gap-2 rounded-3xl bg-amber-500 px-6 py-3 text-2xl font-bold text-white shadow-chunky transition active:translate-y-1 active:shadow-none">
          <Volume2 size={28} /> {step.listen ? 'Listen again' : step.localAudio.word.w}
        </button>
      )}
      {step.blendWord && (
        <div className="flex gap-2">
          {step.blendWord.split('').map((l, i) => (
            <button key={i} onClick={() => sayLetterSound(l)} className={cls('grid h-14 w-14 place-items-center rounded-2xl text-3xl font-bold text-white shadow-chunky-sm', TILE_COLORS[i % TILE_COLORS.length])}>
              {l}
            </button>
          ))}
        </div>
      )}
      {step.visual && (
        <div className="card flex min-h-[8rem] w-full max-w-xl items-center justify-center p-5">
          <Visual v={step.visual} />
        </div>
      )}
      <div className={cls('grid w-full max-w-2xl gap-3', step.options.length === 2 ? 'grid-cols-2' : step.options.length === 3 ? 'grid-cols-3' : short || emojiOnly ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-1 sm:grid-cols-2')}>
        {step.options.map((o, i) => {
          const isRight = right === i;
          const isWrong = wrong.includes(i);
          return (
            <button
              key={i}
              onClick={() => pickOpt(i)}
              className={cls(
                'relative flex min-h-[5rem] flex-col items-center justify-center gap-1 rounded-3xl border-4 bg-white p-3 font-semibold shadow-chunky transition active:translate-y-1 active:shadow-none',
                isRight ? 'scale-105 border-emerald-400 bg-emerald-50' : isWrong ? 'border-rose-200 opacity-40' : 'border-white hover:border-brand-200',
                shake === i && 'animate-shake',
              )}
            >
              {o.group ? (
                <span className="flex max-w-[10rem] flex-wrap justify-center gap-1 text-3xl">{o.group.map((e, j) => <span key={j}>{e}</span>)}</span>
              ) : o.emoji ? (
                <span className={cls(o.size === 'sm' ? 'text-3xl' : o.size === 'lg' ? 'text-7xl' : 'text-5xl')}>{o.emoji}</span>
              ) : null}
              {o.label && !(hasGroups && step.hideLabels) && !(step.emojiOnly && o.emoji) && (
                <span className={cls('text-balance text-center', step.bigText || short || step.emojiOptions ? 'text-3xl sm:text-4xl' : 'text-lg sm:text-xl', step.soundOptions && 'text-4xl')}>{o.label}</span>
              )}
              {isRight && <span className="absolute -right-2 -top-3 text-3xl animate-pop">✅</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Learn({ step, onDone }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="card flex w-full max-w-xl flex-col items-center gap-4 p-8">
        <div className="text-7xl animate-bob sm:text-8xl">{step.big}</div>
        <div className="flex items-center gap-3">
          <SpeakButton text={step.say} />
          <h2 className="text-3xl font-semibold">{step.title}</h2>
        </div>
        {step.text && <p className="text-xl text-slate-600">{step.text}</p>}
      </div>
      <NextButton onClick={() => onDone({})}>Got it!</NextButton>
    </div>
  );
}

export function SoundCard({ step, onDone }) {
  const [heard, setHeard] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => sayLetterSound(step.grapheme), 400);
    return () => clearTimeout(t);
  }, [step.grapheme]);
  return (
    <div className="flex flex-col items-center gap-6">
      <Prompt text="Listen and say the sound" />
      <button
        onClick={() => {
          sayLetterSound(step.grapheme);
          setHeard(true);
        }}
        className="grid h-44 w-44 place-items-center rounded-[2.5rem] bg-brand-600 text-8xl font-bold text-white shadow-chunky transition active:translate-y-1 active:shadow-none animate-pop"
      >
        {step.grapheme}
      </button>
      <div className="flex flex-wrap justify-center gap-3">
        {step.words.map((w) => (
          <button key={w.label} onClick={() => say(w.label)} className="card flex flex-col items-center px-5 py-3 transition active:scale-95">
            <span className="text-5xl">{w.emoji}</span>
            <span className="text-xl font-semibold">
              {w.label.split(step.grapheme).map((part, i, arr) => (
                <span key={i}>
                  {part}
                  {i < arr.length - 1 && <span className="text-accent-600 underline decoration-4">{step.grapheme}</span>}
                </span>
              ))}
            </span>
          </button>
        ))}
      </div>
      <NextButton onClick={() => onDone({})} className={heard ? '' : 'opacity-80'}>
        I said it!
      </NextButton>
    </div>
  );
}

export function Blend({ step, onDone }) {
  const [tapped, setTapped] = useState([]);
  const [blended, setBlended] = useState(false);
  const letters = step.word.split('');
  return (
    <div className="flex flex-col items-center gap-6">
      <Prompt text="Tap each sound, then blend!" say="Tap each sound. Then blend them together!" />
      <div className="flex gap-3">
        {letters.map((l, i) => (
          <button
            key={i}
            onClick={() => {
              sayLetterSound(l);
              setTapped((t) => [...new Set([...t, i])]);
            }}
            className={cls('grid h-24 w-24 place-items-center rounded-3xl text-6xl font-bold text-white shadow-chunky transition active:translate-y-1 active:shadow-none', TILE_COLORS[i % TILE_COLORS.length], tapped.includes(i) && 'ring-4 ring-white')}
          >
            {l}
          </button>
        ))}
      </div>
      {blended ? (
        <div className="card flex flex-col items-center gap-2 px-10 py-5 animate-pop">
          <span className="text-8xl">{step.emoji}</span>
          <span className="text-4xl font-bold text-brand-700">{step.word}</span>
        </div>
      ) : (
        <button
          disabled={tapped.length < letters.length}
          onClick={() => {
            setBlended(true);
            sfx('star');
            say(step.word, { rate: 0.8 });
          }}
          className="btn-primary px-8 py-3.5 text-xl"
        >
          🧩 Blend it!
        </button>
      )}
      {blended && <NextButton onClick={() => onDone({})} />}
    </div>
  );
}

export function Read({ step, onDone }) {
  return (
    <div className="flex flex-col items-center gap-5">
      <Prompt text="Read the story" say="Let's read the story" />
      <div className="card relative max-w-2xl p-6 sm:p-8">
        <SpeakButton text={step.say} className="absolute -right-3 -top-3 shadow-chunky-sm" />
        <p className="text-xl leading-relaxed sm:text-2xl sm:leading-relaxed">{step.text}</p>
      </div>
      <NextButton onClick={() => onDone({})}>I've read it</NextButton>
    </div>
  );
}

export function Sort({ step, onDone }) {
  const [placed, setPlaced] = useState({});
  const [sel, setSel] = useState(null);
  const [mistakes, setMistakes] = useState(0);
  const [shakeBin, setShakeBin] = useState(null);
  const left = step.items.map((it, i) => ({ ...it, i })).filter((it) => placed[it.i] == null);

  useEffect(() => {
    if (left.length === 0) {
      sfx('correct');
      const t = setTimeout(() => onDone({ mistakes: Math.min(mistakes, 3), questions: 3 }), 700);
      return () => clearTimeout(t);
    }
  }, [left.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const drop = (bin) => {
    if (sel == null) return say('First tap a picture, then tap a box');
    const it = step.items[sel];
    if (it.bin === bin) {
      sfx('pop');
      setPlaced((p) => ({ ...p, [sel]: bin }));
      setSel(null);
    } else {
      sfx('wrong');
      setMistakes((m) => m + 1);
      setShakeBin(bin);
      setTimeout(() => setShakeBin(null), 450);
    }
  };

  return (
    <div className="flex flex-col items-center gap-5">
      <Prompt text={step.prompt} say={`${step.prompt} Tap a picture, then tap the box it goes in.`} />
      <div className="flex min-h-[6.5rem] w-full max-w-2xl flex-wrap justify-center gap-3 rounded-3xl bg-white/60 p-3">
        {left.map((it) => (
          <button
            key={it.i}
            onClick={() => {
              setSel(it.i);
              sfx('tap');
              say(it.label);
            }}
            className={cls('flex min-w-[5.5rem] flex-col items-center rounded-2xl border-4 bg-white px-3 py-2 shadow-chunky-sm transition', sel === it.i ? 'scale-110 border-accent-400' : 'border-white')}
          >
            {it.emoji && <span className="text-4xl">{it.emoji}</span>}
            <span className={cls('font-semibold', it.emoji ? 'text-sm' : 'text-3xl')}>{it.label}</span>
          </button>
        ))}
        {!left.length && <span className="self-center text-2xl">🎉 All sorted!</span>}
      </div>
      <div className="grid w-full max-w-2xl grid-cols-2 gap-4">
        {step.bins.map((b, bi) => (
          <button key={bi} onClick={() => drop(bi)} className={cls('flex min-h-[11rem] flex-col items-center gap-2 rounded-3xl border-4 border-dashed p-3 transition', bi ? 'border-sky-300 bg-sky-50' : 'border-amber-300 bg-amber-50', sel != null && 'ring-4 ring-brand-200', shakeBin === bi && 'animate-shake')}>
            <span className="text-4xl">{b.emoji}</span>
            <span className="text-xl font-bold">{b.label}</span>
            <span className="flex flex-wrap justify-center gap-1 text-3xl">
              {step.items.map((it, i) => (placed[i] === bi ? <span key={i} className="animate-pop">{it.emoji || <span className="text-xl font-bold">{it.label}</span>}</span> : null))}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function Spell({ step, onDone }) {
  const word = step.word;
  const tiles = useMemo(() => {
    const r = rng(hash(word));
    const extra = 'aeioustnrm'.split('').filter((c) => !word.toLowerCase().includes(c));
    return shuffle(r, [...word.split(''), ...shuffle(r, extra).slice(0, word.length > 6 ? 3 : 2)]).map((ch, id) => ({ ch, id }));
  }, [word]);
  const [slots, setSlots] = useState([]);
  const [mistakes, setMistakes] = useState(0);
  const [shake, setShake] = useState(false);
  const [done, setDone] = useState(false);
  const used = new Set(slots.map((s) => s.id));

  useEffect(() => {
    const t = setTimeout(() => say(`Spell ${word}`), 300);
    return () => clearTimeout(t);
  }, [word]);

  const add = (t) => {
    if (done || slots.length >= word.length) return;
    sfx('tap');
    sayLetterSound(t.ch.toLowerCase());
    const next = [...slots, t];
    setSlots(next);
    if (next.length === word.length) {
      if (next.map((s) => s.ch).join('') === word) {
        setDone(true);
        sfx('correct');
        say(word);
        setTimeout(() => onDone({ mistakes: Math.min(mistakes, 3), questions: 1 }), 1000);
      } else {
        sfx('wrong');
        setMistakes((m) => m + 1);
        setShake(true);
        setTimeout(() => {
          setShake(false);
          // keep the correct prefix so children aren't sent back to the start
          let k = 0;
          while (k < next.length && next[k].ch === word[k]) k++;
          setSlots(next.slice(0, k));
        }, 600);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center gap-3">
        <SpeakButton text={word} />
        <h2 className="on-bg text-2xl font-semibold sm:text-3xl">Spell the word</h2>
      </div>
      <div className="text-8xl animate-bob">{step.emoji}</div>
      <div className={cls('flex flex-wrap justify-center gap-2', shake && 'animate-shake')}>
        {word.split('').map((_, i) => (
          <button key={i} onClick={() => !done && setSlots((s) => s.slice(0, i))} className={cls('grid h-16 w-14 place-items-center rounded-2xl border-4 text-4xl font-bold', slots[i] ? (done ? 'border-emerald-400 bg-emerald-50' : 'border-brand-400 bg-white') : 'border-dashed border-brand-300 bg-white/60')}>
            {slots[i]?.ch}
          </button>
        ))}
      </div>
      <div className="flex max-w-xl flex-wrap justify-center gap-2">
        {tiles.map((t, i) => (
          <button key={t.id} disabled={used.has(t.id) || done} onClick={() => add(t)} className={cls('grid h-16 w-16 place-items-center rounded-2xl text-4xl font-bold text-white shadow-chunky-sm transition active:translate-y-1 active:shadow-none disabled:opacity-20', TILE_COLORS[i % TILE_COLORS.length])}>
            {t.ch}
          </button>
        ))}
      </div>
      {mistakes >= 2 && !done && (
        <div className="flex items-center gap-2 animate-fade-in">
          <Brill size={44} mood="think" />
          <span className="rounded-2xl bg-white px-3 py-2 font-medium shadow-soft">
            Hint: it starts with <b className="text-brand-700">{word.slice(0, Math.min(word.length - 1, 1 + Math.floor(mistakes / 2)))}</b>
          </span>
        </div>
      )}
    </div>
  );
}
