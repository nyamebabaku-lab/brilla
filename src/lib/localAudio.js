// Plays a Ghanaian-language word: the native-speaker recording if Admin added one,
// otherwise (if allowed) an approximate reading by the device voice.
import { useDB } from '../data/store';
import { getClip } from '../data/audioStore';
import { say, stopSpeaking } from './speech';
import { duckForSpeech } from './music';
import { localClipUrl } from './voiceBank';

let current = null;

// English voices can't read ɛ, ɔ, ŋ; spell them the way they sound.
const approx = (w) =>
  w
    .replace(/ɛ/g, 'eh')
    .replace(/Ɛ/g, 'Eh')
    .replace(/ɔ/g, 'aw')
    .replace(/Ɔ/g, 'Aw')
    .replace(/ŋ/g, 'ng')
    .replace(/kyɛ|ky/g, 'ch')
    .replace(/hw/g, 'hw');

export const hasVoiceFor = (word) => !!word?.audio || useDB.getState().settings.ttsFallback !== false;

export async function playLocal(lang, word) {
  if (!word) return;
  stopSpeaking();
  if (current) {
    current.pause();
    current = null;
  }
  if (word.audio) {
    try {
      const blob = await getClip(`${lang}:${word.id}`);
      if (blob) {
        const url = URL.createObjectURL(blob);
        current = new Audio(url);
        duckForSpeech(true);
        current.onended = () => (duckForSpeech(false), URL.revokeObjectURL(url));
        await current.play();
        return;
      }
    } catch {
      /* fall back to the device voice */
    }
  }
  // Native-speaker recording that ships with the app.
  const url = await localClipUrl(lang, word.id);
  if (url) {
    try {
      current = new Audio(url);
      duckForSpeech(true);
      current.onended = () => duckForSpeech(false);
      await current.play();
      return;
    } catch {
      /* fall back to the device voice */
    }
  }
  if (useDB.getState().settings.ttsFallback !== false) say(approx(word.w), { rate: 0.75 });
}
