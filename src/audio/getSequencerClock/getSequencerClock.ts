// Enhanced main thread wrapper with Comlink support
import * as Comlink from "comlink";
import type { SequencerProcessorInterface } from "./types/SequencerProcessorInterface";
import type { ProcessorState } from "./types/ProcessorState";
import type { SequencerClock } from "./types/SequencerClock";
import type { StepData } from "./types/StepData";
import processorUrl from "./SequencerClockProcessor.worklet.ts?worker&url";

export function getSequencerClock(
  audioContext: AudioContext,
  beatsPerBar: number = 4,
  numBars: number = 1,
  subdivisions: number = 4
): SequencerClock {
  // Core properties
  let clockNode: AudioWorkletNode | null = null;
  let processorProxy: Comlink.Remote<SequencerProcessorInterface> | null = null;

  // Sequence parameters
  let currentBeatsPerBar: number = beatsPerBar;
  let currentNumBars: number = numBars;
  let currentSubdivisions: number = subdivisions;

  // Event listeners
  const stepListeners: Set<(stepData: StepData) => void> = new Set();

  // Set up step event callbacks
  const setupStepEvents = async (): Promise<void> => {
    if (!processorProxy) return;

    // Create a Comlink proxy function for step events
    const stepHandler = Comlink.proxy((stepData: StepData) => {
      // Notify all listeners
      for (const callback of stepListeners) {
        try {
          callback(stepData);
        } catch (error) {
          console.error("Error in beat listener:", error);
        }
      }
    });

    // Register with processor
    await processorProxy.onStep(stepHandler);
  };

  // Get current BPM
  const getBpm = (): number => {
    if (!clockNode) return 120;

    const bpmParam = clockNode.parameters.get("bpm");
    return bpmParam ? bpmParam.value : 120;
  };

  // Initialize the clock with Comlink using MessageChannel
  const init = async (): Promise<boolean> => {
    try {
      while (!clockNode) {
        // Create the node
        try {
          clockNode = new AudioWorkletNode(audioContext, "sequencer-clock", {
            numberOfInputs: 0,
            numberOfOutputs: 1,
            outputChannelCount: [1],
          });
        } catch {
          // Load the processor using Vite's module URL syntax
          await audioContext.audioWorklet.addModule(processorUrl);
        }
      }

      // Connect to destination to keep the audio thread active
      clockNode.connect(audioContext.destination);

      // Create a dedicated MessageChannel for Comlink communication
      const messageChannel = new MessageChannel();

      // Send one end of the channel to the processor
      clockNode.port.postMessage(
        { type: "connect", port: messageChannel.port2 },
        [messageChannel.port2]
      );

      // Use the other end with Comlink
      processorProxy = Comlink.wrap<SequencerProcessorInterface>(
        messageChannel.port1
      );

      // Set up Comlink-based beat event handling
      await setupStepEvents();

      console.log(
        "AudioWorklet clock initialized with Comlink via MessageChannel"
      );
      return true;
    } catch (error) {
      console.error("Failed to initialize AudioWorklet clock:", error);
      return false;
    }
  };

  // Calculate steps per bar based on beats per bar and subdivisions
  const calculateStepsPerBar = (): number => {
    return currentBeatsPerBar * currentSubdivisions;
  };

  // Return the public interface
  return {
    // Core initialization and cleanup
    init,

    dispose: () => {
      if (clockNode) {
        clockNode.disconnect(audioContext.destination);
        clockNode.port.close();
        clockNode = null;
      }
      stepListeners.clear();
      processorProxy = null;
    },

    // Clock controls
    start: async (): Promise<void> => {
      if (!processorProxy) {
        console.error("Clock not initialized");
        return;
      }

      try {
        await processorProxy.start(audioContext.currentTime);
      } catch (error) {
        console.error("Error starting clock:", error);
      }
    },

    stop: async (): Promise<void> => {
      if (!processorProxy) return;

      try {
        await processorProxy.stop();
      } catch (error) {
        console.error("Error stopping clock:", error);
      }
    },

    pause: async (): Promise<void> => {
      if (!processorProxy) return;

      try {
        await processorProxy.pause();
      } catch (error) {
        console.error("Error pausing clock:", error);
      }
    },

    reset: async (): Promise<void> => {
      if (!processorProxy) return;

      try {
        await processorProxy.reset();
      } catch (error) {
        console.error("Error resetting clock:", error);
      }
    },

    // State and configuration
    getProcessorState: async (): Promise<ProcessorState | null> => {
      if (!processorProxy) return null;

      try {
        return await processorProxy.getState();
      } catch (error) {
        console.error("Error getting processor state:", error);
        return null;
      }
    },

    setBpm: (bpm: number): void => {
      if (!clockNode) return;

      const bpmParam = clockNode.parameters.get("bpm");
      if (bpmParam) {
        bpmParam.setValueAtTime(bpm, audioContext.currentTime);
      }
    },

    getBpm,

    setBeatsPerBar: (beats: number): void => {
      currentBeatsPerBar = beats;
      if (processorProxy) {
        processorProxy.setBeatsPerBar(beats).catch((error) => {
          console.error("Error setting beats per bar:", error);
        });
      }
    },

    getBeatsPerBar: (): number => {
      return currentBeatsPerBar;
    },

    setNumBars: (bars: number): void => {
      currentNumBars = bars;
      if (processorProxy) {
        processorProxy.setNumBars(bars).catch((error) => {
          console.error("Error setting number of bars:", error);
        });
      }
    },

    getNumBars: (): number => {
      return currentNumBars;
    },

    setSubdivisions: (subdivs: number): void => {
      currentSubdivisions = subdivs;
      if (processorProxy) {
        processorProxy.setSubdivisions(subdivs).catch((error) => {
          console.error("Error setting subdivisions:", error);
        });
      }
    },

    getSubdivisions: (): number => {
      return currentSubdivisions;
    },

    getStepsPerBar: (): number => {
      return calculateStepsPerBar();
    },

    // Event handling
    onStep: (callback: (stepData: StepData) => void): void => {
      stepListeners.add(callback);
    },

    offStep: (callback: (stepData: StepData) => void): void => {
      stepListeners.delete(callback);
    },

    clearStepListeners: (): void => {
      stepListeners.clear();
    },
  };
}
