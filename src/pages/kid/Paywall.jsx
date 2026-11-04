import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/ui';
import { Brill } from '../../components/brand';
import { GrownUpGate } from '../../components/common';
import { useDB } from '../../data/store';

/** Shown when a child taps a locked lesson. Grown-ups pass the gate to reach pricing. */
export default function Paywall({ open, onClose, child, isStudent }) {
  const nav = useNavigate();
  const owner = useDB((s) => s.users.find((u) => u.id === child?.ownerId));
  const freeLessons = useDB((s) => s.settings.freeLessons);
  const [gate, setGate] = useState(false);
  return (
    <>
      <Modal open={open && !gate} onClose={onClose} title="">
        <div className="-mt-6 text-center">
          <Brill size={84} mood="wow" className="mx-auto animate-bob" />
          <h2 className="mt-2 text-3xl font-semibold">Unlock Brilla! 🔓</h2>
          <p className="mt-2 text-lg text-slate-600">
            You’ve tried {freeLessons} free lessons in every subject. {isStudent ? 'Ask your teacher to unlock the rest!' : 'Ask a grown-up to open a new unit of 50 lessons every week!'}
          </p>
          <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
            {['🎨 All colouring', '🔢 All maths', '📖 All reading', '✍️ All tracing', '🔬 All science', '🏆 New stickers'].map((t) => (
              <div key={t} className="rounded-2xl bg-brand-50 p-2 font-medium text-brand-800">
                {t}
              </div>
            ))}
          </div>
          {!isStudent && (
            <button onClick={() => setGate(true)} className="btn-accent mt-6 w-full py-3.5 text-lg">
              I’m a grown-up
            </button>
          )}
          <button onClick={onClose} className="btn-ghost mt-2 w-full">
            Maybe later
          </button>
        </div>
      </Modal>
      <GrownUpGate
        open={gate}
        onClose={() => setGate(false)}
        pin={owner?.pin}
        onPass={() => {
          setGate(false);
          onClose();
          nav(owner?.role === 'teacher' ? '/checkout/school' : '/checkout/family?period=weekly');
        }}
      />
    </>
  );
}
