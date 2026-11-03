// Copy-writing on handwriting lines, and short compositions for older pupils.
import { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { NextButton, SpeakButton } from './common';
import { say } from '../lib/speech';
import { sfx } from '../lib/sfx';
import { cls } from '../lib/format';

export function WriteLines({ step, onDone }) {
  const wrap = useRef(null);
  const cv = useRef(null);
  const last = useRef(null);
  const [w, setW] = useState(600);
  const [ink, setInk] = useState(0);
  const h = Math.round(Math.min(220, Math.max(150, w * 0.32)));
  const needed = Math.max(140, step.text.replace(/\s/g, '').length * 70);

  useEffect(() => {
    const fit = () => setW(Math.min(wrap.current?.clientWidth || 600, 820));
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);
  const paintLines = () => {
    const c = cv.current;
    const dpr = window.devicePixelRatio || 1;
    c.width = w * dpr;
    c.height = h * dpr;
    c.style.width = `${w}px`;
    c.style.height = `${h}px`;
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;
    [0.2, 0.8].forEach((f) => {
      ctx.beginPath();
      ctx.moveTo(10, h * f);
      ctx.lineTo(w - 10, h * f);
      ctx.stroke();
    });
    ctx.strokeStyle = '#fca5a5';
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(10, h / 2);
    ctx.lineTo(w - 10, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);
    setInk(0);
  };
  useEffect(paintLines, [w, h]);
  useEffect(() => {
    const t = setTimeout(() => say(`Copy: ${step.text}`), 300);
    return () => clearTimeout(t);
  }, [step.text]);

  const pos = (e) => {
    const r = cv.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const down = (e) => {
    e.preventDefault();
    cv.current.setPointerCapture?.(e.pointerId);
    last.current = pos(e);
  };
  const move = (e) => {
    if (!last.current) return;
    const p = pos(e);
    const ctx = cv.current.getContext('2d');
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last.current.x, last.current.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    setInk((n) => n + Math.hypot(p.x - last.current.x, p.y - last.current.y));
    last.current = p;
  };
  const up = () => (last.current = null);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <SpeakButton text={step.text} />
        <h2 className="text-2xl font-semibold sm:text-3xl">Copy it neatly</h2>
      </div>
      <div className={cls('card px-6 py-4 text-center text-4xl text-brand-800 sm:text-5xl', step.cursive ? 'font-cursive font-bold' : 'font-medium')}>{step.text}</div>
      <div ref={wrap} className="flex w-full justify-center">
        <canvas ref={cv} className="touch-none rounded-3xl border-4 border-white shadow-lift" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up} />
      </div>
      <div className="flex gap-3">
        <button onClick={paintLines} className="btn-white">
          <RotateCcw size={18} /> Again
        </button>
        <NextButton
          disabled={ink < needed}
          onClick={() => {
            sfx('correct');
            say('Lovely handwriting!');
            onDone({ creative: true });
          }}
        >
          Done
        </NextButton>
      </div>
    </div>
  );
}

export function Compose({ step, onDone, onSaveText }) {
  const [text, setText] = useState('');
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  const ok = words >= step.minWords;
  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <SpeakButton text={step.prompt} />
        <h2 className="text-balance text-center text-2xl font-semibold">{step.prompt}</h2>
      </div>
      <div className="card w-full max-w-2xl p-3">
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={9} placeholder="Start writing here…" className="w-full resize-none rounded-2xl bg-[repeating-linear-gradient(transparent,transparent_35px,#dbeafe_36px)] p-3 text-xl leading-9 outline-none" />
        <div className="flex items-center justify-between px-2 pt-1 text-sm">
          <span className={ok ? 'font-semibold text-emerald-600' : 'text-slate-500'}>
            {words} / {step.minWords} words {ok && '✅'}
          </span>
          <span className="text-slate-400">Tip: use capital letters and full stops.</span>
        </div>
      </div>
      <NextButton
        disabled={!ok}
        onClick={() => {
          onSaveText?.({ text, title: step.prompt });
          sfx('star');
          onDone({ creative: true });
        }}
      >
        Finish
      </NextButton>
    </div>
  );
}
