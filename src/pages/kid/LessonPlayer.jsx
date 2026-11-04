import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { X } from 'lucide-react';
import KidLayout, { useKid } from './KidLayout';
import Paywall from './Paywall';
import { useDB } from '../../data/store';
import { STICKERS } from '../../data/seed';
import { buildLesson, lessonsFor } from '../../curriculum';
import { subjectById } from '../../curriculum/subjects';
import { ACTIVITIES } from '../../activities';
import { useChildAccess } from '../../lib/access';
import { starsFor } from '../../lib/progress';
import { Brill, Confetti, SpeechBubble } from '../../components/brand';
import { Stars } from '../../components/ui';
import { stopSpeaking, say } from '../../lib/speech';
import { sfx } from '../../lib/sfx';

const CHEERS = ['Super!', 'Brilliant!', 'Great job!', 'You did it!', 'Amazing!', 'Wow!', 'Fantastic!'];

// Keyed by lesson so moving to the next lesson starts with fresh state.
export default function LessonPlayer() {
  const { childId, lessonId } = useParams();
  return <Player key={`${childId}/${lessonId}`} childId={childId} lessonId={lessonId} />;
}

function Player({ childId, lessonId }) {
  const nav = useNavigate();
  const { child, isStudent } = useKid(childId);
  const settings = useDB((s) => s.settings);
  const recordLesson = useDB((s) => s.recordLesson);
  const addSticker = useDB((s) => s.addSticker);
  const saveDrawing = useDB((s) => s.saveDrawing);
  const { unlocked } = useChildAccess(child);
  const [attempt, setAttempt] = useState(0);
  const [i, setI] = useState(0);
  const [cheer, setCheer] = useState(null);
  const [finished, setFinished] = useState(null);
  const tally = useRef({ mistakes: 0, questions: 0 });

  const lesson = useMemo(() => (child ? buildLesson(lessonId, { track: child.track, childName: child.name, lang: child.localLang, settings, attempt }) : null), [child, lessonId, settings, attempt]);
  const list = useMemo(() => (child && lesson ? lessonsFor(lesson.meta.levelId, lesson.meta.subjectId, { track: child.track, childName: child.name, lang: child.localLang, settings }) : []), [child, lesson, settings]);
  const meta = list.find((l) => l.id === lessonId);
  const nextLesson = meta ? list[meta.order + 1] : null;

  useEffect(() => () => stopSpeaking(), []);

  // Read the question aloud when a choice step appears (other activities speak for themselves).
  useEffect(() => {
    const st = lesson?.steps[i];
    if (!st || finished) return;
    if ((st.type === 'choice' && st.say !== '') || st.type === 'learn') {
      const t = setTimeout(() => say(st.say || st.prompt), 350);
      return () => clearTimeout(t);
    }
  }, [lesson, i, finished]);

  const onDone = useCallback(
    (res = {}) => {
      tally.current.mistakes += res.mistakes || 0;
      tally.current.questions += res.questions || 0;
      const isLast = i >= lesson.steps.length - 1;
      if (isLast) {
        const stars = starsFor(tally.current.questions, tally.current.mistakes);
        const sticker = STICKERS[Math.floor(Math.random() * STICKERS.length)];
        recordLesson(child.id, lessonId, stars);
        addSticker(child.id, sticker);
        setFinished({ stars, sticker });
        sfx('fanfare');
        setTimeout(() => say(`${CHEERS[Math.floor(Math.random() * CHEERS.length)]} You earned ${stars} star${stars > 1 ? 's' : ''} and a new sticker!`), 400);
      } else if (res.questions) {
        const c = CHEERS[Math.floor(Math.random() * CHEERS.length)];
        setCheer(c);
        setTimeout(() => setCheer(null), 700);
        setI((x) => x + 1);
      } else setI((x) => x + 1);
    },
    [i, lesson, child, lessonId, recordLesson, addSticker],
  );

  if (!child) return <KidLayout child={null} />;
  if (!lesson || !meta)
    return (
      <KidLayout child={child} back={`/kid/${child.id}`}>
        <div className="card mx-auto max-w-md p-8 text-center">
          <Brill size={70} mood="sad" className="mx-auto" />
          <p className="mt-3 text-lg">This lesson isn’t available right now.</p>
          <Link to={`/kid/${child.id}`} className="btn-primary mt-4">
            Back home
          </Link>
        </div>
      </KidLayout>
    );
  if (!meta.free && !unlocked) return <LockedLesson child={child} isStudent={isStudent} back={`/kid/${child.id}/s/${meta.subjectId}`} />;

  const subject = subjectById(lesson.meta.subjectId);
  const step = lesson.steps[Math.min(i, lesson.steps.length - 1)];
  const Activity = ACTIVITIES[step.type];
  const back = `/kid/${child.id}/s/${lesson.meta.subjectId}`;

  return (
    <KidLayout child={child} hideBar>
      <div className="sticky top-0 z-30 -mx-3 mb-4 px-3 pt-2 sm:-mx-4 sm:px-4">
        <div className="mx-auto flex max-w-4xl items-center gap-3 rounded-3xl bg-white/90 p-2 shadow-soft backdrop-blur">
          <button onClick={() => nav(back)} className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-600" aria-label="Close lesson">
            <X />
          </button>
          <span className="hidden text-2xl sm:block">{subject?.emoji}</span>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-slate-500">{meta.title}</div>
            <div className="h-4 overflow-hidden rounded-full bg-slate-100">
              <div className="rainbow-bar h-full rounded-full transition-all duration-500" style={{ width: `${((finished ? lesson.steps.length : i) / lesson.steps.length) * 100}%` }} />
            </div>
          </div>
          <span className="shrink-0 rounded-xl bg-brand-50 px-2.5 py-1 text-sm font-bold text-brand-700">
            {Math.min(i + 1, lesson.steps.length)}/{lesson.steps.length}
          </span>
        </div>
      </div>

      {finished ? (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 py-6 text-center">
          <Confetti fire />
          <div className="relative">
            <Brill size={120} mood="wow" className="animate-bob" />
          </div>
          <h1 className="on-bg text-4xl font-bold">Lesson complete!</h1>
          <Stars n={finished.stars} size="text-6xl" />
          <div className="card flex items-center gap-4 px-6 py-4 animate-pop">
            <span className="text-6xl">{finished.sticker}</span>
            <span className="text-left">
              <span className="block text-sm text-slate-500">New sticker!</span>
              <span className="text-xl font-semibold">Added to your sticker book</span>
            </span>
          </div>
          <div className="mt-2 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
            {nextLesson && (
              <button onClick={() => nav(`/kid/${child.id}/l/${nextLesson.id}`)} className="btn-accent px-7 py-3.5 text-xl">
                Next lesson →
              </button>
            )}
            <button
              onClick={() => {
                tally.current = { mistakes: 0, questions: 0 };
                setI(0);
                setFinished(null);
                setAttempt((a) => a + 1);
              }}
              className="btn-white px-6 py-3.5 text-lg">
              🔁 Play again
            </button>
            <button onClick={() => nav(back)} className="btn-white px-6 py-3.5 text-lg">
              🗺️ Map
            </button>
          </div>
        </div>
      ) : (
        <div key={`${attempt}-${i}`} className="mx-auto max-w-4xl animate-fade-in">
          {Activity ? (
            <Activity step={step} onDone={onDone} onSave={(d) => saveDrawing(child.id, d)} onSaveText={(d) => saveDrawing(child.id, d)} child={child} />
          ) : (
            <div className="text-center">Unknown activity</div>
          )}
        </div>
      )}

      {cheer && (
        <div className="pointer-events-none fixed inset-x-0 top-1/3 z-40 flex justify-center">
          <div className="flex items-center gap-2 animate-pop">
            <Brill size={64} mood="wow" />
            <SpeechBubble className="text-2xl font-bold text-emerald-600">{cheer}</SpeechBubble>
          </div>
        </div>
      )}
    </KidLayout>
  );
}

function LockedLesson({ child, isStudent, back }) {
  const nav = useNavigate();
  return (
    <KidLayout child={child} back={back}>
      <Paywall open onClose={() => nav(back)} child={child} isStudent={isStudent} />
    </KidLayout>
  );
}
