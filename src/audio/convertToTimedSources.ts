import { pipeInto } from "ts-functional-pipe";
import { map } from "ts-iterable-functions";
import { createSource } from "./createSource";
import type { PlaySample } from "./PlaySample";

export const convertToTimedSources = <K extends string>({
  audioContext,
  audioBufferMap,
  timedPlaySamples,
  destination,
}: ConvertToTimedSourcesOpts<K>): Iterable<{
  source: AudioBufferSourceNode;
  time: number;
}> =>
  pipeInto(
    timedPlaySamples,
    map(({ playSample: source, time }) => {
      return {
        source: createSource<K>({
          audioContext,
          audioBufferMap,
          playSample: source,
          destination,
        }),
        time,
      };
    })
  );
type ConvertToTimedSourcesOpts<K extends string> = {
  audioContext: AudioContext;
  audioBufferMap: Record<K, AudioBuffer>;
  timedPlaySamples: Iterable<{
    playSample: PlaySample<K>;
    time: number;
  }>;
  destination: AudioNode;
};
