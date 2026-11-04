// Plays background music on kid screens only, quieter during lessons, paused when the app is hidden.
import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useDB } from '../data/store';
import { audioCtx } from '../lib/audio';
import { isMusicPlaying, setLessonMode, setMusicVolume, startMusic, stopMusic } from '../lib/music';

export default function MusicController() {
  const { pathname } = useLocation();
  const on = useDB((s) => s.prefs.music !== false);
  const volume = useDB((s) => s.prefs.musicVolume ?? 0.5);
  const kidArea = pathname.startsWith('/kid/');
  const inLesson = /\/l\//.test(pathname);
  const shouldPlay = on && kidArea;

  useEffect(() => setMusicVolume(volume), [volume]);
  useEffect(() => setLessonMode(inLesson), [inLesson]);

  useEffect(() => {
    if (!shouldPlay) {
      if (isMusicPlaying()) stopMusic();
      return;
    }
    // Browsers only allow sound after a tap, so (re)start on the next tap if needed.
    const kick = () => {
      audioCtx();
      if (!isMusicPlaying() && document.visibilityState === 'visible') startMusic();
    };
    kick();
    const onVis = () => (document.visibilityState === 'visible' ? kick() : stopMusic());
    window.addEventListener('pointerdown', kick);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      window.removeEventListener('pointerdown', kick);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [shouldPlay]);

  return null;
}
