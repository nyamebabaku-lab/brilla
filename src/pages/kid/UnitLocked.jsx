// Shown when a child taps a lesson in a unit that hasn't opened yet (one unit opens per paid week).
import { Modal } from '../../components/ui';
import { Brill } from '../../components/brand';
import { fmtDate } from '../../lib/format';

export default function UnitLocked({ unit, open, onClose, openUnits, nextUnit }) {
  const weeksAway = unit - openUnits; // 0 = the very next unit
  const soon = weeksAway === 0 && nextUnit;
  return (
    <Modal open={open} onClose={onClose} title="">
      <div className="-mt-6 text-center">
        <Brill size={80} mood="think" className="mx-auto animate-bob" />
        <h2 className="mt-2 text-3xl font-semibold">Unit {unit + 1} is coming! 🎁</h2>
        <p className="mt-2 text-lg text-slate-600">
          {soon
            ? `It opens on ${fmtDate(nextUnit)}. Keep practising Unit ${openUnits} until then!`
            : weeksAway === 0
              ? 'It opens when your grown-up pays for next week.'
              : `A new unit opens every week. This one is ${weeksAway + 1} weeks away.`}
        </p>
        <p className="mt-3 rounded-2xl bg-brand-50 p-3 text-sm text-brand-800">
          {openUnits} of 20 units open · 1 new unit of 50 lessons every week
        </p>
        <button onClick={onClose} className="btn-accent mt-5 w-full py-3">
          OK!
        </button>
      </div>
    </Modal>
  );
}
