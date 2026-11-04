// Ghanaian-language flashcard: picture, word, meaning, and the word read aloud.
import { useEffect, useState } from 'react';
import { Volume2 } from 'lucide-react';
import { NextButton } from './common';
import { playLocal } from '../lib/localAudio';
import { say } from '../lib/speech';
import { cls } from '../lib/format';

export default function WordCard({ step, onDone }) {
  const [heard, setHeard] = useState(0);
  const letter = [...step.w].length <= 2;
  const play = () => {
    playLocal(step.lang, step);
    setHeard((h) => h + 1);
  };
  useEffect(() => {
    // Meaning in English first, then the word itself.
    say(letter ? `This letter` : step.en);
    const t = setTimeout(() => playLocal(step.lang, step), letter ? 900 : 1400);
    return () => clearTimeout(t);
  }, [step]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <span className="chip bg-amber-100 text-amber-800">🇬🇭 {step.langName}</span>
      <div className="card flex w-full max-w-md flex-col items-center gap-3 p-8 animate-pop">
        <div className="text-8xl animate-bob">{step.emoji}</div>
        <button onClick={play} className={cls('flex items-center gap-3 rounded-3xl bg-brand-600 px-6 py-3 font-bold text-white shadow-chunky transition active:translate-y-1 active:shadow-none', letter ? 'text-7xl' : 'text-4xl sm:text-5xl')}>
          {step.w} <Volume2 size={32} />
        </button>
        <p className="text-2xl text-slate-600">{step.en}</p>
      </div>
      <p className="on-bg-muted text-lg">Tap the word, listen, and say it out loud! 🗣️</p>
      <NextButton onClick={() => onDone({})} className={heard ? '' : 'opacity-90'}>
        I said it!
      </NextButton>
    </div>
  );
}
