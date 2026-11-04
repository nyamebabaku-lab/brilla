// Ends plans automatically: every 30 s (and when the app opens or comes back) any plan past its end date
// is marked expired, online or offline. Nothing renews by itself; families must pay for the next period.
import { useEffect } from 'react';
import { useDB } from '../data/store';
import { trustedNow } from '../lib/access';
import { toast } from './ui';

function sweep() {
  const db = useDB.getState();
  const now = trustedNow();
  const due = db.subscriptions.filter((s) => s.status === 'active' && new Date(s.expiresAt).getTime() <= now);
  if (!due.length) return;
  useDB.setState((s) => ({ subscriptions: s.subscriptions.map((x) => (due.some((d) => d.id === x.id) ? { ...x, status: 'expired', endedAt: new Date(now).toISOString() } : x)) }));
  const me = db.session.userId;
  if (due.some((d) => d.userId === me)) toast.error('Your Brilla plan has ended', 'Renew to keep learning');
}

export default function SubscriptionWatcher() {
  useEffect(() => {
    sweep();
    const t = setInterval(sweep, 30000);
    const onVis = () => document.visibilityState === 'visible' && sweep();
    document.addEventListener('visibilitychange', onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, []);
  return null;
}
