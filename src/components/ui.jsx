import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cls } from '../lib/format';

export function Modal({ open, onClose, title, children, wide, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);
  if (!open) return null;
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={onClose}>
      <div className={cls('max-h-[92dvh] w-full overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lift animate-scale-in sm:rounded-3xl', wide ? 'sm:max-w-2xl' : 'sm:max-w-md')} onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-xl font-semibold">{title}</h3>
          {onClose && (
            <button className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100" onClick={onClose} aria-label="Close">
              <X size={20} />
            </button>
          )}
        </div>
        {children}
        {footer && <div className="mt-5 flex flex-wrap justify-end gap-2">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

// ---- toasts ----
let pushToast = () => {};
export const toast = {
  success: (title, body) => pushToast({ kind: 'success', title, body }),
  error: (title, body) => pushToast({ kind: 'error', title, body }),
  info: (title, body) => pushToast({ kind: 'info', title, body }),
};
export function Toaster() {
  const [items, setItems] = useState([]);
  useEffect(() => {
    pushToast = (t) => {
      const id = Math.random();
      setItems((x) => [...x, { ...t, id }]);
      setTimeout(() => setItems((x) => x.filter((i) => i.id !== id)), 3800);
    };
  }, []);
  return createPortal(
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[60] flex flex-col items-center gap-2 px-3">
      {items.map((t) => (
        <div key={t.id} className={cls('pointer-events-auto w-full max-w-sm rounded-2xl border-2 bg-white px-4 py-3 shadow-lift animate-fade-in', t.kind === 'error' ? 'border-rose-200' : t.kind === 'success' ? 'border-emerald-200' : 'border-brand-200')}>
          <div className="flex items-start gap-2">
            <span className="text-lg">{t.kind === 'error' ? '⚠️' : t.kind === 'success' ? '✅' : '💡'}</span>
            <div>
              <div className="font-semibold">{t.title}</div>
              {t.body && <div className="text-sm text-slate-500">{t.body}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>,
    document.body,
  );
}

export function Field({ label, hint, children, className }) {
  return (
    <label className={cls('block', className)}>
      {label && <span className="label">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

export function Progress({ value, max = 100, className, color }) {
  const pct = Math.max(0, Math.min(100, (value / (max || 1)) * 100));
  return (
    <div className={cls('h-3 overflow-hidden rounded-full bg-slate-200/70', className)}>
      <div className={cls('h-full rounded-full transition-all duration-700', color || 'bg-brand-500')} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Stars({ n = 0, size = 'text-lg', max = 3 }) {
  return (
    <span className={cls('inline-flex gap-0.5', size)}>
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < n ? '' : 'opacity-25 grayscale'}>
          ⭐
        </span>
      ))}
    </span>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-1 overflow-x-auto px-1 pb-1">
      {tabs.map((t) => (
        <button key={t.id} onClick={() => onChange(t.id)} className={cls('flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition', value === t.id ? 'bg-brand-600 text-white shadow-chunky-sm' : 'bg-white text-slate-600 hover:bg-brand-50')}>
          {t.icon}
          {t.label}
        </button>
      ))}
    </div>
  );
}

export function Stat({ label, value, sub, emoji, tone = 'brand' }) {
  const tones = { brand: 'bg-brand-50 text-brand-700', accent: 'bg-accent-50 text-accent-700', green: 'bg-emerald-50 text-emerald-700', sky: 'bg-sky-50 text-sky-700' };
  return (
    <div className="panel flex items-center gap-3 p-4">
      <div className={cls('grid h-12 w-12 shrink-0 place-items-center rounded-2xl text-2xl', tones[tone])}>{emoji}</div>
      <div className="min-w-0">
        <div className="truncate text-sm text-slate-500">{label}</div>
        <div className="text-2xl font-semibold leading-tight">{value}</div>
        {sub && <div className="truncate text-xs text-slate-400">{sub}</div>}
      </div>
    </div>
  );
}

export function Empty({ emoji = '🌈', title, body, action }) {
  return (
    <div className="panel flex flex-col items-center gap-2 p-8 text-center">
      <div className="text-5xl animate-bob">{emoji}</div>
      <div className="text-lg font-semibold">{title}</div>
      {body && <p className="max-w-sm text-sm text-slate-500">{body}</p>}
      {action}
    </div>
  );
}

export function Toggle({ checked, onChange, label }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-center gap-3 text-left" role="switch" aria-checked={checked}>
      <span className={cls('relative h-7 w-12 shrink-0 rounded-full transition', checked ? 'bg-brand-600' : 'bg-slate-300')}>
        <span className={cls('absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all', checked ? 'left-6' : 'left-1')} />
      </span>
      {label && <span className="font-medium">{label}</span>}
    </button>
  );
}
