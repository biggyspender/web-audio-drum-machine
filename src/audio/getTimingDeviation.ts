import type { PlaySample } from "./PlaySample";

/**
 * Calculates timing deviation to add humanization to audio sample playback.
 *
 * @param rng - Random number generator function that produces values based on an index
 * @param sample - Object containing the audio sample to be played and its scheduled time
 * @param iteration - Current iteration count, used to vary randomness across repeated samples
 * @param slotDuration - Duration of a time slot in seconds
 * @param humanizeTiming - Value between 0-1 that controls the amount of timing randomization
 * @returns The timing deviation in seconds (0 if humanizeTiming is 0 or negative)
 *
 * @typeParam K - Type parameter representing the key type for the PlaySample
 */

export function getTimingDeviation<K extends string>(
  rng: (index: number) => number,
  sample: { playSample: PlaySample<K>; time: number },
  iteration: number,
  slotDuration: number,
  humanizeTiming: number
) {
  if (humanizeTiming <= 0) {
    return 0; // No deviation if humanizeTiming is 0
  }
  const randomValue = rng(
    sample.time + sample.playSample.sample.buffer.byteLength * (iteration + 1)
  );

  // Calculate the maximum deviation in seconds (typically a few milliseconds)
  // Higher humanize values (0-1) create more randomness
  const maxDeviation = slotDuration * humanizeTiming; // Up to 20ms at humanize=1.0

  // Generate a value between -maxDeviation and +maxDeviation
  const deviation = randomValue * maxDeviation;
  return deviation;
}
