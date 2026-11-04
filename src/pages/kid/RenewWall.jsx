// Full-screen lock shown on every kid screen once the family's or school's plan has ended.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Brill } from '../../components/brand';
import { GrownUpGate } from '../../components/common';
import { useDB } from '../../data/store';
import { latestSub } from '../../lib/access';
import { fmtDate } from '../../lib/format';

export default function RenewWall({ child, isStudent }) {
  const nav = useNavigate();
  const owner = useDB((s) => s.users.find((u) => u.id === child.ownerId));
  const subs = useDB((s) => s.subscriptions);
  const plans = useDB((s) => s.settings.plans);
  const logout = useDB((s) => s.logout);
  const [gate, setGate] = useState(false);
  const last = latestSub(child.ownerId, subs);
  const plan = plans[last?.plan];
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-ink/60 p-4 backdrop-blur">
      <div className="card w-full max-w-md p-8 text-center animate-scale-in">
        <Brill size={90} mood="sad" className="mx-auto" />
        <h2 className="mt-3 text-3xl font-semibold">Brilla is taking a nap 😴</h2>
        <p className="mt-2 text-lg text-slate-600">
          {isStudent ? 'Your school’s Brilla plan has ended. Please tell your teacher!' : `Hi ${child.name}! The Brilla plan has ended. Ask a grown-up to renew it so we can keep learning.`}
        </p>
        {last && (
          <p className="mt-3 rounded-2xl bg-slate-50 p-3 text-sm text-slate-500">
            {plan?.name || 'Plan'} ended on {fmtDate(last.expiresAt)}. All lessons are locked until the next payment.
          </p>
        )}
        <div className="mt-5 flex flex-col gap-2">
          {!isStudent && (
            <button onClick={() => setGate(true)} className="btn-accent py-3.5 text-lg">
              Grown-up: renew now
            </button>
          )}
          <button onClick={() => (isStudent ? (logout(), nav('/class')) : nav('/home'))} className="btn-ghost">
            {isStudent ? 'Log out' : 'Back'}
          </button>
        </div>
      </div>
      <GrownUpGate open={gate} onClose={() => setGate(false)} pin={owner?.pin} onPass={() => nav(`/checkout/${last?.plan || 'family'}?period=${last?.period || 'monthly'}`)} />
    </div>
  );
}
