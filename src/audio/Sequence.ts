import type { PlaySample } from "./PlaySample";

export type Sequence<K extends string> = {
  // the notes array is a beat by beat representation of the sequence
  // each note is represented by a Sample object
  // the length of the array is equal to the number of beats in the sequence
  // the index of the array represents the beat number (0-indexed)
  // e.g. [Sample, Sample, undefined, Sample] means there are notes on beats 0, 1, and 3
  notes: PlaySample<K>[][];
  bpm: number;
  timeSignature: [number, number];
  bars: number;
  swing: number;
  humanize?: {
    velocity?: number; // 0-1, 0 = no humanization, 1 = full humanization
    timing?: number; // 0-1, 0 = no humanization, 1 = full humanization
  };
};
