import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PeriodSwitch, PlanCards, PublicHeader } from '../../components/common';
import { useDB } from '../../data/store';
import { useTheme, useUser } from '../../lib/hooks';
import { activeSub } from '../../lib/access';

const FAQ = [
  ['What is free?', 'The first lessons in every subject at every class level are free forever. Paid plans unlock everything.'],
  ['How do I pay?', 'MTN MoMo, Telecel Cash, AirtelTigo Money, or a Visa/Mastercard card. You approve the payment on your phone.'],
  ['Does it work without internet?', 'Yes. Install Brilla and lessons work offline. Your plan stays active offline until its end date.'],
  ['Can I switch plans?', 'Yes. Renewing the same plan adds time to it. Choosing a new plan starts it straight away.'],
];

export default function Pricing() {
  useTheme();
  const nav = useNavigate();
  const user = useUser();
  const plans = useDB((s) => s.settings.plans);
  const [period, setPeriod] = useState('monthly');
  const current = user ? activeSub(user.id)?.plan : null;
  const pick = (planId) => (user ? nav(`/checkout/${planId}?period=${period}`) : nav(`/signup?plan=${planId}`));

  return (
    <div>
      <PublicHeader />
      <div className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-8 text-center">
          <h1 className="on-bg text-4xl font-bold sm:text-5xl">Simple prices for every family</h1>
          <p className="on-bg-muted mx-auto mt-3 max-w-xl text-lg">Start with free lessons. Unlock everything when you’re ready.</p>
          <div className="mt-6">
            <PeriodSwitch value={period} onChange={setPeriod} plans={plans} />
          </div>
        </div>
        <PlanCards period={period} onPick={pick} current={current} />
        <div className="mt-10 grid gap-4 md:grid-cols-2">
          {FAQ.map(([q, a]) => (
            <div key={q} className="card p-5">
              <h3 className="font-semibold">{q}</h3>
              <p className="text-slate-500">{a}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
