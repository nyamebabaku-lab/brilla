import { useEffect, useState } from 'react';
import { useDB } from '../data/store';
import { applyTheme } from './theme';
import { setSpeechEnabled, setVoiceOverrides } from './speech';
import { setSfxEnabled } from './sfx';

export const useUser = () => {
  const id = useDB((s) => s.session.userId);
  return useDB((s) => s.users.find((u) => u.id === id)) || null;
};
export const useChild = (id) => useDB((s) => s.children.find((c) => c.id === id)) || null;

/** Applies a theme while the calling page is mounted. */
export function useTheme(theme) {
  const fallback = useDB((s) => s.settings.defaultTheme);
  const t = theme || fallback;
  useEffect(() => {
    applyTheme(t);
  }, [t]);
}

/** Keeps speech/sfx switches in sync with saved preferences. */
export function usePrefsSync() {
  const prefs = useDB((s) => s.prefs);
  useEffect(() => {
    setSpeechEnabled(prefs.voice);
    setSfxEnabled(prefs.sound);
    setVoiceOverrides({ female: prefs.voiceFemale, male: prefs.voiceMale });
  }, [prefs]);
}

export function useOnline() {
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return online;
}
