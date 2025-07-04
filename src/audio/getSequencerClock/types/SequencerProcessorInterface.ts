import type { ProcessorState } from "./ProcessorState";
import type { StepData } from "./StepData";

// Define interfaces for cross-thread communication

export interface SequencerProcessorInterface {
  // State management
  getState(): ProcessorState;

  // Control methods
  start(startTime?: number): void;
  stop(): void;
  pause(): void;
  reset(): void;

  // Configuration methods
  setBeatsPerBar(beats: number): void; // New direct method
  setNumBars(numBars: number): void;
  setSubdivisions(subdivisions: number): void;

  // Event subscription (will be exposed as Comlink proxies)
  onStep: (callback: (stepData: StepData) => void) => void;
  offStep: (callback: (stepData: StepData) => void) => void;
}
