import type { SampleBuffer } from "./SampleBuffer";

export type PlaySample<K extends string> = {
  sample: SampleBuffer<K>;
  velocity: number;
};
