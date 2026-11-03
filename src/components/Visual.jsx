// Renders the picture part of a question: emoji groups, shapes, clocks, fractions, money and more.
import { cls } from '../lib/format';

export const SHAPE_PATHS = {
  circle: <circle cx="50" cy="50" r="40" />,
  square: <rect x="12" y="12" width="76" height="76" rx="4" />,
  rectangle: <rect x="5" y="25" width="90" height="50" rx="4" />,
  triangle: <path d="M50 8 92 88H8z" />,
  star: <path d="M50 5l13 27 30 4-22 21 5 30-26-14-26 14 5-30L7 36l30-4z" />,
  heart: <path d="M50 88 12 50C-4 30 18 2 40 18l10 9 10-9c22-16 44 12 28 32z" />,
  oval: <ellipse cx="50" cy="50" rx="44" ry="30" />,
  diamond: <path d="M50 4 90 50 50 96 10 50z" />,
  pentagon: <path d="M50 6 94 38 77 92H23L6 38z" />,
  hexagon: <path d="M27 10h46l23 40-23 40H27L4 50z" />,
};
const SHAPE_COLORS = { circle: '#f43f5e', square: '#3b82f6', rectangle: '#22c55e', triangle: '#f59e0b', star: '#eab308', heart: '#ec4899', oval: '#8b5cf6', diamond: '#06b6d4', pentagon: '#f97316', hexagon: '#14b8a6' };

export function Shape({ shape, size = 120 }) {
  return (
    <svg viewBox="0 0 100 100" width={size} height={size} fill={SHAPE_COLORS[shape] || '#8b5cf6'} stroke="#2b2350" strokeWidth="3" strokeLinejoin="round">
      {SHAPE_PATHS[shape]}
    </svg>
  );
}

function Clock({ h, m, size = 150 }) {
  const ma = (m / 60) * 360;
  const ha = ((h % 12) / 12) * 360 + (m / 60) * 30;
  const hand = (angle, len, w, color) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return <line x1="50" y1="50" x2={50 + Math.cos(rad) * len} y2={50 + Math.sin(rad) * len} stroke={color} strokeWidth={w} strokeLinecap="round" />;
  };
  return (
    <svg viewBox="0 0 100 100" width={size} height={size}>
      <circle cx="50" cy="50" r="46" fill="#fff" stroke="rgb(var(--brand-600))" strokeWidth="5" />
      {Array.from({ length: 12 }, (_, i) => {
        const a = ((i + 1) * 30 - 90) * (Math.PI / 180);
        return (
          <text key={i} x={50 + Math.cos(a) * 35} y={50 + Math.sin(a) * 35 + 4} textAnchor="middle" fontSize="10" fontWeight="600" fill="#2b2350">
            {i + 1}
          </text>
        );
      })}
      {hand(ha, 20, 5, '#2b2350')}
      {hand(ma, 31, 3, 'rgb(var(--accent-500))')}
      <circle cx="50" cy="50" r="3.5" fill="#2b2350" />
    </svg>
  );
}

function Fraction({ n, d, shape }) {
  if (shape === 'bar')
    return (
      <div className="flex h-16 w-64 overflow-hidden rounded-xl border-4 border-ink">
        {Array.from({ length: d }, (_, i) => (
          <div key={i} className={cls('flex-1 border-ink', i ? 'border-l-4' : '', i < n ? 'bg-accent-400' : 'bg-white')} />
        ))}
      </div>
    );
  const slices = Array.from({ length: d }, (_, i) => {
    const a0 = (i / d) * 2 * Math.PI - Math.PI / 2;
    const a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
    const large = 1 / d > 0.5 ? 1 : 0;
    return <path key={i} d={`M50 50L${50 + 44 * Math.cos(a0)} ${50 + 44 * Math.sin(a0)}A44 44 0 ${large} 1 ${50 + 44 * Math.cos(a1)} ${50 + 44 * Math.sin(a1)}z`} fill={i < n ? 'rgb(var(--accent-400))' : '#fff'} stroke="#2b2350" strokeWidth="3" strokeLinejoin="round" />;
  });
  return (
    <svg viewBox="0 0 100 100" width="150" height="150">
      {d === 1 ? <circle cx="50" cy="50" r="44" fill="rgb(var(--accent-400))" stroke="#2b2350" strokeWidth="3" /> : slices}
    </svg>
  );
}

function Angle({ deg }) {
  const rad = (-deg * Math.PI) / 180;
  return (
    <svg viewBox="0 0 120 80" width="200" height="133">
      <line x1="20" y1="65" x2="110" y2="65" stroke="#2b2350" strokeWidth="4" strokeLinecap="round" />
      <line x1="60" y1="65" x2={60 + Math.cos(rad) * 50} y2={65 + Math.sin(rad) * 50} stroke="rgb(var(--brand-600))" strokeWidth="4" strokeLinecap="round" />
      {deg === 90 ? <rect x="60" y="53" width="12" height="12" fill="none" stroke="rgb(var(--accent-500))" strokeWidth="2.5" /> : <path d={`M80 65A20 20 0 0 0 ${60 + Math.cos(rad) * 20} ${65 + Math.sin(rad) * 20}`} fill="none" stroke="rgb(var(--accent-500))" strokeWidth="2.5" />}
    </svg>
  );
}

function EmojiGrid({ items, big }) {
  return (
    <div className={cls('flex max-w-md flex-wrap justify-center gap-1.5', big ? 'text-7xl sm:text-8xl' : items.length > 12 ? 'text-3xl' : 'text-4xl sm:text-5xl')}>
      {items.map((e, i) => (
        <span key={i} className="animate-pop" style={{ animationDelay: `${i * 40}ms` }}>
          {e}
        </span>
      ))}
    </div>
  );
}

export default function Visual({ v }) {
  if (!v) return null;
  switch (v.kind) {
    case 'emoji':
      return (
        <div className="flex flex-col items-center gap-1">
          <EmojiGrid items={v.items} big={v.big || v.items.length === 1} />
          {v.caption && <div className="text-2xl font-semibold text-brand-700">{v.caption}</div>}
        </div>
      );
    case 'shape':
      return <Shape shape={v.shape} size={140} />;
    case 'color':
      return <div className="h-28 w-28 rounded-full border-4 border-ink shadow-chunky" style={{ background: v.hex }} />;
    case 'clock':
      return <Clock h={v.h} m={v.m} />;
    case 'fraction':
      return <Fraction {...v} />;
    case 'angle':
      return <Angle deg={v.deg} />;
    case 'text':
      return <div className="rounded-2xl bg-brand-50 px-5 py-3 text-center text-3xl font-semibold tracking-wide text-brand-800">{v.text}</div>;
    case 'sum':
      return (
        <div className="flex flex-wrap items-center justify-center gap-3 text-4xl">
          <EmojiGrid items={v.a} />
          <span className="font-bold text-brand-600">{v.op}</span>
          <EmojiGrid items={v.b} />
        </div>
      );
    case 'takeaway':
      return (
        <div className="flex max-w-md flex-wrap justify-center gap-1.5 text-4xl sm:text-5xl">
          {v.items.map((e, i) => (
            <span key={i} className={cls('relative', i >= v.items.length - v.gone && 'opacity-40')}>
              {e}
              {i >= v.items.length - v.gone && <span className="absolute inset-0 grid place-items-center text-5xl text-rose-500">✕</span>}
            </span>
          ))}
        </div>
      );
    case 'groups':
      return (
        <div className="flex flex-wrap justify-center gap-3">
          {v.groups.map((g, i) => (
            <div key={i} className="flex max-w-[8rem] flex-wrap justify-center gap-1 rounded-2xl border-2 border-dashed border-brand-300 bg-brand-50/60 p-2 text-3xl">
              {g.map((e, j) => (
                <span key={j}>{e}</span>
              ))}
            </div>
          ))}
        </div>
      );
    case 'blocks':
      return (
        <div className="flex items-end gap-3">
          {Array.from({ length: v.tens }, (_, i) => (
            <div key={i} className="flex flex-col gap-0.5">
              {Array.from({ length: 10 }, (_, j) => (
                <div key={j} className="h-3 w-4 rounded-sm bg-brand-500" />
              ))}
            </div>
          ))}
          <div className="flex flex-wrap gap-0.5" style={{ width: 40 }}>
            {Array.from({ length: v.ones }, (_, i) => (
              <div key={i} className="h-4 w-4 rounded-sm bg-accent-400" />
            ))}
          </div>
        </div>
      );
    case 'money':
      return (
        <div className="flex gap-3">
          {v.notes.map((n, i) => (
            <div key={i} className={cls('grid place-items-center rounded-xl border-4 font-bold shadow-chunky-sm', n >= 5 ? 'h-20 w-36 border-emerald-700 bg-emerald-100 text-2xl text-emerald-800' : 'h-20 w-20 rounded-full border-amber-600 bg-amber-200 text-xl text-amber-800')}>
              {v.cur}
              {n}
            </div>
          ))}
        </div>
      );
    case 'rect':
      return (
        <div className="flex flex-col items-center">
          <div className="text-sm font-semibold text-slate-500">{v.w}</div>
          <div className="flex items-center gap-2">
            <div className="rounded-lg border-4 border-brand-600 bg-brand-100" style={{ width: 30 + v.w * 14, height: 20 + v.h * 9 }} />
            <div className="text-sm font-semibold text-slate-500">{v.h}</div>
          </div>
        </div>
      );
    default:
      return null;
  }
}
