// Tracing: a faint dotted guide (letter, number, word or path) and a check of how much of it the child has covered.
import { useCallback, useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { NextButton, SpeakButton } from './common';
import { say } from '../lib/speech';
import { sfx } from '../lib/sfx';
import { cls } from '../lib/format';
import { Brill } from '../components/brand';
import { PATH_NAMES, sayFor } from './traceText';

export const TRACE_PATHS = {
  down: 'M50 12 V88',
  across: 'M12 50 H88',
  slant: 'M20 15 L80 85',
  slant2: 'M80 15 L20 85',
  wave: 'M8 50 Q22 22 36 50 T64 50 T92 50',
  zigzag: 'M8 70 L22 30 L36 70 L50 30 L64 70 L78 30 L92 70',
  curve: 'M12 80 Q50 -5 88 80',
  loop: 'M8 70 C20 20 40 20 38 50 C36 78 62 78 60 50 C58 20 80 20 92 70',
  circle: 'M50 12 A38 38 0 1 1 49.9 12',
  oval: 'M50 22 A42 28 0 1 1 49.9 22',
  square: 'M16 16 H84 V84 H16 Z',
  triangle: 'M50 12 L88 86 H12 Z',
  diamond: 'M50 8 L88 50 L50 92 L12 50 Z',
  star: 'M50 8 L61 36 L91 37 L67 56 L76 86 L50 69 L24 86 L33 56 L9 37 L39 36 Z',
  heart: 'M50 86 C10 58 6 30 24 20 C36 13 46 20 50 30 C54 20 64 13 76 20 C94 30 90 58 50 86 Z',
};
// Measures a guide path (in its 0–100 box) so the demo pen can follow it.
const pathCache = {};
function pathEl(d) {
  if (pathCache[d]) return pathCache[d];
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('style', 'position:absolute;width:0;height:0;overflow:hidden');
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  el.setAttribute('d', d);
  svg.appendChild(el);
  document.body.appendChild(svg);
  pathCache[d] = el;
  return el;
}
const ACCENT = '#f97316';

const INK = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
const PASS = 0.7;


export default function TraceCanvas({ step, onDone }) {
  const wrap = useRef(null);
  const guide = useRef(null);
  const ink = useRef(null);
  const hit = useRef(null);
  const target = useRef([]);
  const wide = step.kind === 'word' || step.kind === 'cursive' || step.target.length > 1;
  const [size, setSize] = useState({ w: 320, h: 320 });
  const [cover, setCover] = useState(0);
  const [nudge, setNudge] = useState('');
  const [done, setDone] = useState(false);
  const [demo, setDemo] = useState(true);
  const demoCv = useRef(null);
  const demoRun = useRef(0);
  const drawing = useRef(null);
  const color = useRef(0);
  const stats = useRef({ inside: 0, total: 0 });

  // Fit the canvas to the screen.
  useEffect(() => {
    const fit = () => {
      const avail = Math.min(wrap.current?.clientWidth || 320, 720);
      const maxH = Math.max(240, window.innerHeight - 330);
      const w = wide ? avail : Math.min(avail, maxH, 460);
      const h = wide ? Math.min(Math.round(w * 0.5), maxH) : w;
      setSize({ w, h });
    };
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [wide]);

  const lineW = Math.max(14, Math.round(Math.min(size.w, size.h) / (wide ? 9 : 11)));

  /** Draws the guide into `ctx`; mode 'show' = pretty dotted guide, 'mask' = solid area that counts as on-target. */
  const paintGuide = useCallback(
    (ctx, mode, extra = 0) => {
      const { w, h } = size;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (step.kind === 'path') {
        const s = Math.min(w, h) / 100;
        ctx.save();
        ctx.translate((w - 100 * s) / 2, (h - 100 * s) / 2);
        ctx.scale(s, s);
        const p = new Path2D(TRACE_PATHS[step.target]);
        if (mode === 'show') {
          ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--brand-100') ? `rgb(${getComputedStyle(document.documentElement).getPropertyValue('--brand-100')})` : '#ede9fe';
          ctx.lineWidth = (lineW * 1.3) / s;
          ctx.stroke(p);
          ctx.setLineDash([2.5, 4]);
          ctx.strokeStyle = '#a5b4fc';
          ctx.lineWidth = 2.2;
          ctx.stroke(p);
          const m = TRACE_PATHS[step.target].match(/M\s*([\d.]+)[\s,]+([\d.]+)/);
          if (m) {
            ctx.setLineDash([]);
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(+m[1], +m[2], 4.5, 0, Math.PI * 2);
            ctx.fill();
          }
        } else if (mode === 'demo') {
          const el = pathEl(TRACE_PATHS[step.target]);
          const len = el.getTotalLength();
          ctx.strokeStyle = ACCENT;
          ctx.lineWidth = (lineW * 0.5) / s;
          ctx.setLineDash([len * extra, len + 10]);
          ctx.stroke(p);
          ctx.setLineDash([]);
          const pt = el.getPointAtLength(len * extra);
          ctx.font = `${26 / s}px serif`;
          ctx.fillText('✏️', pt.x - 2 / s, pt.y - 22 / s);
        } else {
          ctx.strokeStyle = '#000';
          ctx.lineWidth = (lineW * 0.55 + extra) / s;
          ctx.stroke(p);
        }
        ctx.restore();
        return;
      }
      const cursive = step.kind === 'cursive';
      const family = cursive ? '"Dancing Script"' : 'Fredoka';
      let fs = h * (cursive ? 0.62 : 0.72);
      ctx.font = `${cursive ? 700 : 500} ${fs}px ${family}`;
      const tw = ctx.measureText(step.target).width;
      if (tw > w * 0.9) {
        fs *= (w * 0.9) / tw;
        ctx.font = `${cursive ? 700 : 500} ${fs}px ${family}`;
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const y = h / 2 + fs * 0.04;
      if (mode === 'show') {
        // handwriting lines
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 2;
        [0.18, 0.82].forEach((f) => {
          ctx.beginPath();
          ctx.moveTo(8, h * f);
          ctx.lineTo(w - 8, h * f);
          ctx.stroke();
        });
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(8, h / 2);
        ctx.lineTo(w - 8, h / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = '#ede9fe';
        ctx.fillText(step.target, w / 2, y);
        ctx.setLineDash([3, 5]);
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 2;
        ctx.strokeText(step.target, w / 2, y);
        ctx.setLineDash([]);
      } else if (mode === 'demo') {
        // The teacher's pen sweeps across the letters, drawing them as it goes.
        const tw2 = ctx.measureText(step.target).width;
        const x0 = w / 2 - tw2 / 2 - 10;
        const edge = x0 + (tw2 + 20) * extra;
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, 0, edge, h);
        ctx.clip();
        ctx.strokeStyle = ACCENT;
        ctx.lineWidth = Math.max(4, fs / 22);
        ctx.strokeText(step.target, w / 2, y);
        ctx.restore();
        if (extra < 1) {
          ctx.font = `${Math.max(28, fs / 6)}px serif`;
          ctx.fillText('✏️', edge, y - fs * 0.3 + Math.sin(extra * 40) * fs * 0.15);
        }
      } else {
        ctx.fillStyle = '#000';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = extra;
        ctx.fillText(step.target, w / 2, y);
        if (extra) ctx.strokeText(step.target, w / 2, y);
      }
    },
    [size, step, lineW],
  );

  const reset = useCallback(() => {
    const { w, h } = size;
    const dpr = window.devicePixelRatio || 1;
    [guide, ink, demoCv].forEach((r) => {
      r.current.width = w * dpr;
      r.current.height = h * dpr;
      r.current.style.width = `${w}px`;
      r.current.style.height = `${h}px`;
      r.current.getContext('2d').setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    hit.current = hit.current || document.createElement('canvas');
    hit.current.width = w;
    hit.current.height = h;
    hit.current.getContext('2d').clearRect(0, 0, w, h);
    ink.current.getContext('2d').clearRect(0, 0, w, h);
    paintGuide(guide.current.getContext('2d'), 'show');
    // Target sample points
    const m = document.createElement('canvas');
    m.width = w;
    m.height = h;
    const mctx = m.getContext('2d', { willReadFrequently: true });
    paintGuide(mctx, 'mask');
    const data = mctx.getImageData(0, 0, w, h).data;
    const pts = [];
    const stepPx = 4;
    for (let y = 0; y < h; y += stepPx) for (let x = 0; x < w; x += stepPx) if (data[(y * w + x) * 4 + 3] > 100) pts.push(y * w + x);
    target.current = pts;
    // Generous "on target" zone for checking stray scribbles
    const zone = document.createElement('canvas');
    zone.width = w;
    zone.height = h;
    const zctx = zone.getContext('2d', { willReadFrequently: true });
    paintGuide(zctx, 'mask', lineW * 1.6);
    zone.data = zctx.getImageData(0, 0, w, h).data;
    hit.current.zone = zone.data;
    stats.current = { inside: 0, total: 0 };
    setCover(0);
    setNudge('');
    setDone(false);
  }, [size, paintGuide, lineW]);

  useEffect(() => {
    let alive = true;
    const fonts = step.kind === 'cursive' ? '700 40px "Dancing Script"' : '500 40px Fredoka';
    (document.fonts?.load ? document.fonts.load(fonts) : Promise.resolve()).finally(() => alive && (reset(), runDemo()));
    return () => {
      alive = false;
      demoRun.current++;
    };
  }, [reset, step.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  /** "Watch me": the teacher's pen traces the guide once, then it's the child's turn. */
  const runDemo = async () => {
    const run = ++demoRun.current;
    setDemo(true);
    const ctx = demoCv.current?.getContext('2d');
    if (!ctx) return setDemo(false);
    const speech = say(`Watch me. ${sayFor(step)}`);
    const dur = 2600;
    const t0 = performance.now();
    await new Promise((resolve) => {
      const frame = (t) => {
        if (run !== demoRun.current) return resolve();
        const p = Math.min(1, (t - t0) / dur);
        ctx.clearRect(0, 0, size.w, size.h);
        paintGuide(ctx, 'demo', p);
        if (p < 1) requestAnimationFrame(frame);
        else resolve();
      };
      requestAnimationFrame(frame);
    });
    await Promise.race([speech, new Promise((r) => setTimeout(r, 1500))]);
    if (run !== demoRun.current) return;
    endDemo(true);
  };
  const endDemo = (announce) => {
    demoRun.current++;
    demoCv.current?.getContext('2d').clearRect(0, 0, size.w, size.h);
    setDemo(false);
    if (announce) say(step.kind === 'path' ? 'Your turn! Start at the green dot and follow the dots.' : 'Your turn! Follow the dotted lines.');
  };

  const measure = () => {
    const { w, h } = size;
    const d = hit.current.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
    const pts = target.current;
    let c = 0;
    for (const p of pts) if (d[p * 4 + 3] > 0) c++;
    const cov = pts.length ? c / pts.length : 0;
    setCover(cov);
    const { inside, total } = stats.current;
    if (total > 40 && inside / total < 0.6) setNudge('Try to stay on the dotted lines!');
    else setNudge('');
    if (cov >= 0.92 && !done) finish(cov);
  };

  const finish = (cov = cover) => {
    if (cov < PASS) {
      say('Keep going! Trace all of it.');
      setNudge('Keep going, trace all of it! ✏️');
      return;
    }
    setDone(true);
    sfx('correct');
    say(['Beautiful!', 'Great tracing!', 'Well done!'][Math.floor(Math.random() * 3)]);
    const { inside, total } = stats.current;
    const messy = total ? 1 - inside / total : 0;
    setTimeout(() => onDone({ mistakes: messy > 0.35 ? 2 : messy > 0.2 ? 1 : 0, questions: 3 }), 900);
  };

  const pos = (e) => {
    const r = ink.current.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const strokeTo = (a, b) => {
    const c = INK[color.current % INK.length];
    [ink.current.getContext('2d'), hit.current.getContext('2d')].forEach((ctx) => {
      ctx.strokeStyle = c;
      ctx.lineWidth = lineW;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    });
    const zone = hit.current.zone;
    const xi = Math.round(b.x);
    const yi = Math.round(b.y);
    if (zone && xi >= 0 && yi >= 0 && xi < size.w && yi < size.h) {
      stats.current.total++;
      if (zone[(yi * size.w + xi) * 4 + 3] > 0) stats.current.inside++;
    }
  };
  const down = (e) => {
    if (demo) return endDemo(true);
    if (done) return;
    e.preventDefault();
    ink.current.setPointerCapture?.(e.pointerId);
    const p = pos(e);
    drawing.current = p;
    strokeTo(p, { x: p.x + 0.1, y: p.y + 0.1 });
  };
  const move = (e) => {
    if (!drawing.current) return;
    const p = pos(e);
    strokeTo(drawing.current, p);
    drawing.current = p;
  };
  const up = () => {
    if (!drawing.current) return;
    drawing.current = null;
    color.current++;
    measure();
  };

  const pct = Math.round(Math.min(1, cover / 0.92) * 100);
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <SpeakButton text={sayFor(step)} />
        <h2 className="on-bg text-2xl font-semibold sm:text-3xl">
          Trace {step.kind === 'path' ? PATH_NAMES[step.target] : <span className={cls('text-brand-700', step.kind === 'cursive' && 'font-cursive text-4xl')}>{step.target}</span>}
        </h2>
      </div>
      <div ref={wrap} className="flex w-full justify-center">
        <div className="relative rounded-3xl border-4 border-white bg-white shadow-lift" style={{ width: size.w, height: size.h }}>
          <canvas ref={guide} className="absolute inset-0 rounded-3xl" />
          <canvas ref={demoCv} className="pointer-events-none absolute inset-0 rounded-3xl" />
          {demo && (
            <div className="pointer-events-none absolute left-1/2 top-2 z-10 -translate-x-1/2 rounded-full bg-accent-500 px-4 py-1 text-sm font-bold text-white shadow-chunky-sm animate-pop">👀 Watch me first · tap to skip</div>
          )}
          <canvas ref={ink} className="absolute inset-0 touch-none rounded-3xl" onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up} onPointerCancel={up} />
          {done && <div className="pointer-events-none absolute inset-0 grid place-items-center text-8xl animate-pop">🌟</div>}
        </div>
      </div>
      <div className="flex w-full max-w-md items-center gap-3">
        <button onClick={() => (reset(), runDemo())} className="btn-white shrink-0 px-3" aria-label="Watch again and start over">
          <RotateCcw size={20} />
        </button>
        <div className="h-5 flex-1 overflow-hidden rounded-full bg-white shadow-inner">
          <div className={cls('h-full rounded-full transition-all', pct >= PASS * 100 ? 'bg-emerald-400' : 'rainbow-bar')} style={{ width: `${pct}%` }} />
        </div>
        <NextButton onClick={() => finish()} disabled={done} className="shrink-0 px-5 py-2.5 text-lg">
          Done
        </NextButton>
      </div>
      {nudge && (
        <div className="flex items-center gap-2 animate-fade-in">
          <Brill size={40} mood="think" />
          <span className="rounded-2xl bg-white px-3 py-1.5 font-medium shadow-soft">{nudge}</span>
        </div>
      )}
    </div>
  );
}
