import { useParams } from 'react-router-dom';
import KidLayout, { useKid } from './KidLayout';
import { useDB } from '../../data/store';
import { AVATARS } from '../../data/seed';
import { BACKGROUNDS, BG_NAMES, SWATCHES, themeFromPreset } from '../../lib/theme';
import { Toggle } from '../../components/ui';
import { cls } from '../../lib/format';
import { sfx } from '../../lib/sfx';
import { say } from '../../lib/speech';

function ColorRow({ label, value, onChange }) {
  return (
    <div>
      <div className="mb-2 font-semibold">{label}</div>
      <div className="flex flex-wrap items-center gap-2">
        {SWATCHES.map((c) => (
          <button key={c} onClick={() => onChange(c)} className={cls('h-11 w-11 rounded-full border-4 shadow-chunky-sm transition', value.toLowerCase() === c ? 'scale-110 border-ink' : 'border-white')} style={{ background: c }} aria-label={c} />
        ))}
        <label className="relative grid h-11 w-11 cursor-pointer place-items-center overflow-hidden rounded-full border-4 border-white shadow-chunky-sm" style={{ background: 'conic-gradient(red,orange,yellow,lime,cyan,blue,magenta,red)' }} title="Any colour">
          <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="absolute inset-0 cursor-pointer opacity-0" />
        </label>
      </div>
    </div>
  );
}

export default function ThemePicker() {
  const { childId } = useParams();
  const { child } = useKid(childId);
  const presets = useDB((s) => s.settings.presets);
  const update = useDB((s) => s.update);
  const prefs = useDB((s) => s.prefs);
  const setPrefs = useDB((s) => s.setPrefs);
  if (!child) return <KidLayout child={null} />;
  const theme = child.theme;
  const setTheme = (patch) => {
    sfx('pop');
    update('children', child.id, { theme: { ...theme, ...patch, preset: patch.preset || 'custom' } });
  };

  return (
    <KidLayout child={child} back={`/kid/${child.id}`} title="My colours">
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="card p-5">
          <h2 className="mb-3 text-2xl font-semibold">Pick a theme</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {presets.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setTheme(themeFromPreset(p));
                  say(p.name);
                }}
                className={cls('overflow-hidden rounded-3xl border-4 text-left shadow-chunky-sm transition', theme.preset === p.id ? 'border-ink' : 'border-white')}
              >
                <div className="flex h-20 items-center justify-center gap-2 text-4xl" style={{ background: BACKGROUNDS[p.bg] }}>
                  {p.emoji}
                  <span className="h-8 w-8 rounded-full border-2 border-white" style={{ background: p.brand }} />
                  <span className="h-8 w-8 rounded-full border-2 border-white" style={{ background: p.accent }} />
                </div>
                <div className="bg-white px-3 py-2 font-semibold">{p.name}</div>
              </button>
            ))}
          </div>
        </section>
        <section className="card space-y-5 p-5">
          <h2 className="text-2xl font-semibold">Mix your own</h2>
          <ColorRow label="Main colour" value={theme.brand} onChange={(c) => setTheme({ brand: c })} />
          <ColorRow label="Button colour" value={theme.accent} onChange={(c) => setTheme({ accent: c })} />
          <div>
            <div className="mb-2 font-semibold">Background</div>
            <div className="grid grid-cols-4 gap-2">
              {Object.keys(BACKGROUNDS).map((b) => (
                <button key={b} onClick={() => setTheme({ bg: b })} className={cls('h-14 rounded-2xl border-4 text-xs font-semibold', theme.bg === b ? 'border-ink' : 'border-white', b === 'space' ? 'text-white' : 'text-slate-700')} style={{ background: BACKGROUNDS[b] }}>
                  {BG_NAMES[b]}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <span className="btn-primary">Main button</span>
            <span className="btn-accent">Play ▶</span>
            <span className="btn-soft">Soft</span>
          </div>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 text-2xl font-semibold">My buddy</h2>
          <div className="grid grid-cols-6 gap-2">
            {AVATARS.map((a) => (
              <button key={a} onClick={() => (update('children', child.id, { avatar: a }), sfx('pop'))} className={cls('grid aspect-square place-items-center rounded-2xl text-4xl transition', child.avatar === a ? 'scale-110 bg-accent-100 ring-4 ring-accent-400' : 'bg-slate-50')}>
                {a}
              </button>
            ))}
          </div>
        </section>
        <section className="card space-y-4 p-5">
          <h2 className="text-2xl font-semibold">Sounds</h2>
          <Toggle checked={prefs.voice} onChange={(v) => setPrefs({ voice: v })} label="🗣️ Read things aloud" />
          <Toggle checked={prefs.sound} onChange={(v) => setPrefs({ sound: v })} label="🔔 Fun sound effects" />
        </section>
      </div>
    </KidLayout>
  );
}
