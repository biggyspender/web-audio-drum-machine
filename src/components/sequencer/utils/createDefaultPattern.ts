import type { GridState } from "../types";
import type { SampleBuffer } from "../../../audio/SampleBuffer";

export function createDefaultGridPattern<K extends string>(
  _sampleMap: Record<K, SampleBuffer<K>>
): GridState<K> {

  // Create a funky breakbeat pattern (inspired by the Amen break)
  // Map boolean pattern to velocity values (0, 128, 255)
  const boolPattern = {
    hat: [
      true, false, true, false, false, false, true, true,
      false, true, true, false, true, false, true, false,
    ],
    clap: [
      false, false, true, false, false, true, false, false,
      true, false, false, true, false, true, false, true,
    ],
    snare: [
      false, false, false, false, true, false, false, false,
      false, false, false, false, true, false, false, false,
    ],
    kick: [
      true, false, false, false, false, false, true, false,
      false, false, true, false, false, false, false, false,
    ],
  };

  // Convert to velocity pattern: true → 255, false → 0
  const velocityPattern: Record<string, number[]> = {};
  for (const track in boolPattern) {
    velocityPattern[track] = boolPattern[track as keyof typeof boolPattern].map((v: boolean) => v ? 255 : 0);
  }

  // Only include tracks present in sampleMap
  const result: GridState<K> = {} as GridState<K>;
  for (const track of Object.keys(_sampleMap)) {
    result[track as K] = velocityPattern[track] ?? new Array(16).fill(0);
  }
  return result;
}
