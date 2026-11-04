// "Break time!" mini-games offered after every 10 lessons in a unit. About 60 seconds each, rotating per child.
import { useCallback, useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import { Brill, Confetti } from '../../components/brand';
import { useDB } from '../../data/store';
import { STICKERS } from '../../data/seed';
import { say } from '../../lib/speech';
import { sfx } from '../../lib/sfx';
import { cls, shuffle, rng } from '../../lib/format';

const SECONDS = 60;
const COLOURS = [
  { name: 'red', hex: '#ef4444' },
  { name: 'blue', hex: '#3b82f6' },
  { name: 'yellow', hex: '#facc15' },
  { name: 'green', hex: '#22c55e' },
  { name: 'purple', hex: '#a855f7' },
  { name: 'orange', hex: '#f97316' },
];
const rand = (a, b) => a + Math.random() * (b - a);
let nextId = 1;

// ---------------- 1. Balloon pop ----------------
function BalloonPop({ addScore, running }) {
  const [balloons, setBalloons] = useState([]);
  const [target, setTarget] = useState(COLOURS[0]);
  useEffect(() => {
    if (!running) return;
    const spawn = setInterval(() => {
      const c = COLOURS[Math.floor(Math.random() * COLOURS.length)];
      setBalloons((b) => [...b.slice(-14), { id: nextId++, x: rand(4, 84), c, dur: rand(4.5, 7) }]);
    }, 650);
    const pickTarget = () => {
      const t = COLOURS[Math.floor(Math.random() * COLOURS.length)];
      setTarget(t);
      say(`Pop the ${t.name} balloons!`);
    };
    pickTarget();
    const change = setInterval(pickTarget, 15000);
    return () => (clearInterval(spawn), clearInterval(change));
  }, [running]);
  const pop = (bl) => {
    setBalloons((b) => b.filter((x) => x.id !== bl.id));
    const bonus = bl.c.name === target.name;
    sfx(bonus ? 'correct' : 'pop');
    addScore(bonus ? 2 : 1);
  };
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute left-1/2 top-3 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white px-4 py-1.5 text-lg font-bold shadow-chunky-sm">
        Pop the <span className="inline-block h-5 w-5 rounded-full border-2 border-ink" style={{ background: target.hex }} /> {target.name} ones! (+2)
      </div>
      {balloons.map((bl) => (
        <button
          key={bl.id}
          onPointerDown={() => pop(bl)}
          onAnimationEnd={() => setBalloons((b) => b.filter((x) => x.id !== bl.id))}
          className="absolute bottom-[-120px] flex flex-col items-center"
          style={{ left: `${bl.x}%`, animation: `rise ${bl.dur}s linear forwards` }}
          aria-label={`${bl.c.name} balloon`}
        >
          <span className="block h-20 w-16 rounded-[50%_50%_50%_50%/45%_45%_55%_55%] shadow-inner" style={{ background: `radial-gradient(circle at 35% 30%, #ffffffaa 0 12%, ${bl.c.hex} 13%)` }} />
          <span className="h-10 w-px bg-slate-400" />
        </button>
      ))}
    </div>
  );
}

// ---------------- 2. Memory match ----------------
const CARD_SETS = [['🐶', '🐱', '🐸', '🦁'], ['🍎', '🍌', '🍇', '🥭'], ['🚗', '🚀', '⛵', '🚲'], ['⭐', '🌈', '🌙', '☀️']];
function MemoryMatch({ addScore, running, finish }) {
  const [cards, setCards] = useState(() => {
    const set = CARD_SETS[Math.floor(Math.random() * CARD_SETS.length)];
    return shuffle(rng(Date.now()), [...set, ...set]).map((e, i) => ({ id: i, e, up: false, done: false }));
  });
  const [open, setOpen] = useState([]);
  const flip = (c) => {
    if (!running || c.up || c.done || open.length === 2) return;
    sfx('tap');
    const next = [...open, c.id];
    setCards((cs) => cs.map((x) => (x.id === c.id ? { ...x, up: true } : x)));
    setOpen(next);
    if (next.length === 2) {
      const [a, b] = next.map((id) => cards.find((x) => x.id === id));
      if (a.e === b.e) {
        setTimeout(() => {
          sfx('correct');
          addScore(5);
          setCards((cs) => {
            const after = cs.map((x) => (next.includes(x.id) ? { ...x, done: true } : x));
            if (after.every((x) => x.done)) setTimeout(() => finish(), 700);
            return after;
          });
          setOpen([]);
        }, 350);
      } else {
        setTimeout(() => {
          setCards((cs) => cs.map((x) => (next.includes(x.id) ? { ...x, up: false } : x)));
          setOpen([]);
        }, 900);
      }
    }
  };
  return (
    <div className="grid h-full place-items-center p-4">
      <div className="grid w-full max-w-md grid-cols-4 gap-3">
        {cards.map((c) => (
          <button key={c.id} onClick={() => flip(c)} className={cls('grid aspect-[3/4] place-items-center rounded-2xl text-5xl shadow-chunky transition-all duration-300', c.done ? 'scale-95 bg-emerald-100 opacity-60' : c.up ? 'bg-white' : 'bg-brand-500')}>
            {c.up || c.done ? <span className="animate-pop">{c.e}</span> : <span className="text-3xl text-white/80">?</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------- 3. Catch the fruit ----------------
const FRUIT = ['🍎', '🍌', '🍊', '🍇', '🥭', '🍓', '🍍'];
function CatchFruit({ addScore, running }) {
  const area = useRef(null);
  const [basket, setBasket] = useState(50);
  const basketRef = useRef(50);
  const [items, setItems] = useState([]);
  const [shake, setShake] = useState(false);
  useEffect(() => {
    if (!running) return;
    let raf;
    let last = performance.now();
    let spawnIn = 0;
    const tick = (t) => {
      const dt = Math.min(50, t - last) / 1000;
      last = t;
      spawnIn -= dt;
      setItems((list) => {
        let next = list.map((it) => ({ ...it, y: it.y + it.v * dt }));
        if (spawnIn <= 0) {
          spawnIn = rand(0.55, 0.95);
          const rock = Math.random() < 0.22;
          next.push({ id: nextId++, x: rand(6, 94), y: -8, v: rand(28, 42), e: rock ? '🪨' : FRUIT[Math.floor(Math.random() * FRUIT.length)], rock });
        }
        const kept = [];
        for (const it of next) {
          if (it.y >= 80 && it.y <= 92 && Math.abs(it.x - basketRef.current) < 10) {
            if (it.rock) {
              sfx('wrong');
              addScore(-2);
              setShake(true);
              setTimeout(() => setShake(false), 400);
            } else {
              sfx('pop');
              addScore(1);
            }
          } else if (it.y < 105) kept.push(it);
        }
        return kept;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [running, addScore]);
  const move = (e) => {
    const r = area.current.getBoundingClientRect();
    const x = Math.max(6, Math.min(94, ((e.clientX - r.left) / r.width) * 100));
    basketRef.current = x;
    setBasket(x);
  };
  return (
    <div ref={area} onPointerMove={move} onPointerDown={move} className="relative h-full touch-none overflow-hidden">
      <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-white px-4 py-1.5 text-lg font-bold shadow-chunky-sm">Catch the fruit 🧺 · avoid rocks 🪨</div>
      {items.map((it) => (
        <span key={it.id} className="absolute -translate-x-1/2 text-5xl" style={{ left: `${it.x}%`, top: `${it.y}%` }}>
          {it.e}
        </span>
      ))}
      <span className={cls('absolute -translate-x-1/2 text-7xl transition-[left] duration-75', shake && 'animate-shake')} style={{ left: `${basket}%`, top: '82%' }}>
        🧺
      </span>
    </div>
  );
}

// ---------------- 4. Bubble count ----------------
function BubbleCount({ addScore, running }) {
  const [target, setTarget] = useState(3);
  const [popped, setPopped] = useState(0);
  const [bubbles, setBubbles] = useState([]);
  const newRound = useCallback((n) => {
    setPopped(0);
    setBubbles(Array.from({ length: n + 3 + Math.floor(Math.random() * 3) }, () => ({ id: nextId++, x: rand(5, 85), y: rand(18, 78), s: rand(58, 86), hue: Math.floor(rand(0, 360)) })));
    say(`Pop ${n} bubbles!`);
  }, []);
  useEffect(() => {
    if (running) newRound(3);
  }, [running, newRound]);
  const pop = (b) => {
    const count = popped + 1;
    setBubbles((bs) => bs.filter((x) => x.id !== b.id));
    setPopped(count);
    sfx('pop');
    say(String(count), { rate: 1.1 });
    if (count === target) {
      sfx('correct');
      addScore(target);
      const next = Math.min(10, target + 1);
      setTarget(next);
      setTimeout(() => newRound(next), 700);
    }
  };
  return (
    <div className="relative h-full overflow-hidden">
      <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full bg-white px-4 py-1.5 text-lg font-bold shadow-chunky-sm">
        Pop {target} bubbles · {popped}/{target}
      </div>
      {bubbles.map((b) => (
        <button
          key={b.id}
          onPointerDown={() => popped < target && pop(b)}
          className="absolute rounded-full border-2 border-white/70 animate-float"
          style={{ left: `${b.x}%`, top: `${b.y}%`, width: b.s, height: b.s, background: `radial-gradient(circle at 30% 30%, #ffffffcc 0 15%, hsl(${b.hue} 90% 70% / .55) 16%)`, animationDelay: `${(b.id % 7) * 0.3}s` }}
          aria-label="bubble"
        />
      ))}
    </div>
  );
}

const GAMES = [
  { id: 'balloons', name: 'Balloon pop', emoji: '🎈', C: BalloonPop, intro: 'Pop the balloons before they fly away!' },
  { id: 'memory', name: 'Memory match', emoji: '🃏', C: MemoryMatch, intro: 'Turn two cards. Find the pairs!' },
  { id: 'fruit', name: 'Catch the fruit', emoji: '🧺', C: CatchFruit, intro: 'Move the basket to catch the fruit. Watch out for rocks!' },
  { id: 'bubbles', name: 'Bubble count', emoji: '🫧', C: BubbleCount, intro: 'Count as you pop the bubbles!' },
];

export default function BreakGame({ child, onClose }) {
  const update = useDB((s) => s.update);
  const addSticker = useDB((s) => s.addSticker);
  const [game] = useState(() => GAMES[(child.breakGames || 0) % GAMES.length]);
  const [left, setLeft] = useState(SECONDS);
  const [score, setScore] = useState(0);
  const [phase, setPhase] = useState('ready'); // ready | play | done
  const [sticker, setSticker] = useState(null);

  const addScore = useCallback((n) => setScore((s) => Math.max(0, s + n)), []);
  const finish = useCallback(() => {
    setPhase((p) => {
      if (p !== 'play') return p;
      const st = STICKERS[Math.floor(Math.random() * STICKERS.length)];
      setSticker(st);
      addSticker(child.id, st);
      sfx('fanfare');
      say('Great game! Now let’s get back to learning.');
      return 'done';
    });
  }, [child, addSticker]);

  useEffect(() => {
    if (phase !== 'play') return;
    const t = setInterval(() => setLeft((l) => (l <= 1 ? (clearInterval(t), finish(), 0) : l - 1)), 1000);
    return () => clearInterval(t);
  }, [phase, finish]);
  useEffect(() => {
    say(`Break time! ${game.name}. ${game.intro}`);
  }, [game]);

  const G = game.C;
  return (
    <div className="fixed inset-0 z-[60] flex flex-col" style={{ background: 'var(--page-bg)' }}>
      <div className="flex items-center gap-3 p-3">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-3xl shadow-chunky-sm">{game.emoji}</span>
        <div className="flex-1">
          <div className="on-bg text-xl font-bold">{game.name}</div>
          <div className="on-bg-muted text-sm">Break time 🎉</div>
        </div>
        <span className="rounded-2xl bg-amber-100 px-3 py-2 text-lg font-bold text-amber-800">⭐ {score}</span>
        <span className={cls('w-16 rounded-2xl px-3 py-2 text-center text-lg font-bold', left <= 10 ? 'bg-rose-100 text-rose-700' : 'bg-white text-ink')}>{left}s</span>
        <button onClick={() => onClose(phase === 'done')} className="grid h-12 w-12 place-items-center rounded-2xl bg-white text-slate-600 shadow-chunky-sm" aria-label="Stop the game">
          <X />
        </button>
      </div>
      <div className="relative mx-3 mb-3 flex-1 overflow-hidden rounded-3xl bg-white/50">
        {phase === 'ready' && (
          <div className="grid h-full place-items-center p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <span className="text-8xl animate-bob">{game.emoji}</span>
              <h2 className="text-3xl font-bold">{game.name}</h2>
              <p className="max-w-sm text-lg text-slate-600">{game.intro}</p>
              <button
                onClick={() => {
                  sfx('pop');
                  // Move the rotation on as soon as a game starts, so the next break offers a different game.
                  update('children', child.id, { breakGames: (child.breakGames || 0) + 1 });
                  setPhase('play');
                }}
                className="btn-accent px-10 py-4 text-2xl"
              >
                ▶ Play
              </button>
            </div>
          </div>
        )}
        {phase === 'play' && <G addScore={addScore} running finish={finish} />}
        {phase === 'done' && (
          <div className="grid h-full place-items-center p-6 text-center">
            <Confetti fire />
            <div className="flex flex-col items-center gap-3">
              <Brill size={110} mood="wow" className="animate-bob" />
              <h2 className="text-4xl font-bold">Great game!</h2>
              <p className="text-2xl">⭐ {score} points</p>
              {sticker && (
                <div className="card flex items-center gap-3 px-5 py-3 animate-pop">
                  <span className="text-5xl">{sticker}</span>
                  <span className="text-lg font-semibold">New sticker!</span>
                </div>
              )}
              <button onClick={() => onClose(true)} className="btn-accent mt-2 px-8 py-3.5 text-xl">
                Back to learning →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
