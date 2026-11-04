// Warns grown-ups before a plan ends, and tells them clearly when it has ended.
import { Link } from 'react-router-dom';
import { useDB } from '../data/store';
import { activeSub, daysLeft, latestSub, useTick } from '../lib/access';
import { fmtDate } from '../lib/format';

export default function PlanBanner({ user }) {
  useTick();
  const subs = useDB((s) => s.subscriptions);
  const plans = useDB((s) => s.settings.plans);
  const sub = activeSub(user.id, subs);
  const last = latestSub(user.id, subs);
  if (sub) {
    const d = daysLeft(sub);
    if (d > 3) return null;
    return (
      <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-amber-200 bg-amber-50 p-4 text-amber-900">
        <span className="text-2xl">⏰</span>
        <span className="flex-1">
          Your <b>{plans[sub.plan]?.name}</b> plan ends {d === 0 ? 'today' : `in ${d} day${d > 1 ? 's' : ''}`} ({fmtDate(sub.expiresAt)}). Lessons lock automatically at the end date until you pay for the next period.
        </span>
        <Link to={`/checkout/${sub.plan}?period=${sub.period}`} className="btn-accent">
          Renew now
        </Link>
      </div>
    );
  }
  if (!last) return null;
  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 text-rose-900">
      <span className="text-2xl">🔒</span>
      <span className="flex-1">
        Your <b>{plans[last.plan]?.name}</b> plan ended on {fmtDate(last.expiresAt)}. All lessons are locked{user.role === 'teacher' ? ' for your pupils' : ''} until you renew.
      </span>
      <Link to={`/checkout/${last.plan}?period=${last.period}`} className="btn-accent">
        Renew now
      </Link>
    </div>
  );
}
