import type { ProcessorState } from "./ProcessorState";
import type { StepData } from "./StepData";

export interface SequencerClock {
  // Core initialization and cleanup
  init(): Promise<boolean>;
  dispose(): void;

  // Clock controls
  start(): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  reset(): Promise<void>;

  // State and configuration
  getProcessorState(): Promise<ProcessorState | null>;
  setBpm(bpm: number): void;
  getBpm(): number;


  // More direct pattern control methods
  setBeatsPerBar(beatsPerBar: number): void;
  getBeatsPerBar(): number;
  setNumBars(numBars: number): void;
  getNumBars(): number;
  setSubdivisions(subdivisions: number): void; // Steps per beat (typically 4 for 16th notes)
  getSubdivisions(): number;
  getStepsPerBar(): number; // Calculated as beatsPerBar * subdivisions

  // Event handling
  onStep(callback: (stepData: StepData) => void): void;
  offStep(callback: (stepData: StepData) => void): void;
  clearStepListeners(): void;
}
