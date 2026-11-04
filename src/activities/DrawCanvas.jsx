// Free drawing and scribbling: colours, brush sizes, rainbow and glow brushes, stamps, eraser, undo and save to gallery.
import { useEffect, useRef, useState } from 'react';
import { Eraser, Paintbrush, RotateCcw, Trash2, Undo2 } from 'lucide-react';
import { NextButton, SpeakButton } from './common';
import { say } from '../lib/speech';
import { sfx } from '../lib/sfx';
import { cls } from '../lib/format';

const COLORS = ['#1f2937', '#ef4444', '#f97316', '#facc15', '#22c55e', '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899', '#92400e', '#ffffff', '#a3e635'];
const STAMPS = ['⭐', '❤️', '🌸', '🦋', '🐱', '🐶', '🦁', '🐟', '☀️', '🌈', '🚗', '🎈', '🍎', '🌙'];
const SIZES = [6, 14, 28];

export default function DrawCanvas({ step, onDone, onSave }) {
  const scribble = step.mode === 'scribble';
  const wrap = useRef(null);
  const cv = useRef(null);
  const last = useRef(null);
  const hue = useRef(0);
  const history = useRef([]);
  const [size, setSize] = useState({ w: 600, h: 420 });
  const [tool, setTool] = useState(step.brush === 'stamps' ? 'stamp' : step.brush === 'rainbow' ? 'rainbow' : step.brush === 'glow' ? 'glow' : 'brush');
  const [color, setColor] = useState(COLORS[6]);
  const [bsize, setBsize] = useState(scribble ? SIZES[2] : SIZES[1]);
  const [stamp, setStamp] = useState(STAMPS[0]);
  const [strokes, setStrokes] = useState(0);

  useEffect(() => {
    const fit = () => {
      const w = Math.min(wrap.current?.clientWidth || 600, 900);
      const h = Math.max(260, Math.min(Math.round(w * 0.68), window.innerHeight - 300));
      setSize({ w, h });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  useEffect(() => {
    const c = cv.current;
    const dpr = window.devicePixelRatio || 1;
    c.width = size.w * dpr;
    c.height = size.h * dpr;
    c.style.width = `${size.w}px`;
    c.style.height = `${size.h}px`;
    const ctx = c.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = step.brush === 'glow' ? '#111827' : '#ffffff';
    ctx.fillRect(0, 0, size.w, size.h);
    history.current = [];
    setStrokes(0);
  }, [size, step.brush]);

  useEffect(() => {
    const t = setTimeout(() => say(step.prompt), 300);
    return () => clearTimeout(t);
  }, [step.prompt]);

  const snapshot = () => {
    const c = cv.current;
    history.current.push(c.getContext('2d').getImageData(0, 0, c.width, c.height));
    if (history.current.length > 20) history.current.shift();
  };
  const undo = () => {
    const img = history.current.pop();
    if (!img) return;
    cv.current.getContext('2d').putImageData(img, 0, 0);
    setStrokes((s) => Math.max(0, s - 1));
  };
  const clear = () => {
    snapshot();
    const ctx = cv.current.getContext('2d');
    ctx.fillStyle = step.brush === 'glow' ? '#111827' : '#ffffff';
    ctx.fillRect(0, 0, size.w, size.h);
  };

  const pos = (e) => {
    const r = cv.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const paint = (a, b) => {
    const ctx = cv.current.getContext('2d');
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.shadowBlur = 0;
    if (tool === 'eraser') {
      ctx.strokeStyle = step.brush === 'glow' ? '#111827' : '#ffffff';
      ctx.lineWidth = bsize * 1.6;
    } else if (tool === 'rainbow') {
      hue.current = (hue.current + 6) % 360;
      ctx.strokeStyle = `hsl(${hue.current} 90% 55%)`;
      ctx.lineWidth = bsize;
    } else if (tool === 'glow') {
      hue.current = (hue.current + 4) % 360;
      ctx.strokeStyle = `hsl(${hue.current} 100% 65%)`;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.shadowBlur = 18;
      ctx.lineWidth = bsize * 0.7;
    } else {
      ctx.strokeStyle = color;
      ctx.lineWidth = bsize;
    }
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };
  const down = (e) => {
    e.preventDefault();
    cv.current.setPointerCapture?.(e.pointerId);
    snapshot();
    const p = pos(e);
    if (tool === 'stamp') {
      const ctx = cv.current.getContext('2d');
      ctx.shadowBlur = 0;
      ctx.font = `${bsize * 2.6 + 20}px serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stamp, p.x, p.y);
      sfx('pop');
      setStrokes((s) => s + 1);
      return;
    }
    last.current = p;
    paint(p, { x: p.x + 0.1, y: p.y });
  };
  const move = (e) => {
    if (!last.current) return;
    const p = pos(e);
    paint(last.current, p);
    last.current = p;
  };
  const up = () => {
    if (last.current) setStrokes((s) => s + 1);
    last.current = null;
  };

  const finish = () => {
    const c = cv.current;
    const max = 600;
    const scale = Math.min(1, max / size.w);
    const out = document.createElement('canvas');
    out.width = Math.round(size.w * scale);
    out.height = Math.round(size.h * scale);
    out.getContext('2d').drawImage(c, 0, 0, out.width, out.height);
    onSave?.({ image: out.toDataURL('image/jpeg', 0.72), title: step.prompt });
    sfx('star');
    say('What a wonderful picture!');
    onDone({ creative: true });
  };

  const tools = [
    { id: 'brush', icon: <Paintbrush size={20} />, label: 'Brush' },
    { id: 'rainbow', icon: <span className="text-lg">🌈</span>, label: 'Rainbow' },
    { id: 'glow', icon: <span className="text-lg">✨</span>, label: 'Glow' },
    { id: 'stamp', icon: <span className="text-lg">⭐</span>, label: 'Stamps' },
    { id: 'eraser', icon: <Eraser size={20} />, label: 'Eraser' },
  ];

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-3">
        <SpeakButton text={step.prompt} />
        <h2 className="on-bg text-balance text-center text-2xl font-semibold sm:text-3xl">
          {step.emoji} {step.prompt}
        </h2>
      </div>
      <div className="flex w-full max-w-[900px] flex-wrap items-center justify-center gap-2 rounded-3xl bg-white/90 p-2 shadow-soft">
        {tools.map((t) => (
          <button key={t.id} onClick={() => setTool(t.id)} className={cls('flex h-11 items-center gap-1.5 rounded-2xl px-3 text-sm font-semibold transition', tool === t.id ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600')} aria-label={t.label}>
            {t.icon}
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
        <span className="mx-1 h-8 w-px bg-slate-200" />
        {SIZES.map((s) => (
          <button key={s} onClick={() => setBsize(s)} className={cls('grid h-11 w-11 place-items-center rounded-2xl', bsize === s ? 'bg-brand-100 ring-2 ring-brand-400' : 'bg-slate-100')} aria-label={`Size ${s}`}>
            <span className="rounded-full bg-ink" style={{ width: s / 1.6 + 4, height: s / 1.6 + 4 }} />
          </button>
        ))}
        <span className="mx-1 h-8 w-px bg-slate-200" />
        <button onClick={undo} className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-600" aria-label="Undo">
          <Undo2 size={20} />
        </button>
        <button onClick={clear} className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-600" aria-label="Clear">
          <Trash2 size={20} />
        </button>
      </div>
      {tool === 'stamp' ? (
        <div className="no-scrollbar flex max-w-full gap-1.5 overflow-x-auto rounded-2xl bg-white/80 p-1.5">
          {STAMPS.map((s) => (
            <button key={s} onClick={() => setStamp(s)} className={cls('grid h-11 w-11 shrink-0 place-items-center rounded-xl text-2xl', stamp === s ? 'bg-accent-100 ring-2 ring-accent-400' : '')}>
              {s}
            </button>
          ))}
        </div>
      ) : tool === 'brush' ? (
        <div className="flex flex-wrap justify-center gap-1.5">
          {COLORS.map((c) => (
            <button key={c} onClick={() => setColor(c)} className={cls('h-10 w-10 rounded-full border-4 shadow-chunky-sm transition', color === c ? 'scale-110 border-ink' : 'border-white')} style={{ background: c }} aria-label={`Colour ${c}`} />
          ))}
        </div>
      ) : null}
      <div ref={wrap} className="flex w-full justify-center">
        <canvas ref={cv} className="touch-none rounded-3xl border-4 border-white shadow-lift" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up} />
      </div>
      <div className="flex gap-3">
        <button onClick={clear} className="btn-white">
          <RotateCcw size={18} /> Start over
        </button>
        <NextButton onClick={finish} disabled={strokes < 2}>
          I'm finished!
        </NextButton>
      </div>
    </div>
  );
}
