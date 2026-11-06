// What the tracing activity says (shared with scripts/voice-script.mjs so the recording script matches).
export const PATH_NAMES = { down: 'a line going down', across: 'a line going across', slant: 'a slanting line', slant2: 'a slanting line', wave: 'a wavy line', zigzag: 'a zig zag line', curve: 'a curve, like a rainbow', loop: 'a loopy line', circle: 'a circle', oval: 'an oval', square: 'a square', triangle: 'a triangle', diamond: 'a diamond', star: 'a star', heart: 'a heart' };

export function sayFor(step) {
  if (step.kind === 'path') return `Trace ${PATH_NAMES[step.target]}`;
  if (step.kind === 'number') return `Trace the number ${step.target}`;
  if (step.kind === 'letter') return `Trace the letter ${step.target}. ${step.target === step.target.toUpperCase() ? 'Capital' : 'Small'} ${step.target}.`;
  return `Trace the word ${step.target}`;
}
