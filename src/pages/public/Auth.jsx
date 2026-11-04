import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { PublicHeader } from '../../components/common';
import { Brill } from '../../components/brand';
import { Field, toast } from '../../components/ui';
import { useDB } from '../../data/store';
import { SECRET_PICTURES } from '../../data/seed';
import { useTheme } from '../../lib/hooks';
import { cls } from '../../lib/format';
import { IS_APP } from '../../lib/platform';

const DEMOS = [
  { email: 'parent@brilla.app', label: 'Family parent', emoji: '👨‍👩‍👧', note: '3 kids · 6 weeks paid, 6 units open' },
  { email: 'single@brilla.app', label: 'New parent', emoji: '🧒', note: '1 child · 10 free lessons only' },
  { email: 'expired@brilla.app', label: 'Plan ended', emoji: '⏰', note: 'Family plan ended yesterday · app locked' },
  { email: 'teacher@brilla.app', label: 'Teacher', emoji: '🧑‍🏫', note: 'School plan · 2 classes', school: true },
  { email: 'admin@brilla.app', label: 'Admin', emoji: '🛠️', note: 'Prices, lessons, revenue' },
];

export function homeFor(user) {
  if (user.role === 'admin') return '/admin';
  if (user.role === 'teacher') return '/teacher';
  return '/home';
}

export function Login() {
  useTheme();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const users = useDB((s) => s.users);
  const login = useDB((s) => s.login);
  const schoolsOn = useDB((s) => !!s.settings.schoolsEnabled);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const go = (u) => {
    login(u.id);
    toast.success(`Welcome, ${/\.$/.test(u.name.split(' ')[0]) ? u.name : u.name.split(' ')[0]}!`);
    nav(params.get('next') || homeFor(u));
  };
  const submit = (e) => {
    e.preventDefault();
    const id = email.trim().toLowerCase();
    const u = users.find((x) => x.email.toLowerCase() === id || x.phone === id.replace(/\s/g, ''));
    if (!u || u.password !== password) return toast.error('Email/phone or password is wrong');
    go(u);
  };

  return (
    <div>
      <PublicHeader />
      <div className={cls('mx-auto grid gap-6 px-4 pb-16', IS_APP ? 'max-w-md' : 'max-w-5xl md:grid-cols-2')}>
        <form onSubmit={submit} className="card space-y-4 p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Brill size={56} />
            <div>
              <h1 className="text-3xl font-semibold">Welcome back</h1>
              <p className="text-slate-500">Parents, teachers and admins log in here.</p>
            </div>
          </div>
          <Field label="Email or phone">
            <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="username" required />
          </Field>
          <Field label="Password">
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          </Field>
          <button className="btn-primary w-full py-3 text-lg">Log in</button>
          <p className="text-center text-slate-500">
            New here?{' '}
            <Link to="/signup" className="font-semibold text-brand-700">
              Create an account
            </Link>{' '}
            {schoolsOn && (
              <>
                {' '}
                ·{' '}
                <Link to="/class" className="font-semibold text-brand-700">
                  Pupil login
                </Link>
              </>
            )}
          </p>
        </form>
        {!IS_APP && (
        <div className="card p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Try a demo account</h2>
          <p className="mb-4 text-sm text-slate-500">One tap, no password needed (all demo passwords are demo123, parent PIN 1234).</p>
          <div className="grid gap-3">
            {DEMOS.filter((d) => schoolsOn || !d.school).map((d) => {
              const u = users.find((x) => x.email === d.email);
              return (
                u && (
                  <button key={d.email} onClick={() => go(u)} className="flex items-center gap-3 rounded-2xl border-2 border-slate-100 bg-white p-3 text-left transition hover:border-brand-300 hover:bg-brand-50">
                    <span className="text-3xl">{d.emoji}</span>
                    <span>
                      <span className="block font-semibold">{d.label}</span>
                      <span className="block text-sm text-slate-500">{d.note}</span>
                    </span>
                  </button>
                )
              );
            })}
            {schoolsOn && (
              <Link to="/class?code=GOLD42" className="flex items-center gap-3 rounded-2xl border-2 border-slate-100 bg-white p-3 transition hover:border-brand-300 hover:bg-brand-50">
                <span className="text-3xl">🎒</span>
                <span>
                  <span className="block font-semibold">Pupil (class code GOLD42)</span>
                  <span className="block text-sm text-slate-500">Pick a name and secret picture</span>
                </span>
              </Link>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

const ACCOUNT_TYPES = [
  { id: 'family', role: 'parent', emoji: '👨‍👩‍👧‍👦', title: 'My family', body: 'Up to 5 children' },
  { id: 'school', role: 'teacher', emoji: '🏫', title: 'My school or class', body: 'Teachers and schools' },
];

export function Signup() {
  useTheme();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const users = useDB((s) => s.users);
  const add = useDB((s) => s.add);
  const login = useDB((s) => s.login);
  const schoolsOn = useDB((s) => !!s.settings.schoolsEnabled);
  const types = ACCOUNT_TYPES.filter((t) => schoolsOn || t.id !== 'school');
  const [type, setType] = useState(types.some((t) => t.id === params.get('plan')) ? params.get('plan') : 'family');
  const [f, setF] = useState({ name: '', email: '', phone: '', password: '', schoolName: '', pin: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    if (users.some((u) => u.email.toLowerCase() === f.email.trim().toLowerCase())) return toast.error('That email already has an account', 'Try logging in instead');
    if (f.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (!/^\d{4}$/.test(f.pin)) return toast.error('Choose a 4-digit PIN', 'It keeps kids out of the grown-up area');
    const t = ACCOUNT_TYPES.find((x) => x.id === type);
    const u = add('users', { role: t.role, plan: type, name: f.name.trim(), email: f.email.trim(), phone: f.phone.trim(), password: f.password, pin: f.pin, schoolName: t.role === 'teacher' ? f.schoolName.trim() : undefined });
    login(u.id);
    useDB.getState().unlockParent();
    toast.success('Account created!', t.role === 'teacher' ? 'Now create your first class' : 'Now add your child');
    nav(t.role === 'teacher' ? '/teacher?new=1' : '/parent?new=1');
  };

  return (
    <div>
      <PublicHeader />
      <form onSubmit={submit} className="card mx-auto mb-16 max-w-2xl space-y-5 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <Brill size={56} mood="wow" />
          <div>
            <h1 className="text-3xl font-semibold">Create your account</h1>
            <p className="text-slate-500">10 free lessons in every subject straight away. Up to 5 children on one plan.</p>
          </div>
        </div>
        {types.length > 1 && (
        <div>
          <span className="label">Who is Brilla for?</span>
          <div className="grid gap-3 sm:grid-cols-2">
            {types.map((t) => (
              <button type="button" key={t.id} onClick={() => setType(t.id)} className={cls('rounded-2xl border-4 p-4 text-left transition', type === t.id ? 'border-brand-500 bg-brand-50' : 'border-slate-100 bg-white')}>
                <span className="text-3xl">{t.emoji}</span>
                <span className="mt-1 block font-semibold">{t.title}</span>
                <span className="block text-sm text-slate-500">{t.body}</span>
              </button>
            ))}
          </div>
        </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <input className="input" value={f.name} onChange={set('name')} required />
          </Field>
          {type === 'school' && (
            <Field label="School name">
              <input className="input" value={f.schoolName} onChange={set('schoolName')} required />
            </Field>
          )}
          <Field label="Email">
            <input className="input" type="email" value={f.email} onChange={set('email')} required />
          </Field>
          <Field label="Phone (for MoMo)">
            <input className="input" inputMode="tel" value={f.phone} onChange={set('phone')} placeholder="024 123 4567" />
          </Field>
          <Field label="Password">
            <input className="input" type="password" value={f.password} onChange={set('password')} required minLength={6} />
          </Field>
          <Field label="4-digit grown-up PIN" hint="Locks the parent/teacher area">
            <input className="input tracking-[0.4em]" inputMode="numeric" maxLength={4} value={f.pin} onChange={(e) => setF((x) => ({ ...x, pin: e.target.value.replace(/\D/g, '') }))} required />
          </Field>
        </div>
        <button className="btn-accent w-full py-3.5 text-lg">Create account</button>
        <p className="text-center text-slate-500">
          Already have one?{' '}
          <Link to="/login" className="font-semibold text-brand-700">
            Log in
          </Link>
        </p>
      </form>
    </div>
  );
}

export function ClassLogin() {
  useTheme();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const classes = useDB((s) => s.classes);
  const children = useDB((s) => s.children);
  const loginStudent = useDB((s) => s.loginStudent);
  const [code, setCode] = useState(params.get('code') || '');
  const [pupil, setPupil] = useState(null);
  const [shake, setShake] = useState(false);
  const schoolsOn = useDB((s) => !!s.settings.schoolsEnabled);
  const cls_ = classes.find((c) => c.code === code.trim().toUpperCase());
  const pupils = cls_ ? children.filter((c) => c.classId === cls_.id) : [];

  const tryPicture = (pic) => {
    if (pic === pupil.picture) {
      loginStudent(pupil.id);
      nav(`/kid/${pupil.id}`);
    } else {
      setShake(true);
      setTimeout(() => setShake(false), 450);
    }
  };

  if (!schoolsOn) return <Navigate to="/login" replace />;

  return (
    <div>
      <PublicHeader />
      <div className="card mx-auto mb-16 max-w-2xl p-6 text-center sm:p-8">
        <Brill size={70} className="mx-auto animate-bob" />
        {!cls_ ? (
          <>
            <h1 className="mt-2 text-3xl font-semibold">Type your class code</h1>
            <p className="text-slate-500">Your teacher will give you the code.</p>
            <input className="input mx-auto mt-5 max-w-xs text-center text-3xl uppercase tracking-[0.3em]" value={code} onChange={(e) => setCode(e.target.value)} maxLength={8} placeholder="ABC123" autoFocus />
            {code.length >= 6 && <p className="mt-3 text-rose-600">We couldn’t find that class.</p>}
          </>
        ) : !pupil ? (
          <>
            <h1 className="mt-2 text-3xl font-semibold">{cls_.name}: who are you?</h1>
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {pupils.map((p) => (
                <button key={p.id} onClick={() => setPupil(p)} className="flex flex-col items-center rounded-3xl border-4 border-slate-100 bg-white p-4 transition hover:border-brand-300">
                  <span className="text-5xl">{p.avatar}</span>
                  <span className="mt-1 text-lg font-semibold">{p.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setCode('')} className="btn-ghost mt-4">
              Different class
            </button>
          </>
        ) : (
          <>
            <h1 className="mt-2 text-3xl font-semibold">
              Hi {pupil.name}! {pupil.avatar}
            </h1>
            <p className="text-slate-500">Tap your secret picture</p>
            <div className={cls('mx-auto mt-6 grid max-w-xs grid-cols-3 gap-3', shake && 'animate-shake')}>
              {SECRET_PICTURES.map((p) => (
                <button key={p} onClick={() => tryPicture(p)} className="grid aspect-square place-items-center rounded-3xl bg-white text-5xl shadow-chunky-sm transition active:translate-y-1 active:shadow-none">
                  {p}
                </button>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">Demo hint: Abena 🍎 · Kojo 🚗 · Efua ⭐ · Kwame 🐟 · Akosua 🌸 · Fiifi ⚽</p>
            <button onClick={() => setPupil(null)} className="btn-ghost mt-2">
              Not me
            </button>
          </>
        )}
      </div>
    </div>
  );
}
