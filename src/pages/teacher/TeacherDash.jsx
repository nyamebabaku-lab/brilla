import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { BarChart3, ClipboardList, Copy, CreditCard, Pencil, Play, Plus, School, Trash2 } from 'lucide-react';
import DashShell from '../../components/DashShell';
import ChildForm from '../../components/ChildForm';
import { Empty, Field, Modal, Stat, toast } from '../../components/ui';
import { useDB } from '../../data/store';
import { useUser } from '../../lib/hooks';
import { DEFAULT_THEME } from '../../lib/theme';
import { activeSub } from '../../lib/access';
import { periodOf } from '../../lib/payments';
import { LEVELS, levelName } from '../../curriculum/levels';
import { catalogFor } from '../../curriculum';
import { lessonsDone, totalStars } from '../../lib/progress';
import { cls, fmtDate, money } from '../../lib/format';

const newCode = () => Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 32)]).join('');

export default function TeacherDash() {
  const user = useUser();
  const [params] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'classes');
  const tabs = [
    { id: 'classes', label: 'Classes', icon: <School size={16} /> },
    { id: 'assign', label: 'Homework', icon: <ClipboardList size={16} /> },
    { id: 'progress', label: 'Progress', icon: <BarChart3 size={16} /> },
    { id: 'plan', label: 'School plan', icon: <CreditCard size={16} /> },
  ];
  return (
    <DashShell title={`${user.name} 🧑‍🏫`} subtitle={user.schoolName} tabs={tabs} tab={tab} setTab={setTab}>
      {tab === 'classes' && <ClassesTab user={user} autoNew={!!params.get('new')} />}
      {tab === 'assign' && <AssignTab user={user} />}
      {tab === 'progress' && <ClassProgress user={user} />}
      {tab === 'plan' && <PlanTab user={user} />}
    </DashShell>
  );
}

function useMyClasses(user) {
  const classes = useDB((s) => s.classes);
  return useMemo(() => classes.filter((c) => c.teacherId === user.id), [classes, user.id]);
}

function ClassesTab({ user, autoNew }) {
  const classes = useMyClasses(user);
  const children = useDB((s) => s.children);
  const progress = useDB((s) => s.progress);
  const add = useDB((s) => s.add);
  const update = useDB((s) => s.update);
  const remove = useDB((s) => s.remove);
  const [classForm, setClassForm] = useState(autoNew ? { name: '', levelId: 'p1' } : null);
  const [pupilForm, setPupilForm] = useState(null);

  const saveClass = (e) => {
    e.preventDefault();
    if (classForm.id) update('classes', classForm.id, { name: classForm.name, levelId: classForm.levelId });
    else add('classes', { teacherId: user.id, name: classForm.name, levelId: classForm.levelId, code: newCode() });
    toast.success('Class saved');
    setClassForm(null);
  };
  const savePupil = (data) => {
    const cl = classes.find((c) => c.id === pupilForm.classId);
    if (pupilForm.child) update('children', pupilForm.child.id, data);
    else add('children', { ...data, ownerId: user.id, classId: cl.id, levelId: cl.levelId, theme: DEFAULT_THEME, screenLimit: 0 });
    toast.success(`${data.name} saved`);
    setPupilForm(null);
  };

  return (
    <div className="space-y-5">
      {classes.length === 0 && <Empty emoji="🏫" title="Create your first class" body="Pupils log in with the class code and a secret picture: no emails or passwords needed." />}
      {classes.map((cl) => {
        const pupils = children.filter((c) => c.classId === cl.id);
        return (
          <section key={cl.id} className="panel p-5">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold">{cl.name}</h2>
                <p className="text-slate-500">
                  {levelName(cl.levelId)} · {pupils.length} pupils
                </p>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(cl.code);
                  toast.success('Class code copied', cl.code);
                }}
                className="flex items-center gap-2 rounded-2xl bg-brand-50 px-4 py-2 font-mono text-2xl font-bold tracking-widest text-brand-700"
                title="Copy class code"
              >
                {cl.code} <Copy size={16} />
              </button>
              <button onClick={() => setClassForm(cl)} className="btn-soft px-3" aria-label="Edit class">
                <Pencil size={16} />
              </button>
              <button
                onClick={() => {
                  if (pupils.length) return toast.error('Remove the pupils first');
                  remove('classes', cl.id);
                }}
                className="btn-danger px-3"
                aria-label="Delete class"
              >
                <Trash2 size={16} />
              </button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {pupils.map((p) => (
                <div key={p.id} className="rounded-2xl border-2 border-slate-100 p-3 text-center">
                  <div className="text-4xl">{p.avatar}</div>
                  <div className="font-semibold">{p.name}</div>
                  <div className="text-xs text-slate-500">
                    🔑 {p.picture} · ⭐ {totalStars(progress[p.id])}
                  </div>
                  <div className="mt-2 flex justify-center gap-1">
                    <Link to={`/kid/${p.id}`} className="btn-soft px-2 py-1 text-xs" title="Open as pupil">
                      <Play size={14} />
                    </Link>
                    <button onClick={() => setPupilForm({ classId: cl.id, child: p })} className="btn-ghost px-2 py-1 text-xs" aria-label="Edit pupil">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => remove('children', p.id)} className="btn-ghost px-2 py-1 text-xs text-rose-600" aria-label="Remove pupil">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
              <button onClick={() => setPupilForm({ classId: cl.id })} className="flex min-h-[8rem] flex-col items-center justify-center gap-1 rounded-2xl border-4 border-dashed border-brand-200 font-semibold text-brand-700">
                <Plus /> Add pupil
              </button>
            </div>
          </section>
        );
      })}
      <button onClick={() => setClassForm({ name: '', levelId: 'p1' })} className="btn-primary">
        <Plus size={18} /> New class
      </button>
      <Modal open={!!classForm} onClose={() => setClassForm(null)} title={classForm?.id ? 'Edit class' : 'New class'}>
        {classForm && (
          <form onSubmit={saveClass} className="space-y-4">
            <Field label="Class name">
              <input className="input" value={classForm.name} onChange={(e) => setClassForm({ ...classForm, name: e.target.value })} placeholder="e.g. P2 Gold" required autoFocus />
            </Field>
            <Field label="Level">
              <select className="input" value={classForm.levelId} onChange={(e) => setClassForm({ ...classForm, levelId: e.target.value })}>
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name}
                  </option>
                ))}
              </select>
            </Field>
            <button className="btn-primary w-full">Save class</button>
          </form>
        )}
      </Modal>
      {pupilForm && <ChildForm open pupil lockLevel onClose={() => setPupilForm(null)} onSave={savePupil} initial={pupilForm.child || null} />}
    </div>
  );
}

function AssignTab({ user }) {
  const classes = useMyClasses(user);
  const settings = useDB((s) => s.settings);
  const assignments = useDB((s) => s.assignments);
  const children = useDB((s) => s.children);
  const progress = useDB((s) => s.progress);
  const add = useDB((s) => s.add);
  const remove = useDB((s) => s.remove);
  const [f, setF] = useState({ classId: classes[0]?.id || '', subjectId: '', lessonId: '', due: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10) });
  const cl = classes.find((c) => c.id === f.classId);
  const catalog = useMemo(() => (cl ? catalogFor(cl.levelId, { settings }) : []), [cl, settings]);
  const subjectLessons = catalog.find((g) => g.subject.id === f.subjectId)?.lessons || [];
  const mine = assignments.filter((a) => classes.some((c) => c.id === a.classId)).sort((a, b) => a.due.localeCompare(b.due));

  const submit = (e) => {
    e.preventDefault();
    const lesson = subjectLessons.find((l) => l.id === f.lessonId);
    if (!lesson) return toast.error('Choose a lesson');
    add('assignments', { classId: f.classId, lessonId: lesson.id, title: lesson.title, due: f.due });
    toast.success('Homework set', `${lesson.title} for ${cl.name}`);
  };

  if (!classes.length) return <Empty emoji="📝" title="Create a class first" />;
  return (
    <div className="grid gap-5 lg:grid-cols-[22rem_1fr]">
      <form onSubmit={submit} className="panel h-fit space-y-4 p-5">
        <h3 className="font-semibold">Set homework</h3>
        <Field label="Class">
          <select className="input" value={f.classId} onChange={(e) => setF({ ...f, classId: e.target.value, subjectId: '', lessonId: '' })}>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Subject">
          <select className="input" value={f.subjectId} onChange={(e) => setF({ ...f, subjectId: e.target.value, lessonId: '' })}>
            <option value="">Choose…</option>
            {catalog.map((g) => (
              <option key={g.subject.id} value={g.subject.id}>
                {g.subject.emoji} {g.subject.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Lesson">
          <select className="input" value={f.lessonId} onChange={(e) => setF({ ...f, lessonId: e.target.value })} disabled={!f.subjectId}>
            <option value="">Choose…</option>
            {subjectLessons.map((l) => (
              <option key={l.id} value={l.id}>
                {l.order + 1}. {l.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Due date">
          <input className="input" type="date" value={f.due} onChange={(e) => setF({ ...f, due: e.target.value })} />
        </Field>
        <button className="btn-primary w-full">Assign</button>
      </form>
      <div className="space-y-3">
        {mine.length === 0 && <Empty emoji="📭" title="No homework set yet" />}
        {mine.map((a) => {
          const c = classes.find((x) => x.id === a.classId);
          const pupils = children.filter((p) => p.classId === a.classId);
          const done = pupils.filter((p) => progress[p.id]?.[a.lessonId]);
          return (
            <div key={a.id} className="panel flex flex-wrap items-center gap-4 p-4">
              <div className="min-w-0 flex-1">
                <div className="font-semibold">{a.title}</div>
                <div className="text-sm text-slate-500">
                  {c?.name} · due {fmtDate(a.due)}
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {pupils.map((p) => (
                    <span key={p.id} title={p.name} className={cls('chip', progress[p.id]?.[a.lessonId] ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')}>
                      {p.avatar} {p.name}
                    </span>
                  ))}
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {done.length}/{pupils.length}
                </div>
                <div className="text-xs text-slate-500">done</div>
              </div>
              <button onClick={() => remove('assignments', a.id)} className="btn-ghost px-2 text-rose-600" aria-label="Delete">
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function ClassProgress({ user }) {
  const classes = useMyClasses(user);
  const children = useDB((s) => s.children);
  const progress = useDB((s) => s.progress);
  const usage = useDB((s) => s.usage);
  const [sel, setSel] = useState(classes[0]?.id);
  const cl = classes.find((c) => c.id === sel) || classes[0];
  if (!cl) return <Empty emoji="📊" title="No classes yet" />;
  const pupils = children.filter((c) => c.classId === cl.id);
  const totalLessons = pupils.reduce((a, p) => a + lessonsDone(progress[p.id]), 0);
  const active = pupils.filter((p) => Object.keys(usage[p.id] || {}).some((d) => Date.now() - new Date(d) < 7 * 86400000)).length;
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap gap-2">
        {classes.map((c) => (
          <button key={c.id} onClick={() => setSel(c.id)} className={cls('rounded-xl px-4 py-2 font-semibold', c.id === cl.id ? 'bg-brand-600 text-white' : 'bg-white')}>
            {c.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat emoji="🧒" label="Pupils" value={pupils.length} />
        <Stat emoji="✅" label="Lessons done" value={totalLessons} tone="green" />
        <Stat emoji="⭐" label="Average stars" value={pupils.length ? Math.round(pupils.reduce((a, p) => a + totalStars(progress[p.id]), 0) / pupils.length) : 0} tone="accent" />
        <Stat emoji="📅" label="Active this week" value={`${active}/${pupils.length}`} tone="sky" />
      </div>
      <div className="panel overflow-x-auto p-5">
        <table className="w-full min-w-[30rem] text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="py-2">Pupil</th>
              <th>Lessons</th>
              <th>Stars</th>
              <th>Avg stars</th>
              <th>Last active</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {pupils
              .map((p) => ({ p, n: lessonsDone(progress[p.id]), s: totalStars(progress[p.id]), last: Object.values(progress[p.id] || {}).map((x) => x.lastAt).sort().at(-1) }))
              .sort((a, b) => b.s - a.s)
              .map(({ p, n, s, last }) => (
                <tr key={p.id}>
                  <td className="py-2 font-medium">
                    {p.avatar} {p.name}
                  </td>
                  <td>{n}</td>
                  <td>⭐ {s}</td>
                  <td>{n ? (s / n).toFixed(1) : '—'}</td>
                  <td className="text-slate-500">{fmtDate(last)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PlanTab({ user }) {
  const nav = useNavigate();
  const settings = useDB((s) => s.settings);
  const pupils = useDB((s) => s.children.filter((c) => c.ownerId === user.id).length);
  const sub = activeSub(user.id);
  const plan = settings.plans.school;
  return (
    <div className="space-y-5">
      <div className="panel flex flex-wrap items-center gap-4 p-5">
        <span className="text-5xl">🏫</span>
        <div className="flex-1">
          {sub ? (
            <>
              <div className="text-xl font-semibold">
                School plan · {sub.seats} pupil seats · {periodOf(sub.period).label}
              </div>
              <div className="text-slate-500">
                Active until <b>{fmtDate(sub.expiresAt)}</b>. Using {pupils} of {sub.seats} seats.
              </div>
              {pupils > sub.seats && <div className="mt-1 font-medium text-amber-700">{pupils - sub.seats} pupils are on free lessons. Add seats to unlock them.</div>}
            </>
          ) : (
            <>
              <div className="text-xl font-semibold">No school plan yet</div>
              <div className="text-slate-500">Pupils can use the free lessons. Buy seats to unlock everything.</div>
            </>
          )}
        </div>
        <button onClick={() => nav('/checkout/school')} className="btn-accent">
          {sub ? 'Renew or add seats' : 'Buy seats'}
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {['weekly', 'monthly', 'yearly'].map((p) => (
          <div key={p} className="panel p-5 text-center">
            <div className="text-slate-500">{periodOf(p).label}</div>
            <div className="text-3xl font-bold">{money(plan.prices[p], settings.currency)}</div>
            <div className="text-sm text-slate-500">per pupil</div>
          </div>
        ))}
      </div>
    </div>
  );
}
