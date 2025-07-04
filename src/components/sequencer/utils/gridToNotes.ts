import type { PlaySample } from '../../../audio/PlaySample';
import type { SampleBuffer } from '../../../audio/SampleBuffer';
import type { GridState } from '../types';
import { DEFAULT_TRACK_VELOCITIES, STEP_COUNT } from '../types';

export function gridToNotes<K extends string>(
  gridState: GridState<K>,
  sampleMap: Record<K, SampleBuffer<K>>
): PlaySample<K>[][] {
  const notes: PlaySample<K>[][] = [];
  
  for (let stepIndex = 0; stepIndex < STEP_COUNT; stepIndex++) {
    const stepSamples: PlaySample<K>[] = [];
    
    // Check each track for active steps
    (Object.keys(gridState) as K[]).forEach(trackKey => {
      if (gridState[trackKey][stepIndex]) {
        stepSamples.push({
          sample: sampleMap[trackKey],
          velocity: DEFAULT_TRACK_VELOCITIES[trackKey] ?? 1.0
        });
      }
    });
    
    notes.push(stepSamples);
  }
  
  return notes;
}
