import { createOutputEffectsChain } from "./createOutputEffectsChain";
import { getSequencerClock } from "./getSequencerClock/getSequencerClock";
import { sampleMapToAudioBufferMap } from "./sampleMapToAudioBufferMap";
import { createSource } from "./createSource";
import type { SequencerClock } from "./getSequencerClock/types/SequencerClock";
import type { StepData } from "./getSequencerClock/types/StepData";
import type { Sequence } from "./Sequence";
import type { SampleMap } from "./SampleMap";

/**
 * Playback state as string union (following convention #2)
 */
type PlaybackState = "stopped" | "playing" | "paused";

/**
 * Pipeline-specific event types for event-driven state (following convention #3)
 */
type PipelineEvents = {
  "playback-state-changed": { state: PlaybackState };
  "step-updated": StepData;
};

/**
 * Event bus implementation for pipeline communication
 * (Following convention #3 - event-driven state management)
 */
function createEventBus<EventMap>() {
  type Listener<T> = (data: T) => void;
  const listeners: Map<string, Set<(data: unknown) => void>> = new Map();

  return {
    subscribe<K extends keyof EventMap>(
      event: K,
      listener: Listener<EventMap[K]>
    ) {
      const eventKey = String(event);
      if (!listeners.has(eventKey)) {
        listeners.set(eventKey, new Set());
      }
      listeners.get(eventKey)!.add(listener as (data: unknown) => void);

      return () => {
        const eventListeners = listeners.get(eventKey);
        if (eventListeners) {
          eventListeners.delete(listener as (data: unknown) => void);
        }
      };
    },

    emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
      const eventKey = String(event);
      const eventListeners = listeners.get(eventKey);
      if (eventListeners) {
        eventListeners.forEach((listener) => listener(data));
      }
    },
  };
}

/**
 * Factory function that creates a persistent audio pipeline
 * Following project conventions: factory functions over classes (convention #1)
 */
export async function createPersistentAudioPipeline<K extends string>(
  audioContext: AudioContext,
  sampleMap: SampleMap<K>,
  reverbImpulse: ArrayBuffer,
  destination: AudioDestinationNode = audioContext.destination
) {
  // Private state in closure (following convention #1)
  let effectsChain: ReturnType<typeof createOutputEffectsChain> | null = null;
  let clock: SequencerClock | null = null;
  let clockStepListener: ((stepData: StepData) => void) | null = null; // Track our listener
  let audioBufferMap: Record<K, AudioBuffer> | null = null; // Persistent AudioBufferMap
  let isInitialized = false;
  let currentSequence: (() => Sequence<K>) | null = null;
  let stepCallback: ((stepData: StepData) => void) | null = null;
  let playbackState: PlaybackState = "stopped"; // String union (convention #2)

  // Event bus for state updates (following convention #3)
  const eventBus = createEventBus<PipelineEvents>();

  /**
   * Initialize persistent effects chain (only called once)
   * Pure function approach - no side effects outside of necessary audio setup
   */
  const ensureInitialized = async (): Promise<void> => {
    if (isInitialized) return;

    // Create persistent AudioBufferMap once (major performance improvement)
    audioBufferMap = await sampleMapToAudioBufferMap(audioContext, sampleMap);
    const impulse = await audioContext.decodeAudioData(reverbImpulse.slice(0));
    // Create persistent effects chain with safe fallback
    effectsChain = createOutputEffectsChain(audioContext, impulse);
    effectsChain.echoLevel.value = 0.2;
    effectsChain.echoFeedback.value = 0.3;
    effectsChain.connect(destination);

    // Create persistent sequencer clock
    clock = getSequencerClock(audioContext);
    await clock.init();

    isInitialized = true;
  };
  await ensureInitialized();
  /**
   * Play notes for a specific step (reuse existing logic)
   * Pure function - takes inputs, produces audio output, no mutation
   */
  const playNotesForStep = async (stepData: StepData): Promise<void> => {
    // Type guard: ensure all required components are available
    if (!currentSequence || !effectsChain || !audioBufferMap) {
      return;
    }

    // Now TypeScript knows these are non-null
    const safeEffectsChain = effectsChain;
    const safeAudioBufferMap = audioBufferMap;

    const { time, stepIndex, subdivisions, beatIndex, beatsPerBar, barIndex } =
      stepData;
    const sequenceData = currentSequence();
    const { notes, bpm, timeSignature } = sequenceData;
    effectsChain.echoDelayTime.value = (60 * 2) / (bpm * timeSignature[1]);

    // Reuse existing note playing logic from playSequence.ts
    const notesIndex =
      (barIndex * beatsPerBar + beatIndex) * subdivisions + stepIndex;
    const notesToPlay = notes[notesIndex] || [];

    if (notesToPlay.length > 0) {
      // Apply swing using existing function pattern from playSequence.ts
      const swingOffset = getSwingOffsetForStep(
        stepData,
        sequenceData,
        bpm,
        subdivisions
      );

      notesToPlay.forEach((note) => {
        const node = createSource({
          audioContext,
          audioBufferMap: safeAudioBufferMap,
          playSample: note,
          destination: safeEffectsChain.input,
        });

        const startTime = time + 0.03; // Standard audio scheduling offset
        const acTime = audioContext.currentTime;
        const diff = startTime - acTime;
        if (diff < 0) {
          console.warn(`Trying to start a note in the past: ${diff}`, {
            startTime,
            acTime,
            stepData,
          });
        }

        node.start(startTime + swingOffset);
      });
    }
  };

  /**
   * Helper function: Apply swing offset (extracted from playSequence.ts)
   */
  const getSwingOffsetForStep = (
    stepData: StepData,
    sequenceData: Sequence<K>,
    bpm: number,
    subdivisions: number
  ): number => {
    if (stepData.stepIndex % 2 === 0) {
      return 0;
    }
    const swingValue = clamp(sequenceData.swing, 0.5, 1);
    const normalizedSwingValue = (swingValue - 0.5) * 2;
    const stepDuration = 60 / (bpm * subdivisions);
    return normalizedSwingValue * stepDuration;
  };

  /**
   * Helper function: Clamp value to range (extracted from playSequence.ts)
   */
  const clamp = (value: number, min: number, max: number): number => {
    return Math.min(Math.max(value, min), max);
  };

  /**
   * Update playback state and emit event (following convention #3)
   */
  const updatePlaybackState = (newState: PlaybackState): void => {
    if (playbackState !== newState) {
      playbackState = newState;
      eventBus.emit("playback-state-changed", { state: newState });
    }
  };

  // Return object implementing explicit interface (following convention #7)
  return {
    /**
     * Start playback with new sequence (effects chain persists)
     */
    async play(
      sequence: () => Sequence<K>,
      onStep?: (stepData: StepData) => void
    ): Promise<void> {
      // Stop current playback if running
      if (clock?.getProcessorState) {
        const state = await clock.getProcessorState();
        if (state?.running) {
          clock.stop();
        }
      }

      // Clear all existing listeners using our new method
      if (clock) {
        clock.clearStepListeners();
      }

      // Update sequence and callback (immutable approach)
      currentSequence = sequence;
      stepCallback = onStep || null;

      // Configure clock for new sequence
      const seq = sequence();
      if (clock) {
        clock.setNumBars(seq.bars);
        clock.setBpm(seq.bpm);
      } else {
        console.error("Clock not initialized during play");
        return;
      }

      // Create and register new step listener
      clockStepListener = (stepData) => {
        // Get current sequence for real-time parameter updates
        const currentSeq = currentSequence?.();
        if (currentSeq && clock) {
          // Update BPM in real-time if it changed
          if (currentSeq.bpm !== clock.getBpm()) {
            clock.setBpm(currentSeq.bpm);
          }
        }

        // Emit step event for subscribers
        eventBus.emit("step-updated", stepData);

        // Call original callback if provided
        if (stepCallback) {
          stepCallback(stepData);
        }

        // Play notes for this step
        playNotesForStep(stepData);
      };

      // Set up step handling with event emission
      if (clock) {
        clock.onStep(clockStepListener);

        // Start playback
        clock.start();
        updatePlaybackState("playing");
      } else {
        console.error("Clock not available for step handling");
      }
    },

    /**
     * Stop playback (effects chain remains connected)
     */
    async stop(): Promise<void> {
      if (clock) {
        clock.stop();
      }
      currentSequence = null;
      stepCallback = null;
      updatePlaybackState("stopped");
    },

    /**
     * Pause playback (preserves position for resume)
     */
    async pause(): Promise<void> {
      if (clock) {
        await clock.pause();
      }
      updatePlaybackState("paused");
    },

    /**
     * Get current playback state
     */
    getPlaybackState(): PlaybackState {
      return playbackState;
    },

    /**
     * Update sequence parameters in real-time (for BPM, swing changes during playback)
     */
    updateSequence(sequence: () => Sequence<K>): void {
      if (currentSequence) {
        const oldSeq = currentSequence();
        const newSeq = sequence();

        // Update the sequence reference
        currentSequence = sequence;

        // Update clock parameters if they changed and clock is available
        if (clock) {
          if (oldSeq.bpm !== newSeq.bpm) {
            clock.setBpm(newSeq.bpm);
          }
          if (oldSeq.bars !== newSeq.bars) {
            clock.setNumBars(newSeq.bars);
          }
        }
      }
    },

    /**
     * Subscribe to pipeline events (following convention #3)
     */
    subscribe<EventKey extends keyof PipelineEvents>(
      event: EventKey,
      listener: (data: PipelineEvents[EventKey]) => void
    ): () => void {
      return eventBus.subscribe(event, listener);
    },

    /**
     * Reset playhead to beginning while maintaining playback state
     */
    async resetToStart(): Promise<void> {
      if (clock) {
        const wasPlaying = playbackState === "playing";

        // Reset the clock position
        await clock.reset();

        // If it was playing, restart from beginning
        if (wasPlaying && currentSequence) {
          await clock.start();
        }
      }
    },

    /**
     * Set echo level parameter
     */
    setEchoLevel(value: number): void {
      if (effectsChain) {
        effectsChain.echoLevel.value = value;
      }
    },

    /**
     * Set reverb level parameter
     */
    setReverbLevel(value: number): void {
      if (effectsChain) {
        effectsChain.reverbLevel.value = value;
      }
    },

    /**
     * Full cleanup (call when component unmounts)
     */
    dispose(): void {
      if (playbackState !== "stopped") {
        clock?.stop();
      }

      // Remove our step listener
      if (clockStepListener && clock) {
        clock.offStep(clockStepListener);
        clockStepListener = null;
      }

      if (effectsChain) {
        effectsChain.disconnect();
        effectsChain = null;
      }

      if (clock) {
        clock.dispose();
        clock = null;
      }

      // Clear persistent audio buffer map
      audioBufferMap = null;

      currentSequence = null;
      stepCallback = null;
      isInitialized = false;
      updatePlaybackState("stopped");
    },
  };
}
