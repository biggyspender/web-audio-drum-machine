import { pipeInto } from "ts-functional-pipe";
import { filter, flatMap, map, range } from "ts-iterable-functions";
import { createIndexedPlaySamples } from "./createIndexedPlaySamples";
import type { PlaySample } from "./PlaySample";
import type { Sequence } from "./Sequence";
import { createSeededRNG } from "./rng";
import { humanizePlaySample } from "./humanizePlaySample";
import { applySwing } from "./applySwing";
import { calculatePlaybackMetrics } from "./calculatePlaybackMetrics";

/**
 * Returns play samples that should be played within the specified time range
 * @param sequence The sequence to get play samples from
 * @param segmentStart The start time in seconds
 * @param segmentDuration The duration in seconds
 * @param startTime The absolute start time of the AudioContext in seconds
 * @returns An array of play samples with their scheduled start times
 */

export function getPlaySamplesInRange<K extends string>({
  sequence,
  segmentStart,
  segmentDuration,
  rng = createSeededRNG(0),
  startTime = 0,
}: {
  sequence: Sequence<K>;
  segmentStart: number;
  segmentDuration: number;
  rng?: (index: number) => number;
  startTime?: number;
}): Iterable<{ playSample: PlaySample<K>; time: number }> {
  // Calculate timing information
  const {
    slotDuration,
    beatDuration,
    swingValue,
    startIteration,
    sequenceDuration,
  } = calculatePlaybackMetrics<K>(sequence, segmentStart, startTime);
  // Get the base timed play samples for a single iteration
  const indexedPlaySamples = createIndexedPlaySamples(sequence);

  return pipeInto(
    indexedPlaySamples,
    map(({ playSample, slotIndex }) => {
      // Apply swing to even-numbered 16th notes
      return applySwing<K>(
        slotIndex,
        slotDuration,
        sequence,
        beatDuration,
        swingValue,
        playSample
      );
    }),
    map((v) => humanizePlaySample(v, sequence, rng, startIteration)),
    (v) => {
      // Calculate the end time
      const endTime = segmentStart + segmentDuration;
      // Calculate relative end time
      const relativeEndTime = endTime - startTime;
      // Calculate how many iterations we need to cover up to the end time
      const endIteration = Math.ceil(relativeEndTime / sequenceDuration);

      return pipeInto(
        range(startIteration, endIteration - startIteration + 1),
        flatMap((iteration) => {
          const iterationOffset = iteration * sequenceDuration + startTime;
          return pipeInto(
            v,
            filter((sample) => {
              const sampleTime = sample.time + iterationOffset;
              return sampleTime >= segmentStart && sampleTime < endTime;
            }),
            map((sample) => {
              return {
                playSample: sample.playSample,
                time: sample.time + iterationOffset,
              };
            })
          );
        })
      );
    }
  );
}
