import { useEffect, useMemo, useState } from 'react';
import { listVoices, say, setInstructor } from '../../lib/speech';
import { INSTRUCTORS } from '../../lib/instructors';
import { downloadVoices, voiceStats } from '../../lib/voiceBank';
import { IS_APP } from '../../lib/platform';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, CreditCard, Pencil, Play, Plus, Settings, Trash2, Users } from 'lucide-react';
import DashShell from '../../components/DashShell';
import PlanBanner from '../../components/PlanBanner';
import ChildForm from '../../components/ChildForm';
import { Bars, SubjectBars } from '../../components/Charts';
import { PeriodSwitch, PlanCards, GrownUpGate, InstallButton } from '../../components/common';
import { Empty, Field, Modal, Stat, Stars, Toggle, toast } from '../../components/ui';
import { useDB } from '../../data/store';
import { useShallow } from 'zustand/react/shallow';
import { DEFAULT_THEME } from '../../lib/theme';
import { useUser } from '../../lib/hooks';
import { activeSub, nextUnitAt, seatsCovered, unitsUnlocked } from '../../lib/access';
import { methodLabel, periodOf } from '../../lib/payments';
import { catalogFor, buildLesson, UNIT_SIZE, UNITS_PER_SUBJECT } from '../../curriculum';
import { levelName } from '../../curriculum/levels';
import { subjectById } from '../../curriculum/subjects';
import { lessonsDone, minutesToday, streak, subjectProgress, totalStars, weekUsage } from '../../lib/progress';
import { cls, daysBetween, fmtDate, fmtDateTime, money } from '../../lib/format';

const UNLOCK_MS = 20 * 60 * 1000;

export default function ParentDash() {
  const user = useUser();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const unlockedAt = useDB((s) => s.session.parentUnlockedAt);
  const unlockParent = useDB((s) => s.unlockParent);
  const [tab, setTab] = useState(params.get('tab') || (params.get('new') || params.get('add') ? 'children' : 'progress'));

  if (Date.now() - unlockedAt > UNLOCK_MS)
    return (
      <DashShell title="Grown-ups only">
        <GrownUpGate open onClose={() => nav('/home')} onPass={unlockParent} pin={user.pin} />
      </DashShell>
    );

  const tabs = [
    { id: 'progress', label: 'Progress', icon: <BarChart3 size={16} /> },
    { id: 'children', label: 'Children', icon: <Users size={16} /> },
    { id: 'billing', label: 'Plan & payments', icon: <CreditCard size={16} /> },
    { id: 'settings', label: 'Settings', icon: <Settings size={16} /> },
  ];
  return (
    <DashShell
      title={`Hello, ${user.name.split(' ')[0]} 👋`}
      subtitle="Your grown-up dashboard"
      tabs={tabs}
      tab={tab}
      setTab={setTab}
      actions={
        <Link to="/home" className="btn-accent">
          <Play size={16} /> Kids mode
        </Link>
      }
    >
      <PlanBanner user={user} />
      {tab === 'progress' && <ProgressTab user={user} goChildren={() => setTab('children')} />}
      {tab === 'children' && <ChildrenTab user={user} autoAdd={!!(params.get('add') || params.get('new'))} />}
      {tab === 'billing' && <BillingTab user={user} />}
      {tab === 'settings' && <SettingsTab user={user} />}
    </DashShell>
  );
}

function ProgressTab({ user, goChildren }) {
  const kids = useDB(useShallow((s) => s.children.filter((c) => c.ownerId === user.id)));
  const settings = useDB((s) => s.settings);
  const progress = useDB((s) => s.progress);
  const usage = useDB((s) => s.usage);
  const gallery = useDB((s) => s.gallery);
  const [sel, setSel] = useState(kids[0]?.id);
  const child = kids.find((k) => k.id === sel) || kids[0];
  const catalog = useMemo(() => (child ? catalogFor(child.levelId, { track: child.track, childName: child.name, lang: child.localLang, settings }) : []), [child, settings]);
  if (!child) return <Empty emoji="🧒" title="No children yet" body="Add your child to start learning." action={<button onClick={goChildren} className="btn-primary mt-2">Add a child</button>} />;

  const prog = progress[child.id] || {};
  const week = weekUsage(usage[child.id]);
  const recent = Object.entries(prog)
    .sort((a, b) => new Date(b[1].lastAt) - new Date(a[1].lastAt))
    .slice(0, 8);
  const per = subjectProgress(catalog, prog);
  const weekMins = week.reduce((a, d) => a + d.mins, 0);
  const strongest = [...per].filter((p) => p.done).sort((a, b) => b.stars / b.done - a.stars / a.done)[0];

  return (
    <div className="space-y-5">
      <div className="no-scrollbar flex gap-2 overflow-x-auto">
        {kids.map((k) => (
          <button key={k.id} onClick={() => setSel(k.id)} className={cls('flex shrink-0 items-center gap-2 rounded-2xl border-2 px-3 py-2 font-semibold', k.id === child.id ? 'border-brand-500 bg-white' : 'border-transparent bg-white/60')}>
            <span className="text-2xl">{k.avatar}</span> {k.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat emoji="📚" label="Lessons done" value={lessonsDone(prog)} sub={levelName(child.levelId, child.track)} />
        <Stat emoji="⭐" label="Stars" value={totalStars(prog)} tone="accent" />
        <Stat emoji="🔥" label="Day streak" value={streak(usage[child.id])} tone="green" />
        <Stat emoji="⏱️" label="This week" value={`${weekMins} min`} sub={`${minutesToday(usage[child.id])} min today`} tone="sky" />
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="panel p-5">
          <h3 className="mb-3 font-semibold">Minutes learning (last 7 days)</h3>
          <Bars data={week.map((d) => ({ label: d.label, value: d.mins }))} />
        </div>
        <div className="panel p-5">
          <h3 className="mb-3 font-semibold">Subjects</h3>
          <SubjectBars rows={per} />
          {strongest && (
            <p className="mt-4 rounded-xl bg-emerald-50 p-3 text-sm text-emerald-800">
              💪 {child.name} is doing best in <b>{strongest.subject.name}</b>.
            </p>
          )}
        </div>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="panel p-5">
          <h3 className="mb-3 font-semibold">Recent lessons</h3>
          {recent.length === 0 ? (
            <p className="text-slate-500">No lessons yet.</p>
          ) : (
            <ul className="divide-y">
              {recent.map(([id, p]) => {
                const l = buildLesson(id, { track: child.track, childName: child.name, lang: child.localLang, settings });
                const subj = l && subjectById(l.meta.subjectId);
                return (
                  <li key={id} className="flex items-center gap-3 py-2">
                    <span className="text-2xl">{subj?.emoji || '⭐'}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{l?.meta.title || id}</span>
                      <span className="text-xs text-slate-500">
                        {fmtDateTime(p.lastAt)} · {p.attempts}× played
                      </span>
                    </span>
                    <Stars n={p.stars} size="text-sm" />
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="panel p-5">
          <h3 className="mb-3 font-semibold">{child.name}’s art and writing</h3>
          {(gallery[child.id] || []).length === 0 ? (
            <p className="text-slate-500">Drawings and colouring pages will appear here.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {(gallery[child.id] || []).slice(0, 9).map((g) => (g.image ? <img key={g.id} src={g.image} alt={g.title} className="aspect-square rounded-xl border object-cover" /> : <div key={g.id} className="line-clamp-5 aspect-square overflow-hidden rounded-xl border bg-white p-2 text-[10px]">{g.text}</div>))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChildrenTab({ user, autoAdd }) {
  const kids = useDB(useShallow((s) => s.children.filter((c) => c.ownerId === user.id)));
  const add = useDB((s) => s.add);
  const update = useDB((s) => s.update);
  const remove = useDB((s) => s.remove);
  const plans = useDB((s) => s.settings.plans);
  const [form, setForm] = useState(autoAdd ? 'new' : null);
  const [del, setDel] = useState(null);
  const sub = activeSub(user.id);
  const seats = seatsCovered(user.id);
  const max = plans.family?.maxKids || 5;

  const save = (data) => {
    if (form === 'new') {
      if (kids.length >= max) return toast.error(`You can add up to ${max} children`);
      add('children', { ...data, ownerId: user.id, theme: DEFAULT_THEME });
      toast.success(`${data.name} added!`);
    } else {
      update('children', form.id, data);
      toast.success('Saved');
    }
    setForm(null);
  };

  return (
    <div className="space-y-4">
      {sub && kids.length > seats && (
        <div className="rounded-2xl bg-amber-50 p-4 text-amber-900">
          Your plan covers {seats} {seats === 1 ? 'child' : 'children'}. Extra profiles can only use the free lessons.
        </div>
      )}
      <p className="on-bg-muted text-sm">
        {kids.length} of {max} child profiles used.
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {kids.map((k, i) => (
          <div key={k.id} className="panel p-5">
            <div className="flex items-center gap-3">
              <span className="grid h-16 w-16 place-items-center rounded-2xl bg-brand-50 text-4xl">{k.avatar}</span>
              <div className="min-w-0">
                <div className="text-xl font-semibold">{k.name}</div>
                <div className="text-sm text-slate-500">
                  {levelName(k.levelId, k.track)} · {k.track === 'ges' ? '🇬🇭 GES' : '🌍 International'}
                </div>
                <div className="text-xs text-slate-400">{k.screenLimit ? `${k.screenLimit} min/day limit` : 'No time limit'}</div>
              </div>
            </div>
            <div className="mt-3">{i < seats ? <span className="chip bg-emerald-100 text-emerald-700">All lessons unlocked</span> : <span className="chip bg-slate-100 text-slate-600">Free lessons only</span>}</div>
            <div className="mt-4 flex gap-2">
              <Link to={`/kid/${k.id}`} className="btn-primary flex-1">
                <Play size={16} /> Open
              </Link>
              <button onClick={() => setForm(k)} className="btn-soft px-3" aria-label="Edit">
                <Pencil size={16} />
              </button>
              <button onClick={() => setDel(k)} className="btn-danger px-3" aria-label="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
        {kids.length < max && <button onClick={() => setForm('new')} className="flex min-h-[12rem] flex-col items-center justify-center gap-2 rounded-2xl border-4 border-dashed border-brand-200 bg-white/50 font-semibold text-brand-700 hover:bg-white">
          <Plus size={32} /> Add a child
        </button>}
      </div>
      {form && <ChildForm open onClose={() => setForm(null)} onSave={save} initial={form === 'new' ? null : form} />}
      <Modal
        open={!!del}
        onClose={() => setDel(null)}
        title={`Remove ${del?.name}?`}
        footer={
          <>
            <button onClick={() => setDel(null)} className="btn-ghost">
              Cancel
            </button>
            <button
              onClick={() => {
                remove('children', del.id);
                setDel(null);
                toast.info('Profile removed');
              }}
              className="btn bg-rose-600 text-white"
            >
              Remove
            </button>
          </>
        }
      >
        <p className="text-slate-600">Their stars, stickers and drawings on this device will be removed too.</p>
      </Modal>
    </div>
  );
}

function BillingTab({ user }) {
  const nav = useNavigate();
  const subs = useDB(useShallow((s) => s.subscriptions.filter((x) => x.userId === user.id)));
  const payments = useDB(useShallow((s) => s.payments.filter((p) => p.userId === user.id).sort((a, b) => new Date(b.at) - new Date(a.at))));
  const settings = useDB((s) => s.settings);
  const update = useDB((s) => s.update);
  const [period, setPeriod] = useState('monthly');
  const sub = activeSub(user.id, subs);
  const units = unitsUnlocked(user.id, subs);
  const next = nextUnitAt(user.id, subs);

  return (
    <div className="space-y-5">
      {sub ? (
        <div className="panel flex flex-wrap items-center gap-4 p-5">
          <span className="text-5xl">{settings.plans[sub.plan]?.emoji}</span>
          <div className="flex-1">
            <div className="text-xl font-semibold">{settings.plans[sub.plan]?.name} plan · {periodOf(sub.period).label}</div>
            <div className="text-slate-500">
              Active until <b>{fmtDate(sub.expiresAt)}</b> ({daysBetween(new Date(), sub.expiresAt)} days left)
            </div>
            <div className="mt-1 font-medium text-brand-700">
              🎁 Units open: {Math.min(UNITS_PER_SUBJECT, units)} of {UNITS_PER_SUBJECT}{units < UNITS_PER_SUBJECT && (next ? ` · Unit ${units + 1} opens ${fmtDate(next)}` : ' · renew to keep opening units')}
            </div>
            <div className="mt-2">
              <Toggle checked={sub.autoRenew} onChange={(v) => (update('subscriptions', sub.id, { autoRenew: v }), toast.info(v ? 'Reminders on' : 'Reminders off', v ? 'We’ll remind you 3 days before it ends. Nothing is charged automatically.' : 'Your plan stays active until the end date'))} label="Remind me 3 days before it ends" />
            </div>
          </div>
          <button onClick={() => nav(`/checkout/${sub.plan}?period=${sub.period}`)} className="btn-accent">
            Renew now
          </button>
        </div>
      ) : (
        <div className="panel p-5">
          <div className="text-xl font-semibold">{units ? 'Your plan has ended' : 'You’re on free lessons'}</div>
          <p className="text-slate-500">{units ? `${Math.min(UNITS_PER_SUBJECT, units)} units are waiting for you. Renew to open them again and keep unlocking a new unit every week.` : `Pay to open Unit 1, then a new unit of ${UNIT_SIZE} lessons opens every week in every subject.`}</p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="on-bg text-xl font-semibold">{sub ? 'Pay ahead' : 'Choose how to pay'}</h3>
        <PeriodSwitch value={period} onChange={setPeriod} plans={settings.plans} />
      </div>
      <PlanCards period={period} onPick={(id) => nav(`/checkout/${id}?period=${period}`)} current={sub?.plan} />
      <div className="panel overflow-x-auto p-5">
        <h3 className="mb-3 font-semibold">Payment history</h3>
        {payments.length === 0 ? (
          <p className="text-slate-500">No payments yet.</p>
        ) : (
          <table className="w-full min-w-[32rem] text-sm">
            <thead className="text-left text-slate-500">
              <tr>
                <th className="py-2">Date</th>
                <th>Receipt</th>
                <th>Plan</th>
                <th>Method</th>
                <th className="text-right">Amount</th>
                <th className="text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="py-2">{fmtDate(p.at)}</td>
                  <td className="font-mono text-xs">{p.ref}</td>
                  <td>
                    {settings.plans[p.plan]?.name} · {periodOf(p.period).label}
                  </td>
                  <td>{methodLabel(p.method)}</td>
                  <td className="text-right font-semibold">{money(p.amount, settings.currency)}</td>
                  <td className="text-right">
                    <span className={cls('chip', p.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700')}>{p.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function SettingsTab({ user }) {
  const update = useDB((s) => s.update);
  const prefs = useDB((s) => s.prefs);
  const setPrefs = useDB((s) => s.setPrefs);
  const [f, setF] = useState({ name: user.name, phone: user.phone || '', pin: user.pin || '' });
  const save = (e) => {
    e.preventDefault();
    if (f.pin && !/^\d{4}$/.test(f.pin)) return toast.error('PIN must be 4 digits');
    update('users', user.id, f);
    toast.success('Settings saved');
  };
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <form onSubmit={save} className="panel space-y-4 p-5">
        <h3 className="font-semibold">Account</h3>
        <Field label="Name">
          <input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="Phone (MoMo)">
          <input className="input" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
        </Field>
        <Field label="Grown-up PIN" hint="Asked before opening this dashboard">
          <input className="input tracking-[0.4em]" maxLength={4} inputMode="numeric" value={f.pin} onChange={(e) => setF({ ...f, pin: e.target.value.replace(/\D/g, '') })} />
        </Field>
        <button className="btn-primary">Save</button>
      </form>
      <div className="panel space-y-4 p-5">
        <h3 className="font-semibold">On this device</h3>
        <Toggle checked={prefs.voice} onChange={(v) => setPrefs({ voice: v })} label="Read lessons aloud" />
        <Toggle checked={prefs.sound} onChange={(v) => setPrefs({ sound: v })} label="Sound effects" />
        <VoicePicker />
        {!IS_APP && <VoiceDownload />}
        <div className="pt-2">
          <InstallButton />
          <p className="mt-2 text-sm text-slate-500">Install Brilla to use it offline like a normal app.</p>
        </div>
      </div>
    </div>
  );
}

function VoicePicker() {
  const prefs = useDB((s) => s.prefs);
  const setPrefs = useDB((s) => s.setPrefs);
  const [voices, setVoices] = useState(() => listVoices());
  useEffect(() => {
    const t = setTimeout(() => setVoices(listVoices()), 600);
    return () => clearTimeout(t);
  }, []);
  const test = (g) => {
    setInstructor(g);
    say(INSTRUCTORS[g].hello);
  };
  return (
    <div className="space-y-3 rounded-2xl bg-slate-50 p-3">
      <div className="text-sm font-semibold">Instructor voices on this device</div>
      {['female', 'male'].map((g) => {
        const key = g === 'female' ? 'voiceFemale' : 'voiceMale';
        const options = voices.filter((v) => v.gender === g || v.gender == null);
        return (
          <div key={g} className="flex items-center gap-2">
            <span className="text-2xl">{INSTRUCTORS[g].emoji}</span>
            <select className="input py-1.5 text-sm" value={prefs[key] || ''} onChange={(e) => setPrefs({ [key]: e.target.value || null })}>
              <option value="">Automatic (most natural voice)</option>
              {options.map((v) => (
                <option key={v.uri} value={v.uri}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            <button type="button" onClick={() => test(g)} className="btn-soft shrink-0 px-3 py-1.5 text-sm">
              Test
            </button>
          </div>
        );
      })}
      <p className="text-xs text-slate-500">Voices come from your phone or computer. For the clearest sound: on Android install “Speech Services by Google” and download the high-quality English voice; on iPhone go to Settings → Accessibility → Spoken Content → Voices and download an “Enhanced” voice.</p>
    </div>
  );
}

/** Saves the recorded teacher voices on this device so they work without internet (website only; the app has them built in). */
function VoiceDownload() {
  const kids = useDB(useShallow((s) => s.children.filter((c) => c.ownerId === s.session.userId)));
  const [progress, setProgress] = useState(null);
  const stats = voiceStats();
  if (!stats.akos && !stats.kwame) return null;
  const genders = [...new Set(kids.map((k) => k.instructor || 'female'))];
  const run = async () => {
    for (const g of genders) await downloadVoices(g, (d, t) => setProgress(`${INSTRUCTORS[g].name}: ${d}/${t}`));
    setProgress('done');
    toast.success('Teacher voices saved', 'They now work without internet');
  };
  return (
    <div className="space-y-2 rounded-2xl bg-slate-50 p-3">
      <div className="text-sm font-semibold">Recorded teacher voices</div>
      <p className="text-xs text-slate-500">
        Auntie Akos: {stats.akos} lines · Uncle Kwame: {stats.kwame} lines recorded. Lines not recorded yet use the device voice.
      </p>
      <button type="button" onClick={run} disabled={progress && progress !== 'done'} className="btn-soft text-sm">
        {progress && progress !== 'done' ? `Saving ${progress}…` : progress === 'done' ? 'Saved for offline ✓' : 'Download voices for offline'}
      </button>
    </div>
  );
}
