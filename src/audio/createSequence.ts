import type { SampleBuffer } from "./SampleBuffer";
import type { Sequence } from "./Sequence";

export function createSequence<K extends string>(
  _sampleMap: Record<K, SampleBuffer<K>>,
  sequence: Sequence<K>
): Sequence<K> {
  return sequence;
}
