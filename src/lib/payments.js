// Simulated checkout. Phase 2 replaces `charge` with Paystack / Hubtel; everything else stays.
import { useDB } from '../data/store';
import { PERIODS } from '../data/seed';
import { addDays, nowISO } from './format';
import { activeSub } from './access';

export const METHODS = [
  { id: 'mtn', label: 'MTN MoMo', short: 'MTN', color: 'bg-yellow-400 text-slate-900', kind: 'momo' },
  { id: 'telecel', label: 'Telecel Cash', short: 'Telecel', color: 'bg-red-600 text-white', kind: 'momo' },
  { id: 'airteltigo', label: 'AirtelTigo Money', short: 'AT', color: 'bg-blue-700 text-white', kind: 'momo' },
  { id: 'card', label: 'Visa / Mastercard', short: 'Card', color: 'bg-slate-900 text-white', kind: 'card' },
];
export const methodLabel = (id) => METHODS.find((m) => m.id === id)?.label || id;
export const periodOf = (id) => PERIODS.find((p) => p.id === id) || PERIODS[1];

export function quote(plan, period, seats = 1) {
  const price = plan.prices[period] || 0;
  return Math.round(price * (plan.perSeat ? Math.max(1, seats) : 1) * 100) / 100;
}

/** Yearly saving vs paying weekly for 52 weeks, as a whole percentage. */
export const yearlySaving = (plan) => Math.max(0, Math.round((1 - plan.prices.yearly / (plan.prices.weekly * 52)) * 100));

/**
 * Pretends to send a payment prompt and waits for approval.
 * Demo rule: a phone number ending in 000 or a card ending in 0002 is declined.
 */
export function charge({ method, account }) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const digits = String(account).replace(/\D/g, '');
      const declined = method === 'card' ? digits.endsWith('0002') : digits.endsWith('000');
      resolve(declined ? { ok: false, error: method === 'card' ? 'Card declined by your bank' : 'The MoMo prompt was declined or timed out' } : { ok: true });
    }, 2200);
  });
}

export const newRef = () => `BRL${Math.floor(100000 + Math.random() * 900000)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
const maskAccount = (method, account) => (method === 'card' ? `**** ${String(account).replace(/\D/g, '').slice(-4)}` : account);

/** Records the payment and, if it succeeded, starts (or extends) the subscription. */
export function completePurchase({ userId, planId, period, seats, method, account, amount, ok }) {
  const db = useDB.getState();
  const payment = db.add('payments', { ref: newRef(), userId, plan: planId, period, seats, amount, method, account: maskAccount(method, account), status: ok ? 'success' : 'failed', at: nowISO() });
  if (!ok) return { payment };
  const current = activeSub(userId);
  // Same plan renewing early: add the time on top. Switching plan: the new one starts now.
  const start = current && current.plan === planId ? current.expiresAt : nowISO();
  if (current) db.update('subscriptions', current.id, { status: current.plan === planId ? 'renewed' : 'replaced' });
  const sub = db.add('subscriptions', { userId, plan: planId, period, seats, amount, status: 'active', autoRenew: true, startedAt: nowISO(), expiresAt: addDays(start, periodOf(period).days), paymentId: payment.id });
  db.update('users', userId, { plan: planId });
  return { payment, sub };
}
