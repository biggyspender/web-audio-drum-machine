import type { SampleBuffer } from "../../../audio/SampleBuffer";
import type { GridState } from "../types";

/**
 * Create an empty grid pattern: all steps off, velocity 0, BPM 120, swing 0.5
 */
export function createEmptyGridPattern<K extends string>(
  sampleMap: Record<K, SampleBuffer<K>>
) {
  const grid: GridState<K> = {} as GridState<K>;
  for (const track of Object.keys(sampleMap)) {
    grid[track as K] = new Array(16).fill(0);
  }
  
  return grid;
}
