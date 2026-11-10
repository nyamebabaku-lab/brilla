// Brilla Admin app: asks for the admin's 4-digit PIN when the app opens and after 2 minutes in the background.
import { useEffect, useRef, useState } from 'react';
import { Logo } from './brand';
import { useDB } from '../data/store';
import { sfx } from '../lib/sfx';
import { cls } from '../lib/format';

const AWAY_MS = 2 * 60 * 1000;

export default function PinLock() {
  const pin = useDB((s) => s.admin?.pin);
  const role = useDB((s) => s.users.find((u) => u.id === s.session.userId)?.role);
  const logout = useDB((s) => s.logout);
  const userId = useDB((s) => s.session.userId);
  // Locked when the app opens with a PIN already set (not right after turning the PIN on).
  const [locked, setLocked] = useState(() => !!useDB.getState().admin?.pin);
  const [entry, setEntry] = useState('');
  const [shake, setShake] = useState(false);
  const hiddenAt = useRef(0);

  // Logging in with the password counts as unlocking.
  const prevUser = useRef(userId);
  useEffect(() => {
    if (!prevUser.current && userId) setLocked(false);
    prevUser.current = userId;
  }, [userId]);

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'hidden') hiddenAt.current = Date.now();
      else if (hiddenAt.current && Date.now() - hiddenAt.current > AWAY_MS) setLocked(true);
    };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  if (!pin || !locked || (role !== 'admin' && role !== 'recorder')) return null;
  const press = (d) => {
    sfx('tap');
    const next = (entry + d).slice(0, 4);
    setEntry(next);
    if (next.length === 4) {
      if (next === pin) {
        setLocked(false);
        setEntry('');
      } else {
        setShake(true);
        setTimeout(() => (setShake(false), setEntry('')), 450);
      }
    }
  };
  return (
    <div className="fixed inset-0 z-[80] flex flex-col items-center justify-center gap-6 p-6" style={{ background: 'var(--page-bg)' }}>
      <Logo size="text-3xl" />
      <p className="on-bg text-lg font-semibold">Enter your PIN</p>
      <div className={cls('flex gap-3', shake && 'animate-shake')}>
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cls('h-4 w-4 rounded-full border-2 border-brand-600', i < entry.length && 'bg-brand-600')} />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-3">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k) =>
          k === '' ? (
            <span key="blank" />
          ) : (
            <button key={k} onClick={() => (k === '⌫' ? setEntry((e) => e.slice(0, -1)) : press(k))} className="grid h-16 w-16 place-items-center rounded-full bg-white text-2xl font-semibold shadow-chunky-sm active:translate-y-0.5" aria-label={k === '⌫' ? 'Delete' : k}>
              {k}
            </button>
          ),
        )}
      </div>
      <button onClick={() => (logout(), setLocked(false), (location.hash = '#/'))} className="btn-ghost text-sm">
        Forgot PIN? Log in with your password
      </button>
    </div>
  );
}
