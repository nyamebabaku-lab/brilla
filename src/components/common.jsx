import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Download, WifiOff } from 'lucide-react';
import { Logo } from './brand';
import { Modal } from './ui';
import { useDB } from '../data/store';
import { PERIODS, visiblePlans } from '../data/seed';
import { UNIT_SIZE, UNITS_PER_SUBJECT } from '../curriculum';
import { useOnline, useUser } from '../lib/hooks';
import { cls, money } from '../lib/format';
import { yearlySaving } from '../lib/payments';

export function PublicHeader() {
  const user = useUser();
  const schoolsOn = useDB((s) => !!s.settings.schoolsEnabled);
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-4">
      <Link to="/" aria-label="Brilla home">
        <Logo />
      </Link>
      <nav className="flex items-center gap-1.5 sm:gap-2">
        <Link to="/pricing" className="btn-ghost hidden px-3 sm:inline-flex">
          Pricing
        </Link>
        {schoolsOn && (
          <Link to="/class" className="btn-ghost hidden px-3 sm:inline-flex">
            Pupil login
          </Link>
        )}
        {user ? (
          <Link to="/home" className="btn-primary">
            Open app
          </Link>
        ) : (
          <>
            <Link to="/login" className="btn-white px-4">
              Log in
            </Link>
            <Link to="/signup" className="btn-primary hidden px-4 sm:inline-flex">
              Start free
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

export function PeriodSwitch({ value, onChange, plans }) {
  const settings = useDB((s) => s.settings);
  const save = plans ? Math.max(0, ...visiblePlans({ ...settings, plans }).map(yearlySaving)) : 0;
  return (
    <div className="inline-flex rounded-2xl bg-white p-1 shadow-soft">
      {PERIODS.map((p) => (
        <button key={p.id} onClick={() => onChange(p.id)} className={cls('relative rounded-xl px-4 py-2 font-semibold transition', value === p.id ? 'bg-brand-600 text-white' : 'text-slate-600')}>
          {p.label}
          {p.id === 'yearly' && save > 0 && <span className="absolute -right-2 -top-3 rounded-full bg-accent-500 px-1.5 text-[10px] text-white">-{save}%</span>}
        </button>
      ))}
    </div>
  );
}

export function PlanCards({ period, onPick, current }) {
  const settings = useDB((s) => s.settings);
  const per = PERIODS.find((p) => p.id === period)?.per;
  const days = PERIODS.find((p) => p.id === period)?.days || 7;
  const plans = visiblePlans(settings);
  const one = plans.length === 1;
  return (
    <div className={one ? 'mx-auto grid max-w-md' : 'grid gap-4 md:grid-cols-2'}>
      {plans.map((p) => (
        <div key={p.id} className={cls('card relative flex flex-col p-6', (p.popular || one) && 'ring-4 ring-accent-300')}>
          {p.popular && !one && <span className="chip absolute -top-3 left-6 bg-accent-500 text-white">Most popular</span>}
          <div className="text-4xl">{p.emoji}</div>
          <h3 className="mt-2 text-2xl font-semibold">{p.name}</h3>
          <p className="text-slate-500">{p.tagline}</p>
          <div className="my-4">
            <span className="text-4xl font-bold">{money(p.prices[period], settings.currency)}</span>
            <span className="text-slate-500">
              {' '}
              / {p.perSeat ? 'pupil / ' : ''}
              {per}
            </span>
          </div>
          {!p.perSeat && (
            <p className="-mt-2 mb-4 rounded-xl bg-brand-50 px-3 py-2 text-sm font-medium text-brand-800">
              🎁 {days / 7 >= UNITS_PER_SUBJECT ? `A new unit of ${UNIT_SIZE} lessons every week: all ${UNITS_PER_SUBJECT} units open by week ${UNITS_PER_SUBJECT}` : `Opens ${days / 7} new unit${days > 7 ? 's' : ''} of ${UNIT_SIZE} lessons, 1 every week`}
            </p>
          )}
          <ul className="mb-6 flex-1 space-y-2">
            {p.features.map((f) => (
              <li key={f} className="flex items-start gap-2 text-slate-600">
                <Check size={18} className="mt-0.5 shrink-0 text-emerald-500" /> {f}
              </li>
            ))}
          </ul>
          <button onClick={() => onPick(p.id)} className={p.popular ? 'btn-accent w-full py-3' : 'btn-primary w-full py-3'}>
            {current === p.id ? 'Renew / extend' : one ? 'Start learning' : `Choose ${p.name}`}
          </button>
        </div>
      ))}
    </div>
  );
}

/** Install-to-home-screen helper (Android/desktop prompt, iOS instructions). */
let deferredPrompt = null;
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
  });
}
export function InstallButton({ className }) {
  const [ios, setIos] = useState(false);
  const standalone = typeof window !== 'undefined' && (window.matchMedia?.('(display-mode: standalone)').matches || navigator.standalone);
  if (standalone) return null;
  const click = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    } else setIos(true);
  };
  return (
    <>
      <button onClick={click} className={cls('btn-white', className)}>
        <Download size={18} /> Install app
      </button>
      <Modal open={ios} onClose={() => setIos(false)} title="Install Brilla">
        <div className="space-y-3 text-slate-600">
          <p>
            <b>iPhone / iPad (Safari):</b> tap the Share button <span className="rounded bg-slate-100 px-1">⬆️</span>, then <b>Add to Home Screen</b>.
          </p>
          <p>
            <b>Android (Chrome):</b> tap the menu <span className="rounded bg-slate-100 px-1">⋮</span>, then <b>Install app</b> or <b>Add to Home screen</b>.
          </p>
          <p>
            <b>Computer:</b> click the install icon in the address bar.
          </p>
          <p className="rounded-2xl bg-emerald-50 p-3 text-emerald-800">Once installed, Brilla opens like an app and all lessons work without internet.</p>
        </div>
      </Modal>
    </>
  );
}

export function OfflineBadge() {
  const online = useOnline();
  if (online) return null;
  return (
    <div className="fixed bottom-3 left-3 z-40 flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-sm font-medium text-white shadow-lift">
      <WifiOff size={15} /> Offline: lessons still work
    </div>
  );
}

/** Asks a grown-up question (and the parent's PIN if set) before opening grown-up areas. */
export function GrownUpGate({ open, onClose, onPass, pin }) {
  const [q] = useState(() => {
    const a = 6 + Math.floor(Math.random() * 7);
    const b = 3 + Math.floor(Math.random() * 7);
    return { a, b };
  });
  const [ans, setAns] = useState('');
  const [p, setP] = useState('');
  const [err, setErr] = useState('');
  useEffect(() => {
    if (open) {
      setAns('');
      setP('');
      setErr('');
    }
  }, [open]);
  const submit = (e) => {
    e.preventDefault();
    if (Number(ans) !== q.a * q.b) return setErr('That answer is not right.');
    if (pin && p !== pin) return setErr('Wrong PIN.');
    onPass();
  };
  return (
    <Modal open={open} onClose={onClose} title="Grown-ups only 🔒">
      <form onSubmit={submit} className="space-y-4">
        <label className="block">
          <span className="label">
            What is {q.a} × {q.b}?
          </span>
          <input className="input text-lg" inputMode="numeric" value={ans} onChange={(e) => setAns(e.target.value)} autoFocus />
        </label>
        {pin && (
          <label className="block">
            <span className="label">Parent PIN</span>
            <input className="input text-lg tracking-[0.5em]" inputMode="numeric" maxLength={4} type="password" value={p} onChange={(e) => setP(e.target.value.replace(/\D/g, ''))} />
          </label>
        )}
        {err && <p className="text-sm font-medium text-rose-600">{err}</p>}
        <button className="btn-primary w-full py-3">Continue</button>
      </form>
    </Modal>
  );
}

export function useGoHome() {
  const nav = useNavigate();
  return () => nav('/home');
}
