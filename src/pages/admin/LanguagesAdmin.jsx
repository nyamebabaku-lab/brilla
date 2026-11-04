// Admin: Ghanaian language word banks: edit words, record/upload native-speaker audio, import/export packs.
import { useRef, useState } from 'react';
import { ChevronDown, Download, Mic, Play, Plus, Square, Trash2, Upload } from 'lucide-react';
import { Field, Modal, Toggle, toast } from '../../components/ui';
import { useDB } from '../../data/store';
import { LEVELS } from '../../curriculum/levels';
import { DEFAULT_LANGUAGES } from '../../curriculum/languagePacks';
import { blobToDataURL, dataURLToBlob, deleteClip, getClip, putClip } from '../../data/audioStore';
import { playLocal } from '../../lib/localAudio';
import { cls, uid } from '../../lib/format';

function Recorder({ onDone }) {
  const [rec, setRec] = useState(null);
  const start = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        onDone(new Blob(chunks, { type: mr.mimeType || 'audio/webm' }));
      };
      mr.start();
      setRec(mr);
    } catch {
      toast.error('Microphone not available', 'Allow microphone access, or upload an audio file instead');
    }
  };
  const stop = () => {
    rec?.stop();
    setRec(null);
  };
  return rec ? (
    <button onClick={stop} className="grid h-9 w-9 place-items-center rounded-xl bg-rose-600 text-white animate-pulse" title="Stop recording">
      <Square size={14} />
    </button>
  ) : (
    <button onClick={start} className="grid h-9 w-9 place-items-center rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100" title="Record pronunciation">
      <Mic size={16} />
    </button>
  );
}

export default function LanguagesAdmin() {
  const settings = useDB((s) => s.settings);
  const updateSettings = useDB((s) => s.updateSettings);
  const languages = settings.languages || DEFAULT_LANGUAGES;
  const [langId, setLangId] = useState(Object.keys(languages)[0]);
  const [open, setOpen] = useState(null);
  const [newLang, setNewLang] = useState(null);
  const fileRef = useRef(null);
  const pack = languages[langId] || Object.values(languages)[0];

  const savePack = (next) => updateSettings({ languages: { ...languages, [next.id]: next } });
  const setCat = (catId, patch) => savePack({ ...pack, categories: pack.categories.map((c) => (c.id === catId ? { ...c, ...patch } : c)) });
  const setWord = (catId, wordId, patch) => {
    const c = pack.categories.find((x) => x.id === catId);
    setCat(catId, { words: c.words.map((w) => (w.id === wordId ? { ...w, ...patch } : w)) });
  };
  const addWord = (catId) => {
    const c = pack.categories.find((x) => x.id === catId);
    setCat(catId, { words: [...c.words, { id: uid('w').slice(2), w: '', en: '', emoji: '⭐' }] });
  };
  const removeWord = async (catId, wordId) => {
    const c = pack.categories.find((x) => x.id === catId);
    setCat(catId, { words: c.words.filter((w) => w.id !== wordId) });
    await deleteClip(`${pack.id}:${wordId}`).catch(() => {});
  };
  const saveAudio = async (catId, word, blob) => {
    await putClip(`${pack.id}:${word.id}`, blob);
    setWord(catId, word.id, { audio: true });
    toast.success(`Saved audio for “${word.w || 'word'}”`);
  };
  const addCategory = () => {
    const id = uid('c').slice(2);
    savePack({ ...pack, categories: [...pack.categories, { id, title: 'New topic', emoji: '⭐', min: 1, words: [] }] });
    setOpen(id);
  };

  const exportPack = async () => {
    const audio = {};
    for (const c of pack.categories)
      for (const w of c.words)
        if (w.audio) {
          const blob = await getClip(`${pack.id}:${w.id}`).catch(() => null);
          if (blob) audio[w.id] = await blobToDataURL(blob);
        }
    const file = new Blob([JSON.stringify({ brillaLanguagePack: 1, pack, audio }, null, 1)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = `brilla-${pack.id}-pack.json`;
    a.click();
  };
  const importPack = async (file) => {
    try {
      const data = JSON.parse(await file.text());
      if (!data.brillaLanguagePack || !data.pack?.id) throw new Error('not a pack');
      for (const [wordId, url] of Object.entries(data.audio || {})) await putClip(`${data.pack.id}:${wordId}`, await dataURLToBlob(url));
      updateSettings({ languages: { ...languages, [data.pack.id]: data.pack } });
      setLangId(data.pack.id);
      toast.success(`${data.pack.name} pack imported`, `${Object.keys(data.audio || {}).length} recordings`);
    } catch {
      toast.error('That file is not a Brilla language pack');
    }
  };

  const words = pack.categories.reduce((a, c) => a + c.words.length, 0);
  const recorded = pack.categories.reduce((a, c) => a + c.words.filter((w) => w.audio).length, 0);

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center gap-2 p-4">
        {Object.values(languages).map((l) => (
          <button key={l.id} onClick={() => setLangId(l.id)} className={cls('rounded-xl px-4 py-2 font-semibold', l.id === pack.id ? 'bg-brand-600 text-white' : 'bg-slate-100')}>
            {l.flag} {l.name}
          </button>
        ))}
        <button onClick={() => setNewLang({ name: '', flag: '🟢' })} className="btn-soft px-3 text-sm">
          <Plus size={16} /> Add language
        </button>
        <div className="ml-auto flex gap-2">
          <button onClick={() => fileRef.current.click()} className="btn-white text-sm">
            <Upload size={16} /> Import pack
          </button>
          <button onClick={exportPack} className="btn-white text-sm">
            <Download size={16} /> Export pack
          </button>
          <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files[0] && importPack(e.target.files[0])} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_20rem]">
        <div className="space-y-3">
          {pack.draft && (
            <div className="rounded-2xl bg-amber-50 p-4 text-amber-900">
              <b>Draft word list.</b> Please have a native {pack.name} speaker check the spellings and meanings, record each word, then switch off “Draft” on the right.
            </div>
          )}
          {pack.categories.map((c) => (
            <div key={c.id} className="panel">
              <button onClick={() => setOpen(open === c.id ? null : c.id)} className="flex w-full items-center gap-3 p-4 text-left">
                <span className="text-2xl">{c.emoji}</span>
                <span className="flex-1">
                  <span className="block font-semibold">{c.title}</span>
                  <span className="text-xs text-slate-500">
                    {c.words.length} words · from {LEVELS[c.min]?.name} · {c.words.filter((w) => w.audio).length} recorded
                  </span>
                </span>
                <ChevronDown className={cls('transition', open === c.id && 'rotate-180')} />
              </button>
              {open === c.id && (
                <div className="space-y-3 border-t p-4">
                  <div className="grid gap-2 sm:grid-cols-[4rem_1fr_10rem_auto]">
                    <input className="input text-center text-xl" value={c.emoji} onChange={(e) => setCat(c.id, { emoji: e.target.value })} aria-label="Topic emoji" />
                    <input className="input" value={c.title} onChange={(e) => setCat(c.id, { title: e.target.value })} aria-label="Topic title" />
                    <select className="input" value={c.min} onChange={(e) => setCat(c.id, { min: Number(e.target.value) })} aria-label="First class level">
                      {LEVELS.map((l) => (
                        <option key={l.id} value={l.n}>
                          From {l.name}
                        </option>
                      ))}
                    </select>
                    <button onClick={() => savePack({ ...pack, categories: pack.categories.filter((x) => x.id !== c.id) })} className="btn-danger px-3" aria-label="Delete topic">
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="divide-y rounded-2xl border">
                    {c.words.map((w) => (
                      <div key={w.id} className="flex flex-wrap items-center gap-2 p-2">
                        <input className="input w-14 px-1 py-1.5 text-center text-xl" value={w.emoji} onChange={(e) => setWord(c.id, w.id, { emoji: e.target.value })} aria-label="Picture" />
                        <input className="input w-40 flex-1 py-1.5 font-semibold" value={w.w} placeholder={`${pack.name} word`} onChange={(e) => setWord(c.id, w.id, { w: e.target.value })} />
                        <input className="input w-40 flex-1 py-1.5" value={w.en} placeholder="English meaning" onChange={(e) => setWord(c.id, w.id, { en: e.target.value })} />
                        <div className="flex items-center gap-1">
                          <button onClick={() => playLocal(pack.id, w)} className={cls('grid h-9 w-9 place-items-center rounded-xl', w.audio ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500')} title={w.audio ? 'Play recording' : 'Play computer voice (approximate)'}>
                            <Play size={15} />
                          </button>
                          <Recorder onDone={(blob) => saveAudio(c.id, w, blob)} />
                          <label className="grid h-9 w-9 cursor-pointer place-items-center rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200" title="Upload audio file">
                            <Upload size={15} />
                            <input type="file" accept="audio/*" hidden onChange={(e) => e.target.files[0] && saveAudio(c.id, w, e.target.files[0])} />
                          </label>
                          <button onClick={() => removeWord(c.id, w.id)} className="grid h-9 w-9 place-items-center rounded-xl text-rose-600 hover:bg-rose-50" aria-label="Delete word">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => addWord(c.id)} className="btn-soft text-sm">
                    <Plus size={16} /> Add word
                  </button>
                </div>
              )}
            </div>
          ))}
          <button onClick={addCategory} className="btn-primary">
            <Plus size={16} /> Add topic
          </button>
        </div>

        <aside className="space-y-4">
          <div className="panel space-y-3 p-5">
            <h3 className="font-semibold">
              {pack.flag} {pack.name}
            </h3>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="rounded-xl bg-slate-50 p-2">
                <div className="text-2xl font-bold">{words}</div>
                <div className="text-xs text-slate-500">words</div>
              </div>
              <div className="rounded-xl bg-emerald-50 p-2">
                <div className="text-2xl font-bold text-emerald-700">{recorded}</div>
                <div className="text-xs text-slate-500">recorded</div>
              </div>
            </div>
            <Field label="Name shown to children">
              <input className="input" value={pack.name} onChange={(e) => savePack({ ...pack, name: e.target.value })} />
            </Field>
            <Toggle checked={!!pack.draft} onChange={(v) => savePack({ ...pack, draft: v })} label="Draft (needs checking)" />
          </div>
          <div className="panel space-y-3 p-5 text-sm text-slate-600">
            <Toggle checked={settings.ttsFallback !== false} onChange={(v) => updateSettings({ ttsFallback: v })} label="Computer voice when no recording" />
            <p>The computer voice is English, so it only approximates Ghanaian words. Recording a native speaker for every word gives children the right pronunciation.</p>
            <p>
              <b>How to record:</b> tap 🎤, say the word clearly once, then tap ■. Or upload an audio file (mp3, m4a, wav).
            </p>
            <p>
              <b>Share with every family:</b> recordings are saved on this device. Use <b>Export pack</b> and send the file to your developer to publish it for everyone (or import it on another device).
            </p>
          </div>
        </aside>
      </div>

      <Modal open={!!newLang} onClose={() => setNewLang(null)} title="Add a language">
        {newLang && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const id = newLang.name.trim().toLowerCase().replace(/[^a-z]/g, '') || uid('lang');
              if (languages[id]) return toast.error('That language already exists');
              updateSettings({ languages: { ...languages, [id]: { id, name: newLang.name.trim(), native: newLang.name.trim(), flag: newLang.flag, draft: true, categories: [{ id: 'greet', title: 'Greetings', emoji: '👋', min: 1, words: [] }] } } });
              setLangId(id);
              setOpen('greet');
              setNewLang(null);
            }}
            className="space-y-4"
          >
            <p className="text-sm text-slate-500">For example Ewe, Fante, Dagbani, Dagaare, Gonja, Kasem, Nzema or Gurune.</p>
            <div className="grid grid-cols-[5rem_1fr] gap-3">
              <Field label="Badge">
                <input className="input text-center text-2xl" value={newLang.flag} onChange={(e) => setNewLang({ ...newLang, flag: e.target.value })} />
              </Field>
              <Field label="Language name">
                <input className="input" value={newLang.name} onChange={(e) => setNewLang({ ...newLang, name: e.target.value })} required autoFocus />
              </Field>
            </div>
            <button className="btn-primary w-full">Add language</button>
          </form>
        )}
      </Modal>
    </div>
  );
}
