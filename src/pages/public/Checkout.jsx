import { useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Lock, Smartphone } from 'lucide-react';
import { PeriodSwitch, PublicHeader } from '../../components/common';
import { Brill, Confetti } from '../../components/brand';
import { Field, toast } from '../../components/ui';
import { useDB } from '../../data/store';
import { useTheme, useUser } from '../../lib/hooks';
import { METHODS, charge, completePurchase, periodOf, quote } from '../../lib/payments';
import { activeSub } from '../../lib/access';
import { UNITS_PER_SUBJECT } from '../../curriculum';
import { cls, fmtDate, money } from '../../lib/format';
import { sfx } from '../../lib/sfx';

export default function Checkout() {
  useTheme();
  const { planId } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const user = useUser();
  const settings = useDB((s) => s.settings);
  const pupils = useDB((s) => s.children.filter((c) => c.ownerId === user?.id).length);
  const plan = settings.plans[planId];
  const [period, setPeriod] = useState(params.get('period') || 'monthly');
  const [seats, setSeats] = useState(Math.max(10, pupils));
  const [method, setMethod] = useState('mtn');
  const [account, setAccount] = useState(user?.phone || '');
  const [card, setCard] = useState({ number: '', exp: '', cvv: '', name: user?.name || '' });
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState('form'); // form | otp | waiting | done | failed
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  if (!plan || (plan.schoolOnly && !settings.schoolsEnabled)) return <div className="p-10 text-center">This plan isn’t available.</div>;
  const isCard = method === 'card';
  const amount = quote(plan, period, seats);
  const current = activeSub(user.id);
  const back = user.role === 'teacher' ? '/teacher' : '/parent';

  const pay = async (e) => {
    e?.preventDefault();
    setError('');
    if (!isCard && !/^0\d{9}$/.test(account.replace(/\s/g, ''))) return setError('Enter a 10-digit mobile money number, e.g. 0241234567');
    if (isCard) {
      if (card.number.replace(/\D/g, '').length < 12) return setError('Enter a valid card number');
      if (!/^\d{2}\/\d{2}$/.test(card.exp)) return setError('Expiry should look like 08/28');
      if (!/^\d{3,4}$/.test(card.cvv)) return setError('Enter the 3-digit CVV');
      if (stage === 'form') return setStage('otp');
      if (otp.length < 4) return setError('Enter the code sent to your phone (any 4–6 digits in the demo)');
    }
    setStage('waiting');
    const acc = isCard ? card.number : account.replace(/\s/g, '');
    const r = await charge({ method, account: acc });
    const out = completePurchase({ userId: user.id, planId, period, seats: plan.perSeat ? seats : 1, method, account: acc, amount, ok: r.ok });
    if (r.ok) {
      setResult(out);
      setStage('done');
      sfx('fanfare');
      toast.success('Payment successful', `${plan.name} plan is active`);
    } else {
      setError(r.error);
      setStage('failed');
      sfx('wrong');
    }
  };

  return (
    <div>
      <PublicHeader />
      <div className="mx-auto grid max-w-5xl gap-6 px-4 pb-16 md:grid-cols-[1fr_22rem]">
        {stage === 'done' ? (
          <div className="card p-8 text-center md:col-span-2">
            <Confetti fire />
            <Brill size={90} mood="wow" className="mx-auto animate-bob" />
            <h1 className="mt-3 text-3xl font-semibold">You’re all set! 🎉</h1>
            <p className="mt-2 text-lg text-slate-600">
              {plan.name} plan active until <b>{fmtDate(result.sub.expiresAt)}</b>.
            </p>
            <div className="mx-auto mt-5 max-w-sm rounded-2xl bg-slate-50 p-4 text-left text-sm">
              <div className="flex justify-between">
                <span>Receipt</span>
                <b>{result.payment.ref}</b>
              </div>
              <div className="flex justify-between">
                <span>Paid with</span>
                <b>{METHODS.find((m) => m.id === method)?.label}</b>
              </div>
              <div className="flex justify-between">
                <span>Amount</span>
                <b>{money(amount, settings.currency)}</b>
              </div>
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <button onClick={() => nav('/home')} className="btn-accent px-6 py-3">
                Start learning
              </button>
              <button onClick={() => nav(back)} className="btn-white px-6 py-3">
                Go to dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
            <form onSubmit={pay} className="card space-y-5 p-6">
              <Link to="/pricing" className="btn-ghost -ml-3 px-3">
                <ArrowLeft size={18} /> All plans
              </Link>
              <h1 className="text-2xl font-semibold">
                {plan.emoji} {plan.name} plan
              </h1>
              <PeriodSwitch value={period} onChange={setPeriod} plans={settings.plans} />
              {plan.perSeat && (
                <Field label="Number of pupils" hint={`You have ${pupils} pupils in your classes now`}>
                  <input className="input max-w-[10rem]" type="number" min={1} max={2000} value={seats} onChange={(e) => setSeats(Math.max(1, Number(e.target.value) || 1))} />
                </Field>
              )}
              <div>
                <span className="label">Pay with</span>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {METHODS.map((m) => (
                    <button type="button" key={m.id} onClick={() => (setMethod(m.id), setStage('form'), setError(''))} className={cls('rounded-2xl border-4 p-2 text-sm font-semibold transition', method === m.id ? 'border-brand-500' : 'border-transparent')}>
                      <span className={cls('mb-1 block rounded-xl py-2 text-base', m.color)}>{m.short}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>
              {!isCard ? (
                <Field label="Mobile money number" hint="Demo: numbers ending in 000 are declined">
                  <input className="input text-lg" inputMode="tel" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="024 123 4567" />
                </Field>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Card number" hint="Demo: cards ending in 0002 are declined" className="sm:col-span-2">
                    <input className="input text-lg tracking-wider" inputMode="numeric" value={card.number} onChange={(e) => setCard((c) => ({ ...c, number: e.target.value.replace(/[^\d ]/g, '').slice(0, 23) }))} placeholder="4242 4242 4242 4242" />
                  </Field>
                  <Field label="Expiry (MM/YY)">
                    <input className="input" value={card.exp} onChange={(e) => setCard((c) => ({ ...c, exp: e.target.value.slice(0, 5) }))} placeholder="08/28" />
                  </Field>
                  <Field label="CVV">
                    <input className="input" inputMode="numeric" value={card.cvv} onChange={(e) => setCard((c) => ({ ...c, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))} placeholder="123" />
                  </Field>
                  {stage === 'otp' && (
                    <Field label="One-time code sent to your phone" className="animate-fade-in sm:col-span-2">
                      <input className="input text-center text-2xl tracking-[0.5em]" inputMode="numeric" value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} autoFocus />
                    </Field>
                  )}
                </div>
              )}
              {error && <p className="rounded-xl bg-rose-50 p-3 font-medium text-rose-700">{error}</p>}
              {stage === 'waiting' ? (
                <div className="flex items-center gap-3 rounded-2xl bg-amber-50 p-4 text-amber-900">
                  <Smartphone className="shrink-0 animate-wiggle" />
                  <div>
                    <b>{isCard ? 'Contacting your bank…' : 'Check your phone'}</b>
                    <div className="text-sm">{isCard ? 'Please wait a moment.' : 'Approve the payment prompt and enter your MoMo PIN.'}</div>
                  </div>
                </div>
              ) : (
                <button className="btn-accent w-full py-3.5 text-lg">
                  <Lock size={18} /> {isCard && stage === 'form' ? 'Continue' : `Pay ${money(amount, settings.currency)}`}
                </button>
              )}
              {stage === 'failed' && <p className="text-center text-sm text-slate-500">Nothing was charged. Check the number and try again.</p>}
            </form>
            <aside className="card h-fit space-y-3 p-6">
              <h2 className="text-lg font-semibold">Summary</h2>
              <div className="flex justify-between">
                <span className="text-slate-500">Plan</span>
                <b>{plan.name}</b>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Billing</span>
                <b>{periodOf(period).label}</b>
              </div>
              {!plan.perSeat && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Covers</span>
                  <b>
                    {periodOf(period).days / 7} week{periodOf(period).days > 7 ? 's' : ''} · +{Math.min(UNITS_PER_SUBJECT, periodOf(period).days / 7)} unit{periodOf(period).days > 7 ? 's' : ''}
                  </b>
                </div>
              )}
              {plan.perSeat && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Pupils</span>
                  <b>
                    {seats} × {money(plan.prices[period], settings.currency)}
                  </b>
                </div>
              )}
              <div className="flex justify-between border-t pt-3 text-xl">
                <span>Total</span>
                <b>{money(amount, settings.currency)}</b>
              </div>
              {current && (
                <p className="rounded-xl bg-brand-50 p-3 text-sm text-brand-800">
                  {current.plan === planId ? `This adds ${periodOf(period).days} days after your current end date (${fmtDate(current.expiresAt)}).` : `Your ${settings.plans[current.plan]?.name} plan will be replaced by ${plan.name} from today.`}
                </p>
              )}
              <p className="text-xs text-slate-400">Demo checkout: no real money is taken. Real MoMo and card payments come with the Paystack connection.</p>
            </aside>
          </>
        )}
      </div>
    </div>
  );
}
