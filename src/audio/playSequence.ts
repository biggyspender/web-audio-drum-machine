import type { Sequence } from "./Sequence";
import { sampleMapToAudioBufferMap } from "./sampleMapToAudioBufferMap";
import { createOutputEffectsChain } from "./createOutputEffectsChain";
import type { SampleMap } from "./SampleMap";
import { getSequencerClock } from "./getSequencerClock";
import { createSource } from "./createSource";
import type { StepData } from "./getSequencerClock/types/StepData";

export async function playSequence<K extends string>(
  sequence: () => Sequence<K>,
  sampleMap: SampleMap<K>,
  audioContext: AudioContext,
  destination: AudioDestinationNode = audioContext.destination,
  reverbImpulse: ArrayBuffer,
  signal?: AbortSignal,
  onStep?: (stepData: StepData) => void
) {
  const seq = sequence();
  const impulse = await audioContext.decodeAudioData(reverbImpulse.slice(0));
  const effectsChain = createOutputEffectsChain(audioContext, impulse);
  effectsChain.echoDelayTime.value = (1 * 60) / (seq.bpm * seq.timeSignature[1]);
  effectsChain.connect(destination);

  const audioBufferMap = await sampleMapToAudioBufferMap(
    audioContext,
    sampleMap
  );
  const clock = getSequencerClock(audioContext);
  await clock.init();
  clock.setNumBars(sequence().bars);
  clock.onStep((stepData) => {
    //console.log(stepData);

    // Call the optional step callback for playhead tracking
    if (onStep) {
      onStep(stepData);
    }

    const { time, stepIndex, subdivisions, beatIndex, beatsPerBar, barIndex } =
      stepData;
    const sequenceData = sequence();

    const { notes, bpm } = sequenceData;
    clock.setBpm(bpm);

    const notesIndex =
      (barIndex * beatsPerBar + beatIndex) * subdivisions + stepIndex;
    const notesToPlay = notes[notesIndex] || [];
    if (notesToPlay.length > 0) {
      const swingOffset = getSwingOffsetForStep<K>(
        stepData,
        sequenceData,
        bpm,
        subdivisions
      );

      notesToPlay.forEach((note) => {
        const node = createSource({
          audioContext,
          audioBufferMap,
          playSample: note,
          destination: effectsChain.input,
        });
        const startTime = time + 0.02;
        const acTime = audioContext.currentTime;
        const diff = startTime - acTime;
        if (diff < 0) {
          console.warn(`Trying to start a note in the past: ${diff}`);
        }

        node.start(startTime + swingOffset);
      });
    }
  });
  const abortHandler = () => {
    if (signal) {
      signal.removeEventListener("abort", abortHandler);
    }
    console.log("Aborting playSequence...");
    clock.stop();
    effectsChain.disconnect();
    clock.dispose();
  };

  if (signal) {
    signal.addEventListener("abort", abortHandler);
  }

  clock.start();
}
function getSwingOffsetForStep<K extends string>(
  stepData: StepData,
  sequenceData: Sequence<K>,
  bpm: number,
  subdivisions: number
) {
  if (stepData.stepIndex % 2 === 0) {
    return 0;
  }
  const swingValue = clamp(sequenceData.swing, 0.5, 1);
  const normalizedSwingValue = (swingValue - 0.5) * 2;
  const stepDuration = 60 / (bpm * subdivisions);
  return normalizedSwingValue * stepDuration;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
