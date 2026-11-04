import { Volume2 } from 'lucide-react';
import { say } from '../lib/speech';
import { cls } from '../lib/format';

export function SpeakButton({ text, className, size = 22 }) {
  return (
    <button type="button" onClick={() => say(text)} className={cls('grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700 transition hover:bg-brand-200 active:scale-90', className)} aria-label="Read aloud">
      <Volume2 size={size} />
    </button>
  );
}

export function Prompt({ text, say: sayText }) {
  return (
    <div className="flex items-center justify-center gap-3">
      <SpeakButton text={sayText || text} />
      <h2 className="on-bg text-balance text-center text-2xl font-semibold leading-snug sm:text-3xl">{text}</h2>
    </div>
  );
}

export function NextButton({ onClick, children = 'Next', disabled, className }) {
  return (
    <button onClick={onClick} disabled={disabled} className={cls('btn-accent px-8 py-3.5 text-xl', className)}>
      {children} <span aria-hidden>→</span>
    </button>
  );
}
