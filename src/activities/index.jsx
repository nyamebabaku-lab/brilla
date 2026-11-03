import { Blend, Choice, Learn, Read, Sort, SoundCard, Spell } from './quiz';
import TraceCanvas from './TraceCanvas';
import DrawCanvas from './DrawCanvas';
import ColorPicture from './ColorPicture';
import { Compose, WriteLines } from './Writing';

export const ACTIVITIES = {
  choice: Choice,
  learn: Learn,
  sound: SoundCard,
  blend: Blend,
  read: Read,
  sort: Sort,
  spell: Spell,
  trace: TraceCanvas,
  draw: DrawCanvas,
  colour: ColorPicture,
  write: WriteLines,
  compose: Compose,
};
