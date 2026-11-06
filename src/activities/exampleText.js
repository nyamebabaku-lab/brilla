// How the worked example names its answer (shared with scripts/voice-script.mjs).
export function answerText(q) {
  const o = q.options[q.answer];
  if (q.answerText) return q.answerText;
  if (o.label) return o.label;
  if (o.size) return o.size === 'lg' ? 'the big one' : 'the small one';
  if (o.group) return `the group with ${o.group.length}`;
  return 'this one';
}
