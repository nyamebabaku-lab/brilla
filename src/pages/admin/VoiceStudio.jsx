// Admin → Voice studio: record the teacher voices line by line, or import a whole take and split it automatically.
// Clips are saved on this device (IndexedDB 'voice:<teacher>:<key>'; Twi/Ga words under '<lang>:<wordId>')
// and used by the app straight away. "Export" makes a file to send for publishing to every family.
import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, Mic, Play, Square, Trash2, Upload, Merge } from 'lucide-react';
import catalogue from '../../voice/catalogue.json';
import { findSegments, alignSegments, cutClip, expectedSeconds } from '../../voice/segment';
import { blobToDataURL, dataURLToBlob, deleteClip, getClip, listClipKeys, putClip } from '../../data/audioStore';
import { refreshStudioClips } from '../../lib/voiceBank';
import { audioCtx } from '../../lib/audio';
import { useDB } from '../../data/store';
import { toast } from '../../components/ui';
import { cls } from '../../lib/format';

const TAKE = 50;
const ENTRIES = catalogue.entries;
const num = (key) => Number(key.split('-')[1]);
const takeOf = (key) => Math.ceil(num(key) / TAKE);
const VOICES = [
  { id: 'akos', label: 'Auntie Akos', emoji: '👩🏾‍🏫', sections: 'ANLPMESWCV' },
  { id: 'kwame', label: 'Uncle Kwame', emoji: '👨🏾‍🏫', sections: 'ANLPMESWCV' },
  { id: 'twi', label: 'Twi speaker', emoji: '🟡', sections: 'T' },
  { id: 'ga', label: 'Ga speaker', emoji: '🔵', sections: 'G' },
];
const SECTION_NAMES = { A: 'App and teacher', N: 'Numbers', L: 'Letter names', P: 'Phonics', M: 'Maths', E: 'English', S: 'Science', W: 'Writing', C: 'Creative', V: 'Vocabulary', T: 'Twi words', G: 'Ga words' };

/** Where a line's clip is stored for a voice. */
const storeKey = (voice, e) => (e.kind === 'local' ? `${e.lang}:${e.wordId}` : `voice:${voice}:${e.key}`);
const linesFor = (voice, section) => ENTRIES.filter((e) => e.section === section && (!e.only || e.only === voice)).sort((a, b) => num(a.key) - num(b.key));

const recMime = () => ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'].find((m) => window.MediaRecorder?.isTypeSupported?.(m)) || '';

/** Compresses raw audio into a small clip using the browser's own recorder (plays silently in real time). */
function encodeClip(pcm, rate) {
  return new Promise((resolve, reject) => {
    const ctx = audioCtx();
    const buf = ctx.createBuffer(1, pcm.length, rate);
    buf.copyToChannel(pcm, 0);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const dest = ctx.createMediaStreamDestination();
    src.connect(dest);
    const chunks = [];
    const rec = new MediaRecorder(dest.stream, recMime() ? { mimeType: recMime(), audioBitsPerSecond: 40000 } : undefined);
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => resolve(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
    rec.onerror = reject;
    rec.start();
    src.onended = () => setTimeout(() => rec.stop(), 60);
    src.start(ctx.currentTime + 0.05);
  });
}

async function playBlob(blob) {
  const ctx = audioCtx();
  const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start();
}
function playPcm(pcm, rate) {
  const ctx = audioCtx();
  const buf = ctx.createBuffer(1, pcm.length, rate);
  buf.copyToChannel(pcm, 0);
  const src = ctx.createBufferSource();
  src.buffer = buf;
  src.connect(ctx.destination);
  src.start();
}

export default function VoiceStudio() {
  const settings = useDB((s) => s.settings);
  const updateSettings = useDB((s) => s.updateSettings);
  const [voice, setVoice] = useState('akos');
  const v = VOICES.find((x) => x.id === voice);
  const [section, setSection] = useState('A');
  const sec = v.sections.includes(section) ? section : v.sections[0];
  const all = useMemo(() => linesFor(voice, sec), [voice, sec]);
  const takes = Math.max(1, Math.ceil(num(all[all.length - 1]?.key || 'X-1') / TAKE));
  const [take, setTake] = useState(1);
  const t = Math.min(take, takes);
  const lines = all.filter((e) => takeOf(e.key) === t);
  const [done, setDone] = useState(new Set());
  const [mode, setMode] = useState('line');

  const refresh = async () => {
    const keys = new Set(await listClipKeys(''));
    setDone(keys);
    await refreshStudioClips();
  };
  useEffect(() => {
    refresh();
  }, []);

  const voiceLines = ENTRIES.filter((e) => v.sections.includes(e.section) && (!e.only || e.only === voice));
  const recorded = voiceLines.filter((e) => done.has(storeKey(voice, e))).length;

  // Twi/Ga clips also switch on the word's audio in the Twi & Ga subject.
  const markLocal = (e, on) => {
    const langs = settings.languages;
    const pack = langs?.[e.lang];
    if (!pack) return;
    updateSettings({ languages: { ...langs, [e.lang]: { ...pack, categories: pack.categories.map((c) => ({ ...c, words: c.words.map((w) => (w.id === e.wordId ? { ...w, audio: on } : w)) })) } } });
  };
  const saveClip = async (e, blob) => {
    await putClip(storeKey(voice, e), blob);
    if (e.kind === 'local') markLocal(e, true);
  };
  const removeClip = async (e) => {
    await deleteClip(storeKey(voice, e));
    if (e.kind === 'local') markLocal(e, false);
    refresh();
  };

  const exportPack = async () => {
    const clips = {};
    for (const e of voiceLines) {
      const b = done.has(storeKey(voice, e)) ? await getClip(storeKey(voice, e)) : null;
      if (b) clips[e.key] = await blobToDataURL(b);
    }
    if (!Object.keys(clips).length) return toast.error('Nothing recorded yet for this voice');
    const file = new Blob([JSON.stringify({ brillaVoicePack: 1, voice, version: catalogue.version, clips })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(file);
    a.download = `brilla-voice-${voice}-${Object.keys(clips).length}.json`;
    a.click();
  };
  const importPack = async (file) => {
    try {
      const data = JSON.parse(await file.text());
      if (!data.brillaVoicePack || !data.clips) throw new Error('not a pack');
      const byKey = new Map(ENTRIES.map((e) => [e.key, e]));
      let n = 0;
      for (const [key, url] of Object.entries(data.clips)) {
        const e = byKey.get(key);
        if (!e) continue;
        await putClip(storeKey(data.voice, e), await dataURLToBlob(url));
        if (e.kind === 'local') markLocal(e, true);
        n++;
      }
      toast.success(`Imported ${n} recordings`);
      refresh();
    } catch {
      toast.error('That file is not a Brilla voice pack');
    }
  };

  return (
    <div className="space-y-4">
      <div className="panel flex flex-wrap items-center gap-2 p-4">
        {VOICES.map((x) => (
          <button key={x.id} onClick={() => (setVoice(x.id), setTake(1))} className={cls('rounded-xl px-4 py-2 font-semibold', x.id === voice ? 'bg-brand-600 text-white' : 'bg-slate-100')}>
            {x.emoji} {x.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <label className="btn-white cursor-pointer text-sm">
            <Upload size={16} /> Import pack
            <input type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files[0] && importPack(e.target.files[0])} />
          </label>
          <button onClick={exportPack} className="btn-white text-sm">
            <Download size={16} /> Export {v.label}
          </button>
        </div>
      </div>

      <div className="panel space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex-1">
            <div className="font-semibold">
              {v.emoji} {v.label}: {recorded} of {voiceLines.length} lines recorded on this device
            </div>
            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(recorded / Math.max(1, voiceLines.length)) * 100}%` }} />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {v.sections.split('').map((s) => {
            const ls = linesFor(voice, s);
            const d = ls.filter((e) => done.has(storeKey(voice, e))).length;
            return (
              <button key={s} onClick={() => (setSection(s), setTake(1))} className={cls('rounded-xl px-3 py-1.5 text-sm font-semibold', s === sec ? 'bg-brand-600 text-white' : 'bg-slate-100')}>
                {s} · {SECTION_NAMES[s]} <span className="opacity-70">{d}/{ls.length}</span>
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: takes }, (_, i) => i + 1).map((k) => {
            const ls = all.filter((e) => takeOf(e.key) === k);
            const d = ls.filter((e) => done.has(storeKey(voice, e))).length;
            return (
              <button key={k} onClick={() => setTake(k)} className={cls('rounded-lg px-2.5 py-1 text-xs font-semibold', k === t ? 'bg-accent-500 text-white' : d === ls.length && ls.length ? 'bg-emerald-100 text-emerald-700' : 'bg-white ring-1 ring-slate-200')}>
                {sec}
                {String(k).padStart(2, '0')} {d === ls.length && ls.length ? '✓' : `${d}/${ls.length}`}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        {[
          ['line', 'Record line by line'],
          ['take', 'Import a whole take'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setMode(id)} className={cls('rounded-xl px-4 py-2 text-sm font-semibold', mode === id ? 'bg-ink text-white' : 'bg-white')}>
            {label}
          </button>
        ))}
      </div>

      {mode === 'line' ? (
        <LineRecorder key={`${voice}-${sec}-${t}`} voice={voice} lines={lines} done={done} saveClip={saveClip} removeClip={removeClip} refresh={refresh} />
      ) : (
        <TakeImporter key={`${voice}-${sec}-${t}`} take={`${sec}${String(t).padStart(2, '0')}`} lines={lines} saveClip={saveClip} refresh={refresh} />
      )}
    </div>
  );
}

function LineRecorder({ voice, lines, done, saveClip, removeClip, refresh }) {
  const firstTodo = Math.max(0, lines.findIndex((e) => !done.has(storeKey(voice, e))));
  const [cur, setCur] = useState(firstTodo);
  const [rec, setRec] = useState(null);
  const stream = useRef(null);
  const line = lines[cur];

  useEffect(
    () => () => {
      stream.current?.getTracks().forEach((tr) => tr.stop());
    },
    [],
  );

  const start = async () => {
    try {
      stream.current ||= await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: true, autoGainControl: true } });
      const mr = new MediaRecorder(stream.current, recMime() ? { mimeType: recMime() } : undefined);
      const chunks = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = async () => {
        const raw = new Blob(chunks, { type: mr.mimeType || 'audio/webm' });
        // Trim the silence before and after, level the volume, then save.
        const ctx = audioCtx();
        const buf = await ctx.decodeAudioData(await raw.arrayBuffer());
        const pcm = buf.getChannelData(0);
        const { segments } = findSegments(pcm, buf.sampleRate, { lineGap: 5 });
        const seg = segments.length ? { start: segments[0].start, end: segments[segments.length - 1].end } : { start: 0, end: buf.duration };
        const blob = await encodeClip(cutClip(pcm, buf.sampleRate, seg), buf.sampleRate);
        await saveClip(line, blob);
        await refresh();
        playBlob(blob);
        setCur((c) => Math.min(lines.length - 1, c + 1));
      };
      mr.start();
      setRec(mr);
    } catch {
      toast.error('Microphone not available', 'Allow microphone access in the browser');
    }
  };
  const stop = () => {
    rec?.stop();
    setRec(null);
  };

  if (!lines.length) return <div className="panel p-6 text-slate-500">No lines in this take for this voice.</div>;
  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="panel divide-y">
        {lines.map((e, i) => {
          const ok = done.has(storeKey(voice, e));
          return (
            <div key={e.key} onClick={() => setCur(i)} className={cls('flex cursor-pointer items-center gap-3 px-3 py-2', i === cur && 'bg-brand-50')}>
              <span className={cls('h-3 w-3 shrink-0 rounded-full', ok ? 'bg-emerald-500' : 'bg-slate-200')} />
              <span className="w-16 shrink-0 text-xs text-slate-400">{e.key}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">{e.kind === 'sound' ? e.sound : e.text}</span>
                {(e.example || e.meaning) && <span className="block truncate text-xs text-slate-400">{e.example ? `in: ${e.example}` : `means ${e.meaning}`}</span>}
              </span>
              {ok && (
                <>
                  <button onClick={async (ev) => (ev.stopPropagation(), playBlob(await getClip(storeKey(voice, e))))} className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-700" aria-label="Play">
                    <Play size={14} />
                  </button>
                  <button onClick={(ev) => (ev.stopPropagation(), removeClip(e))} className="grid h-8 w-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50" aria-label="Delete recording">
                    <Trash2 size={14} />
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
      <div className="panel sticky top-20 h-fit space-y-3 p-5 text-center">
        <div className="text-xs text-slate-400">
          {line.key} · line {cur + 1} of {lines.length}
        </div>
        <div className="text-3xl font-semibold leading-snug">{line.kind === 'sound' ? line.sound : line.text}</div>
        {line.example && <div className="text-sm text-slate-500">in: “{line.example}”</div>}
        {line.meaning && <div className="text-sm text-slate-500">means “{line.meaning}”</div>}
        <div className="rounded-xl bg-slate-50 p-2 text-xs text-slate-500">{line.kind === 'sound' ? line.text.replace(/^\S+\s+/, '') : line.tip}</div>
        {rec ? (
          <button onClick={stop} className="btn mx-auto flex h-20 w-20 animate-pulse rounded-full bg-rose-600 text-white" aria-label="Stop recording">
            <Square size={28} />
          </button>
        ) : (
          <button onClick={start} className="btn mx-auto flex h-20 w-20 rounded-full bg-rose-500 text-white shadow-chunky" aria-label="Record this line">
            <Mic size={32} />
          </button>
        )}
        <p className="text-xs text-slate-400">Tap ●, read the line, tap ■. It saves, plays back, and moves to the next line.</p>
      </div>
    </div>
  );
}

function TakeImporter({ take, lines, saveClip, refresh }) {
  const [audio, setAudio] = useState(null); // { pcm, rate, name }
  const [segs, setSegs] = useState([]);
  const [info, setInfo] = useState(null);
  const [saving, setSaving] = useState(null);

  const load = async (file) => {
    try {
      const ctx = audioCtx();
      const buf = await ctx.decodeAudioData(await file.arrayBuffer());
      const pcm = buf.getChannelData(0);
      const found = findSegments(pcm, buf.sampleRate);
      const a = alignSegments(found, lines.length);
      setAudio({ pcm, rate: buf.sampleRate, name: file.name });
      setSegs(a.status === 'ok' ? a.clips : found.segments);
      setInfo(a);
    } catch {
      toast.error('Could not read that audio file', 'Try MP3, M4A, WAV or OGG');
    }
  };
  const merge = (i) => setSegs((s) => [...s.slice(0, i), { start: s[i].start, end: s[i + 1].end }, ...s.slice(i + 2)]);
  const drop = (i) => setSegs((s) => s.filter((_, k) => k !== i));
  const saveAll = async () => {
    setSaving(0);
    for (let i = 0; i < Math.min(segs.length, lines.length); i++) {
      await saveClip(lines[i], await encodeClip(cutClip(audio.pcm, audio.rate, segs[i]), audio.rate));
      setSaving(i + 1);
    }
    await refresh();
    setSaving(null);
    toast.success(`Saved ${Math.min(segs.length, lines.length)} recordings`);
  };

  const match = segs.length === lines.length;
  return (
    <div className="space-y-3">
      <div className="panel flex flex-wrap items-center gap-3 p-4">
        <label className="btn-primary cursor-pointer">
          <Upload size={16} /> Choose the take {take} recording
          <input type="file" accept="audio/*" hidden onChange={(e) => e.target.files[0] && load(e.target.files[0])} />
        </label>
        <p className="text-sm text-slate-500">Read the {lines.length} lines in order with a pause after each. A 4-second pause means “redo the last line”.</p>
      </div>
      {audio && (
        <>
          <div className={cls('rounded-2xl p-3 font-medium', match ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900')}>
            {audio.name}: found {segs.length} lines, script has {lines.length}.{info?.note ? ` (${info.note})` : ''}{' '}
            {match ? 'Everything lines up. Listen to a few, then save.' : 'Merge pieces that belong together or delete extra bits until the numbers match.'}
          </div>
          <div className="panel divide-y">
            {Array.from({ length: Math.max(segs.length, lines.length) }, (_, i) => {
              const e = lines[i];
              const s = segs[i];
              const len = s ? s.end - s.start : 0;
              const odd = s && e && (len > expectedSeconds(e.text) * 2.6 + 0.8 || len < expectedSeconds(e.text) * 0.3);
              return (
                <div key={i} className="flex items-center gap-3 px-3 py-2">
                  <span className="w-16 shrink-0 text-xs text-slate-400">{e?.key || '(extra)'}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">{e ? (e.kind === 'sound' ? e.sound : e.text) : ''}</span>
                  {s ? (
                    <>
                      <span className={cls('w-14 text-right text-xs', odd ? 'font-bold text-amber-600' : 'text-slate-400')}>{len.toFixed(1)}s</span>
                      <button onClick={() => playPcm(cutClip(audio.pcm, audio.rate, s), audio.rate)} className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100" aria-label="Play">
                        <Play size={14} />
                      </button>
                      {i < segs.length - 1 && (
                        <button onClick={() => merge(i)} className="grid h-8 w-8 place-items-center rounded-lg bg-slate-100" title="Join with the next piece" aria-label="Join with next">
                          <Merge size={14} />
                        </button>
                      )}
                      <button onClick={() => drop(i)} className="grid h-8 w-8 place-items-center rounded-lg text-rose-600 hover:bg-rose-50" aria-label="Delete piece">
                        <Trash2 size={14} />
                      </button>
                    </>
                  ) : (
                    <span className="text-xs text-rose-600">missing</span>
                  )}
                </div>
              );
            })}
          </div>
          <button onClick={saveAll} disabled={!match || saving != null} className="btn-accent">
            {saving != null ? `Saving ${saving}/${lines.length}…` : `Save ${lines.length} recordings`}
          </button>
        </>
      )}
    </div>
  );
}
