import type { GridState } from "../types";
import type { SampleBuffer } from "../../../audio/SampleBuffer";

export function createDefaultGridPattern<K extends string>(
  _sampleMap: Record<K, SampleBuffer<K>>
): GridState<K> {

  // Create a funky breakbeat pattern (inspired by the Amen break)
  const defaultPattern: GridState<K> = {
    hat: [
      true,
      false,
      true,
      false,
      false,
      false,
      true,
      true,
      false,
      true,
      true,
      false,
      true,
      false,
      true,
      false,
    ],
    clap: [
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      false,
      true,
      false,
      true,
      false,
      true,
    ],
    snare: [
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
    ],
    kick: [
      true,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
    ],
  } as GridState<K>;

  return defaultPattern;
}
