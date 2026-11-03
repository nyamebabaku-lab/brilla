import { cls } from '../lib/format';

/** Tiny bar chart (no chart library needed). data: [{ label, value }] */
export function Bars({ data, unit = '', color = 'bg-brand-500', height = 140 }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => (
        <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
          <span className="text-xs font-semibold text-slate-500">{d.value ? `${d.value}${unit}` : ''}</span>
          <div className={cls('w-full max-w-[2.5rem] rounded-t-xl transition-all duration-700', color)} style={{ height: `${Math.max(3, (d.value / max) * (height - 40))}px`, opacity: d.value ? 1 : 0.25 }} />
          <span className="text-xs text-slate-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export function SubjectBars({ rows }) {
  return (
    <div className="space-y-3">
      {rows.map(({ subject, done, total }) => (
        <div key={subject.id}>
          <div className="mb-1 flex justify-between text-sm">
            <span className="font-medium">
              {subject.emoji} {subject.name}
            </span>
            <span className="text-slate-500">
              {done}/{total}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full" style={{ width: `${total ? (done / total) * 100 : 0}%`, background: subject.color }} />
          </div>
        </div>
      ))}
    </div>
  );
}
