// "Brilla Admin" app start: first time, create the admin login for this phone; after that, log in.
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Logo } from '../../components/brand';
import { Field, toast } from '../../components/ui';
import { useDB } from '../../data/store';
import { useTheme, useUser } from '../../lib/hooks';

export default function AdminAppStart() {
  useTheme();
  const user = useUser();
  const admins = useDB((s) => s.users.filter((u) => u.role === 'admin').length);
  const add = useDB((s) => s.add);
  const login = useDB((s) => s.login);
  const users = useDB((s) => s.users);
  const [f, setF] = useState({ name: '', email: '', password: '', confirm: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  if (user?.role === 'admin' || user?.role === 'recorder') return <Navigate to="/admin" replace />;
  const setup = !admins;

  const submit = (e) => {
    e.preventDefault();
    if (setup) {
      if (f.password.length < 6) return toast.error('Password must be at least 6 characters');
      if (f.password !== f.confirm) return toast.error('The two passwords are different');
      const u = add('users', { role: 'admin', name: f.name.trim() || 'Brilla Admin', email: f.email.trim().toLowerCase(), password: f.password, phone: '' });
      login(u.id);
      toast.success('Admin account created');
      return;
    }
    // Admins and recorders (added in Backup & safety) log in here.
    const u = users.find((x) => (x.role === 'admin' || x.role === 'recorder') && x.email === f.email.trim().toLowerCase());
    if (!u || u.password !== f.password) return toast.error('Email or password is wrong');
    login(u.id);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 px-5 py-10">
      <div className="text-center">
        <Logo size="text-4xl" />
        <div className="on-bg mt-1 text-lg font-semibold">Admin</div>
      </div>
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-6">
        <div>
          <h1 className="text-2xl font-semibold">{setup ? 'Set up your admin login' : 'Admin log in'}</h1>
          <p className="text-sm text-slate-500">{setup ? 'Create the email and password for Brilla Admin on this phone.' : 'Log in to manage Brilla.'}</p>
        </div>
        {setup && (
          <Field label="Your name">
            <input className="input" value={f.name} onChange={set('name')} />
          </Field>
        )}
        <Field label="Email">
          <input className="input" type="email" value={f.email} onChange={set('email')} required autoComplete="username" />
        </Field>
        <Field label="Password">
          <input className="input" type="password" value={f.password} onChange={set('password')} required minLength={6} autoComplete={setup ? 'new-password' : 'current-password'} />
        </Field>
        {setup && (
          <Field label="Confirm password">
            <input className="input" type="password" value={f.confirm} onChange={set('confirm')} required />
          </Field>
        )}
        <button className="btn-primary w-full py-3 text-lg">{setup ? 'Create admin login' : 'Log in'}</button>
        {!setup && <p className="text-center text-xs text-slate-400">Recorders: use the email and password the admin gave you.</p>}
      </form>
    </div>
  );
}
