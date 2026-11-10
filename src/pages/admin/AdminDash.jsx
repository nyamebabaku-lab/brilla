import { useMemo, useState } from 'react';
import { BookOpen, CreditCard, ShieldCheck, Eye, EyeOff, Languages, LayoutDashboard, Mic, Palette, Plus, RotateCcw, Tag, Trash2, Users } from 'lucide-react';
import LanguagesAdmin from './LanguagesAdmin';
import VoiceStudio from './VoiceStudio';
import SafetyAdmin from './SafetyAdmin';
import { useUser } from '../../lib/hooks';
import { backupDue } from '../../lib/safety';
import { IS_ADMIN_APP, IS_APP } from '../../lib/platform';
import { saveFile } from '../../lib/files';
import DashShell from '../../components/DashShell';
import { Bars } from '../../components/Charts';
import { Field, Modal, Stat, Toggle, confirmDialog, toast } from '../../components/ui';
import { moveToTrash, restoreFromTrash } from '../../lib/safety';
import { useDB } from '../../data/store';
import { useShallow } from 'zustand/react/shallow';
import { PERIODS } from '../../data/seed';
import { LEVELS } from '../../curriculum/levels';
import { subjectsForLevel } from '../../curriculum/subjects';
import { countAllLessons, lessonsFor, UNIT_SIZE, UNITS_PER_SUBJECT } from '../../curriculum';
import { isActive } from '../../lib/access';
import { methodLabel, periodOf } from '../../lib/payments';
import { BACKGROUNDS, BG_NAMES, themeFromPreset } from '../../lib/theme';
import { addDays, cls, fmtDate, money, nowISO, uid } from '../../lib/format';

export default function AdminDash() {
  const user = useUser();
  const recorder = user?.role === 'recorder';
  useDB((s) => s.admin); // re-render when backup status changes
  // The admin phone app is mostly used for recording voices, so it opens on the Voice studio.
  const [tab, setTab] = useState(IS_ADMIN_APP || recorder ? 'voice' : 'overview');
  const tabs = recorder
    ? [{ id: 'voice', label: 'Voice studio', icon: <Mic size={16} /> }]
    : [
        { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={16} /> },
        { id: 'voice', label: 'Voice studio', icon: <Mic size={16} /> },
        { id: 'safety', label: 'Backup & safety', icon: <ShieldCheck size={16} /> },
        { id: 'plans', label: 'Plans & prices', icon: <Tag size={16} /> },
        { id: 'lessons', label: 'Lessons', icon: <BookOpen size={16} /> },
        { id: 'languages', label: 'Twi & Ga', icon: <Languages size={16} /> },
        { id: 'subscribers', label: 'Subscribers', icon: <Users size={16} /> },
        { id: 'payments', label: 'Payments', icon: <CreditCard size={16} /> },
        { id: 'themes', label: 'Themes', icon: <Palette size={16} /> },
      ];
  if (recorder)
    return (
      <DashShell title={`Hi ${user.name.split(' ')[0]} 🎙️`} subtitle="Voice studio">
        <VoiceStudio allowedVoices={user.voices || []} />
      </DashShell>
    );
  return (
    <DashShell title="Admin 🛠️" subtitle="Run Brilla: prices, lessons, subscribers and revenue" tabs={tabs} tab={tab} setTab={setTab}>
      {backupDue() && tab !== 'safety' && (
        <button onClick={() => setTab('safety')} className="mb-4 flex w-full items-center gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 p-3 text-left text-amber-900">
          <span className="text-2xl">💾</span>
          <span className="flex-1 text-sm">
            <b>Time to back up.</b> You have new recordings or changes since your last backup. If this {IS_ADMIN_APP ? 'phone is lost or the app is uninstalled' : 'browser data is cleared'}, they can’t be recovered without one.
          </span>
          <span className="btn-accent shrink-0 text-sm">Back up</span>
        </button>
      )}
      {tab === 'overview' && <Overview />}
      {tab === 'safety' && <SafetyAdmin />}
      {tab === 'plans' && <Plans />}
      {tab === 'lessons' && <Lessons />}
      {tab === 'languages' && <LanguagesAdmin />}
      {tab === 'voice' && <VoiceStudio />}
      {tab === 'subscribers' && <Subscribers />}
      {tab === 'payments' && <Payments />}
      {tab === 'themes' && <Themes />}
    </DashShell>
  );
}

function Overview() {
  const users = useDB((s) => s.users);
  const subs = useDB((s) => s.subscriptions);
  const payments = useDB((s) => s.payments);
  const children = useDB((s) => s.children);
  const settings = useDB((s) => s.settings);
  const ok = payments.filter((p) => p.status === 'success');
  const last30 = ok.filter((p) => Date.now() - new Date(p.at) < 30 * 86400000).reduce((a, p) => a + p.amount, 0);
  const active = subs.filter(isActive);
  // Monthly recurring revenue: each active plan's price spread over a month.
  const mrr = active.reduce((a, s) => a + (s.amount / periodOf(s.period).days) * 30, 0);
  const months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i), 1);
    const key = d.toISOString().slice(0, 7);
    return { label: d.toLocaleDateString('en-GB', { month: 'short' }), value: Math.round(ok.filter((p) => p.at.slice(0, 7) === key).reduce((a, p) => a + p.amount, 0)) };
  });
  const byPlan = Object.values(settings.plans).map((p) => ({ plan: p, n: active.filter((s) => s.plan === p.id).length }));
  const byMethod = ['mtn', 'telecel', 'airteltigo', 'card'].map((m) => ({ m, v: ok.filter((p) => p.method === m).reduce((a, p) => a + p.amount, 0) }));
  const totalM = byMethod.reduce((a, x) => a + x.v, 0) || 1;
  const lessonCount = useMemo(() => countAllLessons(settings), [settings]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat emoji="💰" label="Revenue (30 days)" value={money(last30, settings.currency)} tone="green" />
        <Stat emoji="📈" label="Monthly recurring" value={money(Math.round(mrr), settings.currency)} sub="from active plans" />
        <Stat emoji="✅" label="Active subscriptions" value={active.length} sub={`${users.filter((u) => u.role !== 'admin').length} accounts`} tone="accent" />
        <Stat emoji="🧒" label="Learners" value={children.length} sub={`${lessonCount} lessons available`} tone="sky" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <div className="panel p-5">
          <h3 className="mb-3 font-semibold">Revenue by month ({settings.currency})</h3>
          <Bars data={months} color="bg-emerald-500" height={180} />
        </div>
        <div className="panel space-y-5 p-5">
          <div>
            <h3 className="mb-2 font-semibold">Active plans</h3>
            {byPlan.map(({ plan, n }) => (
              <div key={plan.id} className="flex items-center justify-between py-1">
                <span>
                  {plan.emoji} {plan.name}
                </span>
                <b>{n}</b>
              </div>
            ))}
          </div>
          <div>
            <h3 className="mb-2 font-semibold">How people pay</h3>
            {byMethod.map(({ m, v }) => (
              <div key={m} className="mb-2">
                <div className="flex justify-between text-sm">
                  <span>{methodLabel(m)}</span>
                  <span>{Math.round((v / totalM) * 100)}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-brand-500" style={{ width: `${(v / totalM) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Plans() {
  const settings = useDB((s) => s.settings);
  const updateSettings = useDB((s) => s.updateSettings);
  const [plans, setPlans] = useState(settings.plans);
  const [free, setFree] = useState(settings.freeLessons);
  const setPrice = (id, period, v) => setPlans((p) => ({ ...p, [id]: { ...p[id], prices: { ...p[id].prices, [period]: Number(v) } } }));
  const setField = (id, k, v) => setPlans((p) => ({ ...p, [id]: { ...p[id], [k]: v } }));
  const save = () => {
    for (const p of Object.values(plans)) if (Object.values(p.prices).some((x) => !(x > 0))) return toast.error(`${p.name}: every price must be above 0`);
    updateSettings({ plans, freeLessons: Math.max(0, Number(free) || 0) });
    toast.success('Prices saved', 'New prices show on the pricing page straight away');
  };
  return (
    <div className="space-y-5">
      <div className="panel flex flex-wrap items-center gap-4 p-5">
        <div className="flex-1">
          <div className="font-semibold">School accounts</div>
          <p className="text-sm text-slate-500">When on, teachers can sign up, create classes and set homework, pupils log in with class codes, and the School plan is shown for sale.</p>
        </div>
        <Toggle checked={!!settings.schoolsEnabled} onChange={(v) => (updateSettings({ schoolsEnabled: v }), toast.success(v ? 'School accounts turned on' : 'School accounts turned off'))} label={settings.schoolsEnabled ? 'On' : 'Off'} />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Object.values(plans).filter((p) => !p.schoolOnly || settings.schoolsEnabled).map((p) => (
          <div key={p.id} className="panel space-y-3 p-5">
            <div className="flex items-center gap-2 text-2xl">
              {p.emoji}
              <input className="input py-1.5 text-lg font-semibold" value={p.name} onChange={(e) => setField(p.id, 'name', e.target.value)} />
            </div>
            <Field label="Tagline">
              <input className="input" value={p.tagline} onChange={(e) => setField(p.id, 'tagline', e.target.value)} />
            </Field>
            {PERIODS.map((per) => (
              <Field key={per.id} label={`${per.label} price (${settings.currency}${p.perSeat ? ' per pupil' : ''})`}>
                <input className="input" type="number" min={0} step="0.5" value={p.prices[per.id]} onChange={(e) => setPrice(p.id, per.id, e.target.value)} />
              </Field>
            ))}
            {!p.perSeat && (
              <Field label="Children allowed">
                <input className="input" type="number" min={1} max={10} value={p.maxKids} onChange={(e) => setField(p.id, 'maxKids', Number(e.target.value))} />
              </Field>
            )}
            {!p.perSeat && <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-800">Monthly covers 4 weeks (opens 4 units over the month) and yearly covers 52 weeks. A new unit of {UNIT_SIZE} lessons opens every paid week ({UNITS_PER_SUBJECT} units per subject).</p>}
          </div>
        ))}
      </div>
      <div className="panel flex flex-wrap items-end gap-4 p-5">
        <Field label="Free taster lessons per subject (before paying)" className="w-72">
          <input className="input" type="number" min={0} max={50} value={free} onChange={(e) => setFree(e.target.value)} />
        </Field>
        <button onClick={save} className="btn-primary">
          Save all changes
        </button>
      </div>
    </div>
  );
}

function Lessons() {
  const settings = useDB((s) => s.settings);
  const setOverride = useDB((s) => s.setLessonOverride);
  const updateSettings = useDB((s) => s.updateSettings);
  const [levelId, setLevel] = useState('p2');
  const subs = subjectsForLevel(levelId);
  const [subjectId, setSubject] = useState('science');
  const sid = subs.some((s) => s.id === subjectId) ? subjectId : subs[0].id;
  // Include hidden lessons so they can be un-hidden.
  const lessons = useMemo(() => {
    const noHidden = { ...settings, lessonOverrides: Object.fromEntries(Object.entries(settings.lessonOverrides).map(([k, v]) => [k, { ...v, hidden: false }])) };
    return lessonsFor(levelId, sid, { settings: noHidden });
  }, [levelId, sid, settings]);
  const [editing, setEditing] = useState(null);
  const [builder, setBuilder] = useState(null);
  const [unit, setUnit] = useState(0);
  const units = Math.ceil(lessons.length / UNIT_SIZE);
  const u = Math.min(unit, units - 1);
  // Custom lessons are listed first so they are easy to find among 1000 lessons.
  const page = [...lessons.filter((l) => l.custom), ...lessons.filter((l) => !l.custom).slice(u * UNIT_SIZE, (u + 1) * UNIT_SIZE)];

  const saveCustom = (e) => {
    e.preventDefault();
    if (!builder.title.trim() || builder.questions.some((q) => !q.prompt.trim() || q.options.some((o) => !o.trim()))) return toast.error('Fill in the title and every question and answer');
    const rest = settings.customLessons.filter((c) => c.id !== builder.id);
    updateSettings({ customLessons: [...rest, { ...builder, levelId, subjectId: sid }] });
    toast.success('Lesson saved', 'Children see it at the end of the subject map');
    setBuilder(null);
  };
  const blankQ = () => ({ prompt: '', options: ['', '', '', ''], answer: 0, emoji: '' });

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap gap-3 p-4">
        <Field label="Level" className="w-48">
          <select className="input" value={levelId} onChange={(e) => setLevel(e.target.value)}>
            {LEVELS.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Subject" className="w-48">
          <select className="input" value={sid} onChange={(e) => setSubject(e.target.value)}>
            {subs.map((s) => (
              <option key={s.id} value={s.id}>
                {s.emoji} {s.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label={`Unit (${lessons.length} lessons)`} className="w-56">
          <select className="input" value={u} onChange={(e) => setUnit(Number(e.target.value))}>
            {Array.from({ length: units }, (_, k) => (
              <option key={k} value={k}>
                Unit {k + 1}: lessons {k * UNIT_SIZE + 1}–{Math.min(lessons.length, (k + 1) * UNIT_SIZE)}
              </option>
            ))}
          </select>
        </Field>
        <button onClick={() => setBuilder({ id: `custom_${uid('l').slice(2)}`, title: '', emoji: '⭐', intro: '', questions: [blankQ()] })} className="btn-accent self-end">
          <Plus size={18} /> New quiz lesson
        </button>
      </div>
      <div className="panel divide-y">
        {page.map((l) => {
          const ov = settings.lessonOverrides[l.id] || {};
          return (
            <div key={l.id} className={cls('flex flex-wrap items-center gap-3 p-3', ov.hidden && 'opacity-50')}>
              <span className="w-8 text-center text-sm text-slate-400">{l.order + 1}</span>
              <span className="text-2xl">{l.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{l.title}</div>
                <div className="flex gap-1">
                  {l.free && <span className="chip bg-emerald-100 text-emerald-700">Free</span>}
                  {l.custom && <span className="chip bg-accent-100 text-accent-700">Custom</span>}
                  {ov.hidden && <span className="chip bg-slate-200 text-slate-600">Hidden</span>}
                </div>
              </div>
              <label className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" checked={!!ov.free} onChange={(e) => setOverride(l.id, { free: e.target.checked })} /> Always free
              </label>
              <button onClick={() => setEditing({ id: l.id, title: l.title })} className="btn-ghost px-2 text-sm">
                Rename
              </button>
              {l.custom && (
                <button onClick={() => setBuilder(settings.customLessons.find((c) => c.id === l.id))} className="btn-ghost px-2 text-sm">
                  Edit
                </button>
              )}
              <button onClick={() => setOverride(l.id, { hidden: !ov.hidden })} className="btn-ghost px-2" aria-label={ov.hidden ? 'Show' : 'Hide'}>
                {ov.hidden ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {l.custom && (
                <button
                  onClick={async () => {
                    const lesson = settings.customLessons.find((c) => c.id === l.id);
                    if (!(await confirmDialog({ title: 'Delete this lesson?', body: `“${l.title}” goes to the recycle bin for 30 days.` }))) return;
                    updateSettings({ customLessons: settings.customLessons.filter((c) => c.id !== l.id) });
                    const id = await moveToTrash('lesson', `Lesson “${l.title}”`, { lesson });
                    toast.undo('Lesson deleted', () => restoreFromTrash(id));
                  }}
                  className="btn-ghost px-2 text-rose-600"
                  aria-label="Delete"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>
      <Modal open={!!editing} onClose={() => setEditing(null)} title="Rename lesson">
        {editing && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setOverride(editing.id, { title: editing.title.trim() });
              setEditing(null);
            }}
            className="space-y-4"
          >
            <input className="input" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} autoFocus />
            <button className="btn-primary w-full">Save</button>
          </form>
        )}
      </Modal>
      <Modal open={!!builder} onClose={() => setBuilder(null)} title="Quiz lesson builder" wide>
        {builder && (
          <form onSubmit={saveCustom} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-[5rem_1fr]">
              <Field label="Emoji">
                <input className="input text-center text-2xl" value={builder.emoji} onChange={(e) => setBuilder({ ...builder, emoji: e.target.value })} />
              </Field>
              <Field label="Title">
                <input className="input" value={builder.title} onChange={(e) => setBuilder({ ...builder, title: e.target.value })} required />
              </Field>
            </div>
            <Field label="Intro (read aloud before the questions)">
              <textarea className="input" rows={2} value={builder.intro} onChange={(e) => setBuilder({ ...builder, intro: e.target.value })} />
            </Field>
            {builder.questions.map((q, qi) => {
              const setQ = (patch) => setBuilder({ ...builder, questions: builder.questions.map((x, j) => (j === qi ? { ...x, ...patch } : x)) });
              return (
                <div key={qi} className="rounded-2xl bg-slate-50 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <b>Question {qi + 1}</b>
                    {builder.questions.length > 1 && (
                      <button type="button" onClick={() => setBuilder({ ...builder, questions: builder.questions.filter((_, j) => j !== qi) })} className="btn-ghost px-2 text-rose-600">
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-[1fr_5rem]">
                    <input className="input" placeholder="Question" value={q.prompt} onChange={(e) => setQ({ prompt: e.target.value })} />
                    <input className="input text-center" placeholder="🖼️" value={q.emoji} onChange={(e) => setQ({ emoji: e.target.value })} />
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {q.options.map((o, oi) => (
                      <label key={oi} className="flex items-center gap-2">
                        <input type="radio" name={`ans${qi}`} checked={q.answer === oi} onChange={() => setQ({ answer: oi })} title="Correct answer" />
                        <input className="input py-1.5" placeholder={`Answer ${oi + 1}`} value={o} onChange={(e) => setQ({ options: q.options.map((x, j) => (j === oi ? e.target.value : x)) })} />
                      </label>
                    ))}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Tick the circle next to the correct answer.</p>
                </div>
              );
            })}
            <div className="flex justify-between">
              <button type="button" onClick={() => setBuilder({ ...builder, questions: [...builder.questions, blankQ()] })} className="btn-soft">
                <Plus size={16} /> Add question
              </button>
              <button className="btn-primary px-6">Save lesson</button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

function Subscribers() {
  const users = useDB(useShallow((s) => s.users.filter((u) => u.role !== 'admin' && u.role !== 'recorder')));
  const subs = useDB((s) => s.subscriptions);
  const children = useDB((s) => s.children);
  const settings = useDB((s) => s.settings);
  const add = useDB((s) => s.add);
  const update = useDB((s) => s.update);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('all');
  const rows = users
    .map((u) => {
      const mine = subs.filter((s) => s.userId === u.id).sort((a, b) => new Date(b.expiresAt) - new Date(a.expiresAt));
      const active = mine.find(isActive);
      return { u, sub: active || mine[0], active: !!active, kids: children.filter((c) => c.ownerId === u.id).length };
    })
    .filter((r) => (filter === 'all' ? true : filter === 'active' ? r.active : !r.active))
    .filter((r) => `${r.u.name} ${r.u.email} ${r.u.phone}`.toLowerCase().includes(q.toLowerCase()));

  const gift = (u) => {
    add('subscriptions', { userId: u.id, plan: u.role === 'teacher' ? 'school' : 'family', period: 'monthly', seats: 30, amount: 0, status: 'active', autoRenew: false, startedAt: nowISO(), expiresAt: addDays(nowISO(), 28), gifted: true });
    toast.success(`Gave ${u.name} 4 free weeks`);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <input className="input max-w-xs" placeholder="Search name, email, phone" value={q} onChange={(e) => setQ(e.target.value)} />
        {['all', 'active', 'inactive'].map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={cls('rounded-xl px-3 py-2 text-sm font-semibold capitalize', filter === f ? 'bg-brand-600 text-white' : 'bg-white')}>
            {f}
          </button>
        ))}
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">Account</th>
              <th>Type</th>
              <th>Learners</th>
              <th>Plan</th>
              <th>Ends</th>
              <th>Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map(({ u, sub, active, kids }) => (
              <tr key={u.id}>
                <td className="p-3">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-xs text-slate-500">
                    {u.email} · {u.phone}
                  </div>
                </td>
                <td className="capitalize">{u.role}</td>
                <td>{kids}</td>
                <td>{sub ? `${settings.plans[sub.plan]?.name} · ${periodOf(sub.period).label}${settings.plans[sub.plan]?.perSeat ? ` · ${sub.seats} seats` : ''}` : '—'}</td>
                <td>{sub ? fmtDate(sub.expiresAt) : '—'}</td>
                <td>
                  <span className={cls('chip', active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>{active ? 'active' : sub ? 'expired' : 'free'}</span>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => gift(u)} className="btn-ghost px-2 py-1 text-xs">
                    +4 weeks
                  </button>
                  {active && (
                    <button onClick={() => (update('subscriptions', sub.id, { status: 'cancelled' }), toast.info('Subscription cancelled'))} className="btn-ghost px-2 py-1 text-xs text-rose-600">
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Payments() {
  const payments = useDB(useShallow((s) => [...s.payments].sort((a, b) => new Date(b.at) - new Date(a.at))));
  const users = useDB((s) => s.users);
  const settings = useDB((s) => s.settings);
  const [status, setStatus] = useState('all');
  const rows = payments.filter((p) => status === 'all' || p.status === status);
  const csv = () => {
    const lines = [['Date', 'Ref', 'Customer', 'Plan', 'Period', 'Seats', 'Method', 'Amount', 'Status'], ...rows.map((p) => [p.at, p.ref, users.find((u) => u.id === p.userId)?.name || '', p.plan, p.period, p.seats, methodLabel(p.method), p.amount, p.status])];
    const blob = new Blob([lines.map((l) => l.map((x) => `"${String(x).replace(/"/g, '""')}"`).join(',')).join('\n')], { type: 'text/csv' });
    saveFile('brilla-payments.csv', blob);
  };
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {['all', 'success', 'failed'].map((f) => (
          <button key={f} onClick={() => setStatus(f)} className={cls('rounded-xl px-3 py-2 text-sm font-semibold capitalize', status === f ? 'bg-brand-600 text-white' : 'bg-white')}>
            {f}
          </button>
        ))}
        <button onClick={csv} className="btn-white ml-auto text-sm">
          Download CSV
        </button>
      </div>
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[44rem] text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3">Date</th>
              <th>Ref</th>
              <th>Customer</th>
              <th>Plan</th>
              <th>Method</th>
              <th className="text-right">Amount</th>
              <th className="p-3 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {rows.map((p) => (
              <tr key={p.id}>
                <td className="p-3">{fmtDate(p.at)}</td>
                <td className="font-mono text-xs">{p.ref}</td>
                <td>{users.find((u) => u.id === p.userId)?.name || '—'}</td>
                <td>
                  {settings.plans[p.plan]?.name} · {periodOf(p.period).label}
                </td>
                <td>
                  {methodLabel(p.method)} <span className="text-xs text-slate-400">{p.account}</span>
                </td>
                <td className="text-right font-semibold">{money(p.amount, settings.currency)}</td>
                <td className="p-3 text-right">
                  <span className={cls('chip', p.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>{p.status}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Themes() {
  const settings = useDB((s) => s.settings);
  const updateSettings = useDB((s) => s.updateSettings);
  const resetDemo = useDB((s) => s.resetDemo);
  const [draft, setDraft] = useState({ name: '', emoji: '🎨', brand: '#0ea5e9', accent: '#f43f5e', bg: 'sky' });
  const [confirm, setConfirm] = useState(false);
  const addPreset = (e) => {
    e.preventDefault();
    if (!draft.name.trim()) return;
    updateSettings({ presets: [...settings.presets, { ...draft, id: uid('th') }] });
    toast.success('Theme added', 'Children can pick it in “My colours”');
    setDraft({ ...draft, name: '' });
  };
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <div className="panel p-5">
        <h3 className="mb-3 font-semibold">Theme presets</h3>
        <div className="grid grid-cols-2 gap-3">
          {settings.presets.map((p) => (
            <div key={p.id} className={cls('overflow-hidden rounded-2xl border-2', settings.defaultTheme.preset === p.id ? 'border-brand-500' : 'border-slate-100')}>
              <div className="flex h-16 items-center justify-center gap-2 text-3xl" style={{ background: BACKGROUNDS[p.bg] }}>
                {p.emoji}
                <span className="h-6 w-6 rounded-full border-2 border-white" style={{ background: p.brand }} />
                <span className="h-6 w-6 rounded-full border-2 border-white" style={{ background: p.accent }} />
              </div>
              <div className="flex items-center gap-1 p-2">
                <span className="flex-1 font-medium">{p.name}</span>
                <button onClick={() => (updateSettings({ defaultTheme: themeFromPreset(p) }), toast.success(`${p.name} is now the default`))} className="btn-ghost px-2 py-1 text-xs">
                  {settings.defaultTheme.preset === p.id ? 'Default ✓' : 'Make default'}
                </button>
                {settings.presets.length > 1 && (
                  <button
                    onClick={async () => {
                      if (!(await confirmDialog({ title: 'Delete this theme?', body: `“${p.name}” goes to the recycle bin for 30 days.` }))) return;
                      updateSettings({ presets: settings.presets.filter((x) => x.id !== p.id) });
                      const id = await moveToTrash('theme', `Theme “${p.name}”`, { preset: p });
                      toast.undo('Theme deleted', () => restoreFromTrash(id));
                    }}
                    className="btn-ghost px-1.5 py-1 text-rose-600"
                    aria-label="Delete theme"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-5">
        <form onSubmit={addPreset} className="panel space-y-3 p-5">
          <h3 className="font-semibold">Add a theme</h3>
          <div className="grid grid-cols-[5rem_1fr] gap-3">
            <Field label="Emoji">
              <input className="input text-center text-2xl" value={draft.emoji} onChange={(e) => setDraft({ ...draft, emoji: e.target.value })} />
            </Field>
            <Field label="Name">
              <input className="input" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="e.g. Kente Gold" />
            </Field>
          </div>
          <div className="flex gap-4">
            <Field label="Main">
              <input type="color" className="h-11 w-20 rounded-xl" value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} />
            </Field>
            <Field label="Accent">
              <input type="color" className="h-11 w-20 rounded-xl" value={draft.accent} onChange={(e) => setDraft({ ...draft, accent: e.target.value })} />
            </Field>
            <Field label="Background" className="flex-1">
              <select className="input" value={draft.bg} onChange={(e) => setDraft({ ...draft, bg: e.target.value })}>
                {Object.keys(BACKGROUNDS).map((b) => (
                  <option key={b} value={b}>
                    {BG_NAMES[b]}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <button className="btn-primary">
            <Plus size={16} /> Add theme
          </button>
        </form>
        {!IS_APP && (
        <div className="panel p-5">
          <h3 className="font-semibold">Demo data</h3>
          <p className="mb-3 text-sm text-slate-500">Put every account, payment and lesson setting back to the starting demo.</p>
          <button onClick={() => setConfirm(true)} className="btn-danger">
            <RotateCcw size={16} /> Reset demo data
          </button>
        </div>
        )}
      </div>
      <Modal
        open={confirm}
        onClose={() => setConfirm(false)}
        title="Reset all demo data?"
        footer={
          <>
            <button onClick={() => setConfirm(false)} className="btn-ghost">
              Cancel
            </button>
            <button onClick={() => (resetDemo(), (location.hash = '#/login'))} className="btn bg-rose-600 text-white">
              Reset
            </button>
          </>
        }
      >
        <p className="text-slate-600">This clears everything on this device, including new accounts, and logs you out.</p>
      </Modal>
    </div>
  );
}

