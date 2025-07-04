import type { SampleBuffer } from "./SampleBuffer";

export type SampleMap<K extends string> = {
  [key in K]: SampleBuffer<key>;
};
