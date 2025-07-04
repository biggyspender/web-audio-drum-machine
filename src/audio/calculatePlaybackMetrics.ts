import type { Sequence } from "./Sequence";

export function calculatePlaybackMetrics<K extends string>(
  sequence: Sequence<K>,
  segmentStart: number,
  startTime: number
) {
  const beatDuration = 60 / sequence.bpm;
  const slotDuration = beatDuration / sequence.timeSignature[1];
  const barDuration = sequence.timeSignature[0] * beatDuration;
  const sequenceDuration = sequence.bars * barDuration;

  // Determine if we have swing, default to 0.5 (no swing) if not specified
  const swingValue = sequence.swing ?? 0.5;

  // Calculate relative time position within the sequence loop
  // First, find how much offset we need from startTime
  const relativeStartTime = segmentStart - startTime;

  // Calculate how many full iterations we need to cover before the relative start time
  // This determines which iteration we're on relative to the custom startTime
  const startIteration = Math.floor(relativeStartTime / sequenceDuration);
  return {
    slotDuration,
    beatDuration,
    swingValue,
    startIteration,
    sequenceDuration,
  };
}
