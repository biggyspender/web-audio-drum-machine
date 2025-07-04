import { getTimingDeviation } from "./getTimingDeviation";
import type { PlaySample } from "./PlaySample";
import type { Sequence } from "./Sequence";

/**
 * Applies humanization to a play sample by slightly varying its time
 * @param sample The sample with its scheduled time
 * @param sequence The sequence containing humanization settings
 * @param rng Random number generator function
 * @param iteration The current iteration number (used for seeding the RNG)
 * @returns The sample with humanized timing
 */
export function humanizePlaySample<K extends string>(
  sample: { playSample: PlaySample<K>; time: number },
  sequence: Sequence<K>,
  rng: (index: number) => number,
  iteration: number
): { playSample: PlaySample<K>; time: number } {
  const beatDuration = 60 / sequence.bpm;
  const slotDuration = beatDuration / sequence.timeSignature[1];
  const humanizeTiming = sequence.humanize?.timing ?? 0;
  const humanizeVelocity = sequence.humanize?.velocity ?? 0;

  if (!humanizeTiming && !humanizeVelocity) {
    return sample;
  }

  // Use the play sample's id as a seed for the RNG
  const deviation = getTimingDeviation<K>(
    rng,
    sample,
    iteration,
    slotDuration,
    humanizeTiming
  );

  const rv2 = rng(
    (sample.time + sample.playSample.sample.buffer.byteLength + 1) *
      (iteration + 1)
  );
  return {
    playSample: {
      ...sample.playSample,
      velocity: sample.playSample.velocity - rv2 * humanizeVelocity,
    },
    time: sample.time + deviation,
  };
}
