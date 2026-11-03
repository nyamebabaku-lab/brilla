import { useEffect, useRef } from 'react';
import { cls } from '../lib/format';

/** Brill the star — the app mascot. `mood`: happy | wow | think | sad */
export function Brill({ size = 72, mood = 'happy', className }) {
  const mouth = {
    happy: <path d="M40 60q10 9 20 0" fill="none" stroke="#2b2350" strokeWidth="4" strokeLinecap="round" />,
    wow: <ellipse cx="50" cy="62" rx="6" ry="7" fill="#2b2350" />,
    think: <path d="M42 62h16" stroke="#2b2350" strokeWidth="4" strokeLinecap="round" />,
    sad: <path d="M41 65q9-8 18 0" fill="none" stroke="#2b2350" strokeWidth="4" strokeLinecap="round" />,
  }[mood];
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} className={cls('drop-shadow-md', className)} aria-hidden>
      <path d="M50 5l13 27 30 4-22 21 5 30-26-14-26 14 5-30L7 36l30-4z" fill="#fde047" stroke="#f59e0b" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="40" cy="48" r="4.5" fill="#2b2350" />
      <circle cx="60" cy="48" r="4.5" fill="#2b2350" />
      <circle cx="41.5" cy="46.5" r="1.4" fill="#fff" />
      <circle cx="61.5" cy="46.5" r="1.4" fill="#fff" />
      <circle cx="33" cy="58" r="4" fill="#fb7185" opacity=".6" />
      <circle cx="67" cy="58" r="4" fill="#fb7185" opacity=".6" />
      {mouth}
    </svg>
  );
}

export function SpeechBubble({ children, className }) {
  return (
    <div className={cls('relative rounded-2xl bg-white px-4 py-2.5 font-medium shadow-soft', className)}>
      {children}
      <span className="absolute -left-2 top-1/2 h-4 w-4 -translate-y-1/2 rotate-45 bg-white" />
    </div>
  );
}

export function Logo({ size = 'text-3xl', className }) {
  return (
    <span className={cls('inline-flex items-center gap-1.5 font-bold tracking-tight', size, className)}>
      <Brill size={size === 'text-3xl' ? 38 : 30} />
      <span className="rainbow-text">Brilla</span>
    </span>
  );
}

/** Full-screen confetti burst drawn on a canvas. */
export function Confetti({ fire }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!fire) return;
    const c = ref.current;
    const ctx = c.getContext('2d');
    const W = (c.width = window.innerWidth);
    const H = (c.height = window.innerHeight);
    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6', '#ec4899'];
    const parts = Array.from({ length: 140 }, () => ({
      x: W / 2 + (Math.random() - 0.5) * 120,
      y: H * 0.45,
      vx: (Math.random() - 0.5) * 16,
      vy: -Math.random() * 16 - 4,
      s: 6 + Math.random() * 7,
      r: Math.random() * Math.PI,
      vr: (Math.random() - 0.5) * 0.3,
      c: colors[Math.floor(Math.random() * colors.length)],
      round: Math.random() < 0.3,
    }));
    let raf;
    let t = 0;
    const tick = () => {
      ctx.clearRect(0, 0, W, H);
      parts.forEach((p) => {
        p.vy += 0.42;
        p.vx *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.r += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.r);
        ctx.fillStyle = p.c;
        if (p.round) {
          ctx.beginPath();
          ctx.arc(0, 0, p.s / 2, 0, Math.PI * 2);
          ctx.fill();
        } else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
        ctx.restore();
      });
      if (t++ < 170) raf = requestAnimationFrame(tick);
      else ctx.clearRect(0, 0, W, H);
    };
    tick();
    return () => cancelAnimationFrame(raf);
  }, [fire]);
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[70]" />;
}
