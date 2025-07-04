import { pipeInto } from "ts-functional-pipe";
import { indexed, flatMap, map } from "ts-iterable-functions";
import type { Sequence } from "./Sequence";

export const createIndexedPlaySamples = <K extends string>(
  sequence: Sequence<K>
) =>
  pipeInto(
    sequence.notes,
    indexed(),
    flatMap(([notes, index]) =>
      pipeInto(
        notes,
        map((playSample) => ({ playSample, slotIndex: index }))
      )
    )
  );
