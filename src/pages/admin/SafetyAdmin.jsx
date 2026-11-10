// Admin → Backup & safety: one-file backup/restore, recycle bin, PIN lock, recorder logins and storage use.
import { useEffect, useRef, useState } from 'react';
import { Download, KeyRound, RotateCcw, ShieldCheck, Trash2, Upload, UserPlus } from 'lucide-react';
import { Field, Modal, confirmDialog, toast } from '../../components/ui';
import { useDB } from '../../data/store';
import { useShallow } from 'zustand/react/shallow';
import { saveFile } from '../../lib/files';
import { daysLeftInBin, deleteForever, makeBackup, purgeOldTrash, restoreBackup, restoreFromTrash, storageUse } from '../../lib/safety';
import { IS_ADMIN_APP } from '../../lib/platform';
import { cls, fmtDateTime } from '../../lib/format';
import { listStaff, removeStaff, setStaff } from '../../lib/publish';

const VOICE_CHOICES = [
  ['akos', 'Auntie Akos'],
  ['kwame', 'Uncle Kwame'],
  ['twi', 'Twi words'],
  ['ga', 'Ga words'],
];
const KIND = { clip: '🎙️ Recording', word: '🔤 Word', topic: '📚 Topic', lesson: '📝 Lesson', theme: '🎨 Theme' };

export default function SafetyAdmin() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <BackupCard />
      <StorageCard />
      <RecycleBin />
      <div className="space-y-4">
        <PinCard />
        {IS_ADMIN_APP ? <ServerTeamCard /> : <TeamCard />}
      </div>
    </div>
  );
}

function BackupCard() {
  const admin = useDB((s) => s.admin);
  const [busy, setBusy] = useState('');
  const fileRef = useRef(null);
  const backup = async () => {
    setBusy('Making backup…');
    try {
      const { blob, count } = await makeBackup();
      const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-');
      await saveFile(`brilla-backup-${stamp}.json`, blob);
      toast.success('Backup made', `${count} recordings plus all words, lessons, prices and logins`);
    } catch {
      toast.error('Backup failed', 'Free up some space on the phone and try again');
    }
    setBusy('');
  };
  const restore = async (file) => {
    if (!(await confirmDialog({ title: 'Restore this backup?', body: 'Recordings in the backup are added back (current ones are kept as earlier versions). Words, lessons and prices are replaced by the backup’s.', confirmLabel: 'Restore', danger: false }))) return;
    setBusy('Restoring…');
    try {
      const n = await restoreBackup(file);
      toast.success('Backup restored', `${n} recordings`);
    } catch {
      toast.error('That file is not a Brilla backup');
    }
    setBusy('');
  };
  return (
    <div className="panel space-y-3 p-5">
      <h3 className="flex items-center gap-2 font-semibold">
        <ShieldCheck size={18} /> Backup
      </h3>
      <p className="text-sm text-slate-500">
        One file with every recording, Twi/Ga word, lesson, price and team login on this {IS_ADMIN_APP ? 'phone' : 'browser'}. Save it to Google Drive or send it to yourself on WhatsApp. If the {IS_ADMIN_APP ? 'app is uninstalled or the phone is lost' : 'browser data is cleared'}, restore it here.
      </p>
      <p className="text-sm">
        Last backup: <b>{admin?.lastBackupAt ? fmtDateTime(new Date(admin.lastBackupAt).toISOString()) : 'never'}</b>
        {admin?.changesSinceBackup ? ` · ${admin.changesSinceBackup} changes since` : ''}
      </p>
      <div className="flex flex-wrap gap-2">
        <button onClick={backup} disabled={!!busy} className="btn-primary">
          <Download size={16} /> {busy || 'Back up now'}
        </button>
        <button onClick={() => fileRef.current.click()} disabled={!!busy} className="btn-white">
          <Upload size={16} /> Restore a backup
        </button>
        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files[0] && restore(e.target.files[0])} />
      </div>
    </div>
  );
}

function StorageCard() {
  const [use, setUse] = useState(null);
  useEffect(() => {
    storageUse().then(setUse);
  }, []);
  const pct = use?.quotaMB ? Math.min(100, (use.usedMB / use.quotaMB) * 100) : 0;
  return (
    <div className="panel space-y-3 p-5">
      <h3 className="font-semibold">Storage on this {IS_ADMIN_APP ? 'phone' : 'browser'}</h3>
      {use ? (
        <>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className={cls('h-full rounded-full', pct > 85 ? 'bg-rose-500' : 'bg-brand-500')} style={{ width: `${Math.max(2, pct)}%` }} />
          </div>
          <p className="text-sm text-slate-600">
            {use.usedMB.toFixed(1)} MB used{use.quotaMB ? ` of ${Math.round(use.quotaMB).toLocaleString()} MB available` : ''}.
          </p>
          <p className="text-xs text-slate-500">
            {use.recordings} recordings · {use.history} earlier versions · {use.bin} recordings in the recycle bin. A full voice is roughly 20–30 MB.
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-500">Checking…</p>
      )}
    </div>
  );
}

function RecycleBin() {
  const trash = useDB((s) => s.trash);
  useEffect(() => {
    purgeOldTrash();
  }, []);
  return (
    <div className="panel space-y-3 p-5">
      <h3 className="flex items-center gap-2 font-semibold">
        <Trash2 size={18} /> Recycle bin
      </h3>
      <p className="text-sm text-slate-500">Deleted recordings, words, topics, lessons and themes stay here for 30 days.</p>
      {trash.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-3 text-sm text-slate-500">Nothing deleted.</p>
      ) : (
        <div className="max-h-96 divide-y overflow-y-auto rounded-2xl border">
          {trash.map((t) => (
            <div key={t.id} className="flex items-center gap-2 p-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{t.label}</div>
                <div className="text-xs text-slate-400">
                  {KIND[t.kind]} · deleted {fmtDateTime(new Date(t.at).toISOString())} · {daysLeftInBin(t)} days left
                </div>
              </div>
              <button onClick={async () => (await restoreFromTrash(t.id), toast.success('Restored'))} className="btn-soft px-3 py-1.5 text-sm">
                <RotateCcw size={14} /> Restore
              </button>
              <button
                onClick={async () => {
                  if (await confirmDialog({ title: 'Delete for good?', body: `${t.label} can't be restored after this.` })) deleteForever(t.id);
                }}
                className="grid h-8 w-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50"
                aria-label="Delete for good"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PinCard() {
  const admin = useDB((s) => s.admin);
  const setAdmin = useDB((s) => s.setAdmin);
  const [pin, setPin] = useState('');
  const save = () => {
    if (!/^\d{4}$/.test(pin)) return toast.error('The PIN must be 4 digits');
    setAdmin({ pin });
    setPin('');
    toast.success('PIN lock on', 'The Admin app asks for it when opened');
  };
  return (
    <div className="panel space-y-3 p-5">
      <h3 className="flex items-center gap-2 font-semibold">
        <KeyRound size={18} /> PIN lock
      </h3>
      <p className="text-sm text-slate-500">Ask for a 4-digit PIN every time the Admin app opens (and after 2 minutes away). Forgot it? Log in with your password instead.</p>
      <div className="flex flex-wrap items-end gap-2">
        <Field label={admin?.pin ? 'Change PIN' : 'Choose a PIN'} className="w-36">
          <input className="input text-center tracking-[0.5em]" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} />
        </Field>
        <button onClick={save} className="btn-primary">
          {admin?.pin ? 'Change' : 'Turn on'}
        </button>
        {admin?.pin && (
          <button onClick={() => (setAdmin({ pin: null }), toast.info('PIN lock off'))} className="btn-ghost">
            Turn off
          </button>
        )}
      </div>
    </div>
  );
}

function TeamCard() {
  const team = useDB(useShallow((s) => s.users.filter((u) => u.role === 'recorder')));
  const add = useDB((s) => s.add);
  const update = useDB((s) => s.update);
  const remove = useDB((s) => s.remove);
  const [form, setForm] = useState(null);
  const save = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return toast.error('Add a name and email');
    if (!form.id && form.password.length < 6) return toast.error('Password must be at least 6 characters');
    if (!form.voices.length) return toast.error('Choose at least one voice they record');
    const data = { name: form.name.trim(), email: form.email.trim().toLowerCase(), voices: form.voices, ...(form.password ? { password: form.password } : {}) };
    if (form.id) update('users', form.id, data);
    else add('users', { role: 'recorder', phone: '', ...data });
    toast.success(form.id ? 'Saved' : 'Recorder added', 'They log in to the Admin app with this email and password');
    setForm(null);
  };
  return (
    <div className="panel space-y-3 p-5">
      <h3 className="flex items-center gap-2 font-semibold">
        <UserPlus size={18} /> Recorders
      </h3>
      <p className="text-sm text-slate-500">Logins for the people who record. They only see the Voice studio, for the voices you choose; they can’t change prices, lessons or settings.</p>
      {team.length > 0 && (
        <div className="divide-y rounded-2xl border">
          {team.map((u) => (
            <div key={u.id} className="flex items-center gap-2 p-2.5">
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{u.name}</div>
                <div className="truncate text-xs text-slate-400">
                  {u.email} · {(u.voices || []).map((v) => VOICE_CHOICES.find((x) => x[0] === v)?.[1]).join(', ')}
                </div>
              </div>
              <button onClick={() => setForm({ ...u, password: '' })} className="btn-ghost px-2 text-sm">
                Edit
              </button>
              <button
                onClick={async () => {
                  if (await confirmDialog({ title: `Remove ${u.name}?`, body: 'They will no longer be able to log in. Their recordings stay.' })) remove('users', u.id);
                }}
                className="grid h-8 w-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50"
                aria-label="Remove recorder"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => setForm({ name: '', email: '', password: '', voices: ['akos'] })} className="btn-soft">
        <UserPlus size={16} /> Add a recorder
      </button>
      <Modal open={!!form} onClose={() => setForm(null)} title={form?.id ? 'Edit recorder' : 'Add a recorder'}>
        {form && (
          <form onSubmit={save} className="space-y-3">
            <Field label="Name">
              <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </Field>
            <Field label="Email (their login)">
              <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label={form.id ? 'New password (leave empty to keep)' : 'Password'}>
              <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
            </Field>
            <div>
              <span className="label">Voices they record</span>
              <div className="flex flex-wrap gap-2">
                {VOICE_CHOICES.map(([id, label]) => (
                  <label key={id} className={cls('flex cursor-pointer items-center gap-2 rounded-xl border-2 px-3 py-1.5 text-sm', form.voices.includes(id) ? 'border-brand-500 bg-brand-50' : 'border-slate-200')}>
                    <input type="checkbox" checked={form.voices.includes(id)} onChange={(e) => setForm({ ...form, voices: e.target.checked ? [...form.voices, id] : form.voices.filter((v) => v !== id) })} />
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <button className="btn-primary w-full">{form.id ? 'Save' : 'Add recorder'}</button>
          </form>
        )}
      </Modal>
    </div>
  );
}

/** Admin app: accounts on the server. Recorders sign up in the Admin app; approve them and pick their voices here. */
function ServerTeamCard() {
  const me = useDB((s) => s.session.userId);
  const [staff, setStaffList] = useState(null);
  const [edit, setEdit] = useState({});
  const load = () =>
    listStaff()
      .then(setStaffList)
      .catch(() => setStaffList('offline'));
  useEffect(() => {
    load();
  }, []);
  const act = async (fn, msg) => {
    try {
      await fn();
      toast.success(msg);
      load();
    } catch (e) {
      toast.error('Could not save', String(e?.message || e));
    }
  };
  const voicesOf = (u) => edit[u.user_id] ?? u.voices ?? [];
  const toggle = (u, v) => setEdit((x) => ({ ...x, [u.user_id]: voicesOf(u).includes(v) ? voicesOf(u).filter((y) => y !== v) : [...voicesOf(u), v] }));
  const pending = Array.isArray(staff) ? staff.filter((u) => u.status === 'pending').length : 0;
  return (
    <div className="panel space-y-3 p-5">
      <h3 className="flex items-center gap-2 font-semibold">
        <UserPlus size={18} /> Recorders {pending > 0 && <span className="chip bg-accent-500 text-white">{pending} waiting</span>}
      </h3>
      <p className="text-sm text-slate-500">
        People who record install Brilla Admin and tap <b>Create account</b>. Approve them here and tick the voices they record. They only see the Voice studio, and their recordings go live for families automatically.
      </p>
      {staff === null && <p className="text-sm text-slate-500">Loading…</p>}
      {staff === 'offline' && (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">
          Connect to the internet to manage recorders.{' '}
          <button onClick={load} className="font-semibold underline">
            Try again
          </button>
        </p>
      )}
      {Array.isArray(staff) && (
        <div className="divide-y rounded-2xl border">
          {staff.map((u) => (
            <div key={u.user_id} className="space-y-2 p-3">
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <div className="truncate font-medium">
                    {u.name} {u.user_id === me && <span className="text-xs text-slate-400">(you)</span>}
                  </div>
                  <div className="truncate text-xs text-slate-400">{u.email}</div>
                </div>
                <span className={cls('chip', u.role === 'admin' ? 'bg-brand-100 text-brand-700' : u.status === 'active' ? 'bg-emerald-100 text-emerald-700' : u.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600')}>
                  {u.role === 'admin' ? 'admin' : u.status}
                </span>
              </div>
              {u.role === 'recorder' && (
                <>
                  <div className="flex flex-wrap gap-1.5">
                    {VOICE_CHOICES.map(([id, label]) => (
                      <label key={id} className={cls('flex cursor-pointer items-center gap-1.5 rounded-xl border-2 px-2.5 py-1 text-xs', voicesOf(u).includes(id) ? 'border-brand-500 bg-brand-50' : 'border-slate-200')}>
                        <input type="checkbox" checked={voicesOf(u).includes(id)} onChange={() => toggle(u, id)} />
                        {label}
                      </label>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {u.status !== 'active' ? (
                      <button onClick={() => (voicesOf(u).length ? act(() => setStaff(u.user_id, 'active', voicesOf(u)), `${u.name} approved`) : toast.error('Tick at least one voice first'))} className="btn-primary px-3 py-1.5 text-sm">
                        Approve
                      </button>
                    ) : (
                      <>
                        <button onClick={() => act(() => setStaff(u.user_id, 'active', voicesOf(u)), 'Voices saved')} className="btn-soft px-3 py-1.5 text-sm">
                          Save voices
                        </button>
                        <button onClick={() => act(() => setStaff(u.user_id, 'suspended', voicesOf(u)), `${u.name} suspended`)} className="btn-ghost px-3 py-1.5 text-sm">
                          Suspend
                        </button>
                      </>
                    )}
                    <button
                      onClick={async () => {
                        if (await confirmDialog({ title: `Remove ${u.name}?`, body: 'They lose access to Brilla Admin. Recordings they published stay live.' })) act(() => removeStaff(u.user_id), 'Removed');
                      }}
                      className="btn-ghost px-3 py-1.5 text-sm text-rose-600"
                    >
                      Remove
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
