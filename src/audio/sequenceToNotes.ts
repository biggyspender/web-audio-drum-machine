import { pipeInto } from "ts-functional-pipe";
import { flatMap, map } from "ts-iterable-functions";
import type { PlaySample } from "./PlaySample";
import type { Sequence } from "./Sequence";

export function sequenceToNotes<K extends string>(
  sequence: Sequence<K>
): Iterable<PlaySampleWithSlotIndex<K>> {
  return pipeInto(
    sequence.notes,
    flatMap((playSample, slotIdx) =>
      pipeInto(
        playSample,
        map((ps) => ({ ...ps, slotIndex: slotIdx }))
      )
    )
  );
}
type PlaySampleWithSlotIndex<K extends string> = PlaySample<K> & {
  slotIndex: number;
};
