// "Brilla Admin" app start: sign in with a server account (so recordings can be published to families).
// The Brilla owner's email becomes the admin; everyone else is a recorder waiting for the admin's approval.
import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Brill, Logo } from '../../components/brand';
import { Field, toast } from '../../components/ui';
import { useDB } from '../../data/store';
import { useTheme, useUser } from '../../lib/hooks';
import { cls } from '../../lib/format';
import { currentStaff, signInStaff, signOutServer, startPublishing } from '../../lib/publish';

/** Mirrors the server account into the app's local user list and signs in locally. */
export function useStaffLogin() {
  return (staff) => {
    const st = useDB.getState();
    const local = { id: staff.user_id, role: staff.role, voices: staff.voices || [], name: staff.name, email: staff.email, phone: '' };
    if (st.users.some((u) => u.id === staff.user_id)) st.update('users', staff.user_id, local);
    else useDB.setState((s) => ({ users: [...s.users, { ...local, createdAt: new Date().toISOString() }] }));
    st.login(staff.user_id);
    startPublishing();
  };
}

export default function AdminAppStart() {
  useTheme();
  const user = useUser();
  const loginLocal = useStaffLogin();
  const [mode, setMode] = useState('signin');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);
  const [checking, setChecking] = useState(true);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const handle = (staff) => {
    if (!staff) return;
    if (staff.status === 'active') loginLocal(staff);
    else if (staff.status === 'pending') setPending(staff);
    else {
      toast.error('This account is suspended', 'Ask the Brilla admin');
      signOutServer();
    }
  };
  // Already signed in on this phone? Pick up where we left off.
  useEffect(() => {
    currentStaff()
      .then(handle)
      .catch(() => {})
      .finally(() => setChecking(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (user?.role === 'admin' || user?.role === 'recorder') return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    if (f.password.length < 6) return toast.error('Password must be at least 6 characters');
    setBusy(true);
    try {
      handle(await signInStaff({ email: f.email.trim().toLowerCase(), password: f.password, name: f.name.trim(), create: mode === 'create' }));
    } catch (err) {
      const msg = String(err?.message || err);
      toast.error(/invalid login/i.test(msg) ? 'Email or password is wrong' : /already registered/i.test(msg) ? 'That email already has an account: sign in instead' : /fetch|network/i.test(msg) ? 'No internet connection' : 'Could not sign in', /invalid login|already|fetch|network/i.test(msg) ? '' : msg);
    }
    setBusy(false);
  };

  if (checking) return <div className="grid min-h-[100dvh] place-items-center"><Brill size={70} className="animate-bob" /></div>;

  if (pending)
    return (
      <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-5 px-5 text-center">
        <Brill size={90} mood="think" />
        <h1 className="on-bg text-2xl font-semibold">Waiting for approval</h1>
        <p className="on-bg-muted max-w-sm">
          Hi {pending.name}! The Brilla admin needs to approve your account and choose the voices you record. Ask them to open <b>Backup & safety → Recorders</b>.
        </p>
        <div className="flex gap-2">
          <button onClick={async () => handle(await currentStaff().catch(() => null))} className="btn-primary">
            Check again
          </button>
          <button onClick={() => (signOutServer(), setPending(null))} className="btn-white">
            Sign out
          </button>
        </div>
      </div>
    );

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-5 py-10">
      <div className="text-center">
        <Logo size="text-4xl" />
        <div className="on-bg mt-1 text-lg font-semibold">Admin</div>
      </div>
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6">
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1">
          {[
            ['signin', 'Sign in'],
            ['create', 'Create account'],
          ].map(([id, label]) => (
            <button type="button" key={id} onClick={() => setMode(id)} className={cls('rounded-xl py-2 text-sm font-semibold', mode === id ? 'bg-white shadow-soft' : 'text-slate-500')}>
              {label}
            </button>
          ))}
        </div>
        <p className="text-sm text-slate-500">{mode === 'create' ? 'Recorders: create your account, then ask the Brilla admin to approve it.' : 'Sign in to record voices and manage Brilla.'}</p>
        {mode === 'create' && (
          <Field label="Your name">
            <input className="input" value={f.name} onChange={set('name')} required />
          </Field>
        )}
        <Field label="Email">
          <input className="input" type="email" value={f.email} onChange={set('email')} required autoComplete="username" />
        </Field>
        <Field label="Password">
          <input className="input" type="password" value={f.password} onChange={set('password')} required minLength={6} autoComplete={mode === 'create' ? 'new-password' : 'current-password'} />
        </Field>
        <button disabled={busy} className="btn-primary w-full py-3 text-lg">
          {busy ? 'Please wait…' : mode === 'create' ? 'Create account' : 'Sign in'}
        </button>
        <p className="text-center text-xs text-slate-400">Needs internet the first time. After that the app works offline and uploads recordings when you’re back online.</p>
      </form>
    </div>
  );
}

/**
 * Keeps the Admin app's local login in step with the server: when the app opens (and comes back online),
 * re-checks the account so a suspended or removed recorder is signed out, and starts publishing.
 */
export function StaffSync() {
  const userId = useDB((s) => s.session.userId);
  const loginLocal = useStaffLogin();
  useEffect(() => {
    if (!userId) return;
    const check = async () => {
      if (!navigator.onLine) return;
      try {
        const staff = await currentStaff();
        if (!staff || staff.status !== 'active') {
          useDB.getState().logout();
          if (staff?.status === 'suspended') toast.error('Your Brilla access was suspended');
          if (!staff) signOutServer();
        } else loginLocal(staff);
      } catch {
        /* offline: keep working, uploads wait */
      }
    };
    check();
    window.addEventListener('online', check);
    return () => window.removeEventListener('online', check);
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps
  return null;
}
