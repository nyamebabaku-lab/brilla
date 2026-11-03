import { levelById } from './levels';

// Which levels each subject is offered at (by level number n, inclusive).
export const SUBJECTS = [
  { id: 'scribble', name: 'Scribbling', emoji: '🖍️', color: '#f472b6', from: 0, to: 3, blurb: 'Free play with colours and stamps' },
  { id: 'colour', name: 'Colouring', emoji: '🎨', color: '#fb923c', from: 0, to: 7, blurb: 'Tap to fill pictures with colour' },
  { id: 'trace', name: 'Tracing', emoji: '✍️', color: '#facc15', from: 1, to: 7, blurb: 'Lines, shapes, numbers and letters' },
  { id: 'draw', name: 'Drawing', emoji: '🖌️', color: '#34d399', from: 0, to: 10, blurb: 'Draw what you imagine' },
  { id: 'phonics', name: 'Phonics', emoji: '🔤', color: '#22d3ee', from: 2, to: 6, blurb: 'Letter sounds and blending' },
  { id: 'english', name: 'English', emoji: '📖', color: '#60a5fa', from: 3, to: 10, blurb: 'Words, reading and grammar' },
  { id: 'writing', name: 'Writing', emoji: '📝', color: '#a78bfa', from: 4, to: 10, blurb: 'Copy, spell and write' },
  { id: 'maths', name: 'Maths', emoji: '🔢', color: '#f87171', from: 0, to: 10, blurb: 'Numbers, shapes and problem solving' },
  { id: 'science', name: 'Science', emoji: '🔬', color: '#4ade80', from: 3, to: 10, blurb: 'Explore living things and the world' },
];

export const subjectById = (id) => SUBJECTS.find((s) => s.id === id);
export const subjectsForLevel = (levelId) => {
  const n = levelById(levelId).n;
  return SUBJECTS.filter((s) => n >= s.from && n <= s.to);
};
