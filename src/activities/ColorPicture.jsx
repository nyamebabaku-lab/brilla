// Tap-to-fill colouring: choose a colour, tap a part of the picture.
import { useEffect, useState } from 'react';
import { RotateCcw, Undo2 } from 'lucide-react';
import { PICTURE_ART } from './pictures';
import { PICTURES } from '../curriculum/generators/creative';
import { NextButton, SpeakButton } from './common';
import { say } from '../lib/speech';
import { sfx } from '../lib/sfx';
import { cls } from '../lib/format';

const PALETTE = ['#ef4444', '#f97316', '#facc15', '#a3e635', '#22c55e', '#14b8a6', '#38bdf8', '#3b82f6', '#8b5cf6', '#ec4899', '#f9a8d4', '#92400e', '#fde68a', '#1f2937', '#ffffff', '#9ca3af'];

function Region({ s, fill, onTap }) {
  const common = { fill: s.fill || fill || '#ffffff', stroke: '#2b2350', strokeWidth: 2.5, strokeLinejoin: 'round', transform: s.tr, onPointerDown: onTap, style: { cursor: onTap ? 'pointer' : undefined, transition: 'fill .25s' } };
  if (s.t === 'rect') return <rect x={s.x} y={s.y} width={s.width} height={s.height} rx={s.rx} {...common} />;
  if (s.t === 'circle') return <circle cx={s.cx} cy={s.cy} r={s.r} {...common} />;
  if (s.t === 'ellipse') return <ellipse cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} {...common} />;
  if (s.t === 'poly') return <polygon points={s.points} {...common} />;
  return <path d={s.d} {...common} />;
}

export default function ColorPicture({ step, onDone, onSave }) {
  const art = PICTURE_ART[step.picture];
  const meta = PICTURES.find((p) => p.id === step.picture);
  const [color, setColor] = useState(PALETTE[0]);
  const [fills, setFills] = useState({});
  const [history, setHistory] = useState([]);
  const filled = Object.keys(fills).length;
  const total = art.r.length;
  const enough = filled >= Math.min(total, Math.max(3, Math.ceil(total * 0.5)));

  useEffect(() => {
    const t = setTimeout(() => say(`Let's colour the ${meta?.name || 'picture'}! Pick a colour, then tap the picture.`), 300);
    return () => clearTimeout(t);
  }, [meta]);

  const tap = (i) => (e) => {
    e.preventDefault();
    setHistory((h) => [...h, fills]);
    setFills((f) => ({ ...f, [i]: color === 'magic' ? PALETTE[Math.floor(Math.random() * 12)] : color }));
    sfx('fill');
  };


  const finish = () => {
    // Snapshot the SVG to an image for the gallery.
    const svg = document.getElementById('colour-svg');
    if (svg && onSave) {
      const xml = new XMLSerializer().serializeToString(svg);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = 400;
        c.height = 400;
        c.getContext('2d').drawImage(img, 0, 0, 400, 400);
        onSave({ image: c.toDataURL('image/jpeg', 0.75), title: meta?.name || 'Colouring' });
      };
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`;
    }
    sfx('star');
    say('Beautiful colours!');
    onDone({ creative: true });
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-3">
        <SpeakButton text={`Colour the ${meta?.name}`} />
        <h2 className="text-2xl font-semibold sm:text-3xl">
          {meta?.emoji} Colour the {meta?.name?.toLowerCase()}
        </h2>
      </div>
      <div className="flex w-full flex-col items-center gap-4 lg:flex-row lg:items-start lg:justify-center">
        <div className="w-full max-w-[min(92vw,30rem)] rounded-3xl border-4 border-white bg-white p-2 shadow-lift" style={{ maxWidth: 'min(92vw, 30rem, calc(100dvh - 300px))' }}>
          <svg id="colour-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200" className="block h-auto w-full touch-none select-none">
            <rect width="200" height="200" fill="#fff" />
            {art.r.map((s, i) => (
              <Region key={i} s={s} fill={fills[i]} onTap={tap(i)} />
            ))}
            {art.d.map((s, i) => (
              <Region key={`d${i}`} s={s} />
            ))}
          </svg>
        </div>
        <div className="flex flex-col items-center gap-3">
          <div className="grid grid-cols-8 gap-1.5 lg:grid-cols-4">
            {PALETTE.map((c) => (
              <button key={c} onClick={() => setColor(c)} className={cls('h-10 w-10 rounded-full border-4 shadow-chunky-sm transition sm:h-12 sm:w-12', color === c ? 'scale-110 border-ink' : 'border-white')} style={{ background: c }} aria-label={`Colour ${c}`} />
            ))}
          </div>
          <button onClick={() => setColor('magic')} className={cls('btn-white w-full', color === 'magic' && 'ring-4 ring-accent-300')}>
            🪄 Magic colours
          </button>
          <div className="flex gap-2">
            <button onClick={() => history.length && (setFills(history.at(-1)), setHistory((h) => h.slice(0, -1)))} className="btn-white px-3" aria-label="Undo">
              <Undo2 size={20} />
            </button>
            <button onClick={() => (setHistory((h) => [...h, fills]), setFills({}))} className="btn-white px-3" aria-label="Start over">
              <RotateCcw size={20} />
            </button>
          </div>
        </div>
      </div>
      <NextButton onClick={finish} disabled={!enough}>
        {enough ? "I'm finished!" : `Colour ${Math.max(0, Math.min(total, Math.max(3, Math.ceil(total * 0.5))) - filled)} more`}
      </NextButton>
    </div>
  );
}
