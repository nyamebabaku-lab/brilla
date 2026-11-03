import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import KidLayout, { useKid } from './KidLayout';
import { useDB } from '../../data/store';
import { STICKERS } from '../../data/seed';
import { lessonsDone, streak, totalStars } from '../../lib/progress';
import { Modal, Tabs } from '../../components/ui';
import { fmtDate } from '../../lib/format';

const EMPTY = [];

export default function Rewards() {
  const { childId } = useParams();
  const { child } = useKid(childId);
  const stickers = useDB((s) => s.stickers[childId]) || EMPTY;
  const gallery = useDB((s) => s.gallery[childId]) || EMPTY;
  const prog = useDB((s) => s.progress[childId]);
  const usage = useDB((s) => s.usage[childId]);
  const removeDrawing = useDB((s) => s.removeDrawing);
  const [tab, setTab] = useState('stickers');
  const [view, setView] = useState(null);
  if (!child) return <KidLayout child={null} />;

  const counts = stickers.reduce((m, s) => ((m[s] = (m[s] || 0) + 1), m), {});
  return (
    <KidLayout child={child} back={`/kid/${child.id}`} title="My treasures">
      <div className="mb-5 grid grid-cols-3 gap-3">
        {[
          ['⭐', totalStars(prog), 'Stars'],
          ['📚', lessonsDone(prog), 'Lessons'],
          ['🔥', streak(usage), 'Day streak'],
        ].map(([e, v, l]) => (
          <div key={l} className="card flex flex-col items-center p-4">
            <span className="text-4xl">{e}</span>
            <span className="text-3xl font-bold">{v}</span>
            <span className="text-sm text-slate-500">{l}</span>
          </div>
        ))}
      </div>
      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'stickers', label: `Sticker book (${Object.keys(counts).length}/${STICKERS.length})` },
          { id: 'gallery', label: `My art (${gallery.length})` },
        ]}
      />
      {tab === 'stickers' ? (
        <div className="card mt-3 grid grid-cols-4 gap-3 p-4 sm:grid-cols-6 lg:grid-cols-8">
          {STICKERS.map((s) => (
            <div key={s} className={`relative grid aspect-square place-items-center rounded-3xl text-5xl ${counts[s] ? 'bg-amber-50 animate-pop' : 'bg-slate-100'}`}>
              <span className={counts[s] ? '' : 'opacity-20 grayscale'}>{counts[s] ? s : '❔'}</span>
              {counts[s] > 1 && <span className="chip absolute -right-1 -top-1 bg-accent-500 text-white">×{counts[s]}</span>}
            </div>
          ))}
        </div>
      ) : gallery.length === 0 ? (
        <div className="card mt-3 p-10 text-center text-lg text-slate-500">🎨 Finish a drawing, colouring or writing lesson and it will appear here!</div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {gallery.map((g) => (
            <button key={g.id} onClick={() => setView(g)} className="card overflow-hidden p-0 text-left">
              {g.image ? <img src={g.image} alt={g.title} className="aspect-[4/3] w-full bg-white object-cover" /> : <div className="line-clamp-6 aspect-[4/3] bg-white p-3 text-sm">{g.text}</div>}
              <div className="truncate px-3 py-2 text-sm font-semibold">{g.title}</div>
            </button>
          ))}
        </div>
      )}
      <Modal open={!!view} onClose={() => setView(null)} title={view?.title} wide>
        {view?.image ? <img src={view.image} alt={view.title} className="w-full rounded-2xl" /> : <p className="whitespace-pre-wrap text-lg leading-relaxed">{view?.text}</p>}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-sm text-slate-500">{fmtDate(view?.at)}</span>
          <button
            onClick={() => {
              removeDrawing(child.id, view.id);
              setView(null);
            }}
            className="btn-danger"
          >
            <Trash2 size={16} /> Delete
          </button>
        </div>
      </Modal>
    </KidLayout>
  );
}
