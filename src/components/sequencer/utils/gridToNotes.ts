import type { PlaySample } from "../../../audio/PlaySample";
import type { SampleBuffer } from "../../../audio/SampleBuffer";
import type { GridState } from "../types";
import { STEP_COUNT, DEFAULT_TRACK_VELOCITIES } from "../types";

export function gridToNotes<K extends string>(
  gridState: GridState<K>,
  sampleMap: Record<K, SampleBuffer<K>>
): PlaySample<K>[][] {
  const notes: PlaySample<K>[][] = [];

  for (let stepIndex = 0; stepIndex < STEP_COUNT; stepIndex++) {
    const stepSamples: PlaySample<K>[] = [];

    // Check each track for active steps
    (Object.keys(gridState) as K[]).forEach((trackKey) => {
      const value = gridState[trackKey][stepIndex];
      let velocity: number;
      const defaultVelocity = DEFAULT_TRACK_VELOCITIES[trackKey] ?? 1.0;

      if (typeof value === "boolean") {
        velocity = value ? defaultVelocity : 0;
      } else {
        velocity = value != null ? defaultVelocity * value : 0;
      }
      if (velocity > 0) {
        stepSamples.push({
          sample: sampleMap[trackKey],
          velocity,
        });
      }
    });

    notes.push(stepSamples);
  }

  return notes;
}
