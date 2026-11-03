import { useState } from 'react';
import { Field, Modal } from './ui';
import { AVATARS, SECRET_PICTURES } from '../data/seed';
import { LEVELS, levelForAge } from '../curriculum/levels';
import { TRACKS } from '../curriculum/tracks';
import { cls } from '../lib/format';

/** Add/edit a child (parents) or pupil (teachers, with secret picture). */
export default function ChildForm({ open, onClose, onSave, initial, pupil, lockLevel }) {
  const [f, setF] = useState(() => initial || { name: '', age: 5, levelId: 'kg2', track: 'ges', avatar: AVATARS[0], screenLimit: 0, picture: SECRET_PICTURES[0] });
  const set = (patch) => setF((x) => ({ ...x, ...patch }));
  const submit = (e) => {
    e.preventDefault();
    if (!f.name.trim()) return;
    onSave({ ...f, name: f.name.trim(), age: Number(f.age) || '' });
  };
  return (
    <Modal open={open} onClose={onClose} title={initial ? `Edit ${initial.name}` : pupil ? 'Add a pupil' : 'Add a child'} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="First name">
            <input className="input" value={f.name} onChange={(e) => set({ name: e.target.value })} required autoFocus />
          </Field>
          {!pupil && (
            <Field label="Age">
              <input className="input" type="number" min={2} max={13} value={f.age} onChange={(e) => set({ age: e.target.value, ...(initial ? {} : { levelId: levelForAge(e.target.value) }) })} />
            </Field>
          )}
          {!lockLevel && (
            <Field label="Class">
              <select className="input" value={f.levelId} onChange={(e) => set({ levelId: e.target.value })}>
                {LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.name} / {l.intl} (age {l.age})
                  </option>
                ))}
              </select>
            </Field>
          )}
          <Field label="Curriculum">
            <select className="input" value={f.track} onChange={(e) => set({ track: e.target.value })}>
              {Object.values(TRACKS).map((t) => (
                <option key={t.id} value={t.id}>
                  {t.flag} {t.name}
                </option>
              ))}
            </select>
          </Field>
          {!pupil && (
            <Field label="Daily screen time limit" hint="Brilla suggests a break when time is up">
              <select className="input" value={f.screenLimit} onChange={(e) => set({ screenLimit: Number(e.target.value) })}>
                {[0, 15, 30, 45, 60, 90, 120].map((m) => (
                  <option key={m} value={m}>
                    {m ? `${m} minutes` : 'No limit'}
                  </option>
                ))}
              </select>
            </Field>
          )}
        </div>
        <div>
          <span className="label">Buddy picture</span>
          <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
            {AVATARS.map((a) => (
              <button type="button" key={a} onClick={() => set({ avatar: a })} className={cls('grid aspect-square place-items-center rounded-2xl text-3xl', f.avatar === a ? 'bg-brand-100 ring-4 ring-brand-400' : 'bg-slate-50')}>
                {a}
              </button>
            ))}
          </div>
        </div>
        {pupil && (
          <div>
            <span className="label">Secret picture (their password)</span>
            <div className="flex flex-wrap gap-2">
              {SECRET_PICTURES.map((p) => (
                <button type="button" key={p} onClick={() => set({ picture: p })} className={cls('grid h-12 w-12 place-items-center rounded-2xl text-3xl', f.picture === p ? 'bg-accent-100 ring-4 ring-accent-400' : 'bg-slate-50')}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-ghost">
            Cancel
          </button>
          <button className="btn-primary px-6">Save</button>
        </div>
      </form>
    </Modal>
  );
}
