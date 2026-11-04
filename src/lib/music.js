// Gentle background music, synthesised on the device (no audio files, works offline).
// Every melody is a public-domain nursery tune or an original Brilla tune.
import { audioCtx } from './audio';

const T = (title, emoji, bpm, melody, bass, bassEvery = 2) => ({ title, emoji, bpm, melody, bass, bassEvery });

export const SONGS = [
  T('Brilla Theme', '⭐', 104, 'E4 G4 A4 G4 E4 D4 C4:2 D4 E4 G4 E4 D4:4 E4 G4 A4 C5 A4 G4 E4:2 D4 E4 D4 C4 C4:4', 'C3 C3 A2 A2 F2 F2 G2 G2 C3 C3 A2 A2 F2 G2 C3 C3'),
  T('Twinkle Twinkle Little Star', '🌟', 96, 'C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2 G4 G4 F4 F4 E4 E4 D4:2 G4 G4 F4 F4 E4 E4 D4:2 C4 C4 G4 G4 A4 A4 G4:2 F4 F4 E4 E4 D4 D4 C4:2', 'C3 C3 F3 C3 F3 C3 G2 C3 C3 F3 C3 G2 C3 F3 C3 G2 C3 C3 F3 C3 F3 C3 G2 C3'),
  T('Mary Had a Little Lamb', '🐑', 108, 'E4 D4 C4 D4 E4 E4 E4:2 D4 D4 D4:2 E4 G4 G4:2 E4 D4 C4 D4 E4 E4 E4 E4 D4 D4 E4 D4 C4:4', 'C3 C3 C3 C3 G2 G2 C3 C3 C3 C3 C3 C3 G2 G2 C3 C3'),
  T('London Bridge', '🌉', 112, 'G4:1.5 A4:0.5 G4 F4 E4 F4 G4:2 D4 E4 F4:2 E4 F4 G4:2 G4:1.5 A4:0.5 G4 F4 E4 F4 G4:2 D4:2 G4:2 E4 C4:3', 'C3 C3 C3 C3 G2 G2 C3 C3 C3 C3 C3 C3 G2 G2 C3 C3'),
  T('Frère Jacques', '🔔', 100, 'C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4:2 E4 F4 G4:2 G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4 G4:0.5 A4:0.5 G4:0.5 F4:0.5 E4 C4 C4 G3 C4:2 C4 G3 C4:2', 'C3 C3 C3 C3 C3 C3 C3 C3 C3 C3 C3 C3 C3 G2 C3 G2'),
  T('Old MacDonald', '🐄', 112, 'G4 G4 G4 D4 E4 E4 D4:2 B4 B4 A4 A4 G4:3 D4 G4 G4 G4 D4 E4 E4 D4:2 B4 B4 A4 A4 G4:4', 'G2 G2 C3 G2 G2 D3 G2 G2 G2 G2 C3 G2 G2 D3 G2 G2'),
  T('Row, Row, Row Your Boat', '🚣', 92, 'C4:1.5 C4:1.5 C4:1 D4:0.5 E4:1.5 E4:1 D4:0.5 E4:1 F4:0.5 G4:3 C5:0.5 C5:0.5 C5:0.5 G4:0.5 G4:0.5 G4:0.5 E4:0.5 E4:0.5 E4:0.5 C4:0.5 C4:0.5 C4:0.5 G4:1 F4:0.5 E4:1 D4:0.5 C4:3', 'C3 C3 C3 C3 C3 C3 G2 C3', 3),
];

const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const freq = (n) => {
  const m = n.match(/^([A-G])(#?)(\d)$/);
  if (!m) return 0;
  const midi = 12 * (Number(m[3]) + 1) + NOTE[m[1]] + (m[2] ? 1 : 0);
  return 440 * 2 ** ((midi - 69) / 12);
};
const parse = (str) =>
  str.split(/\s+/).map((tok) => {
    const [n, d] = tok.split(':');
    return { f: n === 'R' ? 0 : freq(n), beats: Number(d || 1) };
  });

let master = null;
let playing = false;
let songIdx = 0;
let timer = null;
let volume = 0.5;
let duck = 1;
let lessonDuck = 1;
const listeners = new Set();

const BASE = 0.11; // music sits under speech and sound effects
const level = () => BASE * volume * duck * lessonDuck;

function applyLevel() {
  const a = audioCtx();
  if (!master || !a) return;
  master.gain.cancelScheduledValues(a.currentTime);
  master.gain.setTargetAtTime(level(), a.currentTime, 0.25);
}

function voice(a, f, t, dur, kind) {
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = kind === 'bass' ? 'sine' : 'triangle';
  o.frequency.setValueAtTime(f, t);
  const peak = kind === 'bass' ? 0.5 : 0.9;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.001, t + Math.max(0.25, dur * 0.95));
  o.connect(g).connect(master);
  o.start(t);
  o.stop(t + dur + 0.05);
  // music-box sparkle an octave up, very quiet
  if (kind !== 'bass') {
    const o2 = a.createOscillator();
    const g2 = a.createGain();
    o2.type = 'sine';
    o2.frequency.setValueAtTime(f * 2, t);
    g2.gain.setValueAtTime(0.12, t);
    g2.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o2.connect(g2).connect(master);
    o2.start(t);
    o2.stop(t + 0.45);
  }
}

/** Schedules a whole song, then queues the next one. */
function playSong() {
  const a = audioCtx();
  if (!a || !playing) return;
  const song = SONGS[songIdx % SONGS.length];
  const beat = 60 / song.bpm;
  const start = a.currentTime + 0.15;
  let t = start;
  parse(song.melody).forEach(({ f, beats }) => {
    if (f) voice(a, f, t, beats * beat, 'mel');
    t += beats * beat;
  });
  parse(song.bass).forEach(({ f }, i) => f && voice(a, f, start + i * song.bassEvery * beat, song.bassEvery * beat, 'bass'));
  const length = t - start + beat * 3; // short rest between songs
  listeners.forEach((fn) => fn(song));
  timer = setTimeout(() => {
    songIdx = (songIdx + 1) % SONGS.length;
    playSong();
  }, length * 1000);
}

export function startMusic(index) {
  const a = audioCtx();
  if (!a) return;
  if (!master) {
    master = a.createGain();
    master.gain.value = 0;
    master.connect(a.destination);
  }
  if (index != null) {
    stopMusic();
    songIdx = index;
  }
  if (playing) return;
  playing = true;
  applyLevel();
  playSong();
}

export function stopMusic() {
  playing = false;
  clearTimeout(timer);
  const a = audioCtx();
  if (master && a) {
    // Fade out and drop the old output so already-scheduled notes go silent.
    const old = master;
    old.gain.setTargetAtTime(0, a.currentTime, 0.1);
    setTimeout(() => old.disconnect(), 600);
    master = null;
  }
}

export const isMusicPlaying = () => playing;
export const currentSong = () => SONGS[songIdx % SONGS.length];
export const onSongChange = (fn) => (listeners.add(fn), () => listeners.delete(fn));
export function setMusicVolume(v) {
  volume = v;
  applyLevel();
}
/** Quieter while the read-aloud voice is speaking. */
export function duckForSpeech(on) {
  duck = on ? 0.3 : 1;
  applyLevel();
}
/** Quieter during lessons so children can concentrate. */
export function setLessonMode(on) {
  lessonDuck = on ? 0.65 : 1;
  applyLevel();
}
