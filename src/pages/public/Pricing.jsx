import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PeriodSwitch, PlanCards, PublicHeader } from '../../components/common';
import { useDB } from '../../data/store';
import { useTheme, useUser } from '../../lib/hooks';
import { activeSub } from '../../lib/access';

const FAQ = [
  ['What is free?', 'The first 10 lessons in every subject at every class level, so your child can try Brilla before you pay.'],
  ['How do units work?', 'Each subject has 20 units of 50 lessons. Unit 1 opens when you pay, then one more unit opens every week your plan is running. Units already opened stay open when you renew.'],
  ['How do I pay?', 'MTN MoMo, Telecel Cash, AirtelTigo Money, or a Visa/Mastercard card. You approve the payment on your phone.'],
  ['Does it work without internet?', 'Yes. Install Brilla and lessons work offline. Your plan stays active offline until its end date.'],
  ['What happens when my plan ends?', 'Nothing is charged automatically. On the end date the app locks (online or offline) until you pay for the next week, month or year. We remind you 3 days before.'],
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
          <h1 className="on-bg text-4xl font-bold sm:text-5xl">One plan. Up to 5 children.</h1>
          <p className="on-bg-muted mx-auto mt-3 max-w-xl text-lg">Start with 10 free lessons in every subject. Then a new unit of 50 lessons opens every week.</p>
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
