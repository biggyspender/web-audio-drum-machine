// AudioWorklet processor with Comlink support
import * as Comlink from "comlink";
import type { StepData } from "./types/StepData";
import type { SequencerProcessorInterface } from "./types/SequencerProcessorInterface";

// Create a new implementation using Comlink
class SequencerClockProcessor extends AudioWorkletProcessor {
  // Core timing state
  private running: boolean = false;
  private paused: boolean = false;
  private nextEventTime: number = 0; // Time of next subdivision event
  private stepCount: number = 0; // Count of subdivision steps (increases each subdivision)
  private beatCount: number = 0; // Track of beat number (increases every subdivision steps)
  private sampleTime: number = 1 / sampleRate;
  
  // Pause state preservation
  private pausedStepCount: number = 0;
  private pausedBeatCount: number = 0;

  // Pattern configuration
  private beatsPerBar: number = 4; // Default 4 beats per bar
  private numBars: number = 1; // Default 1 bar pattern
  private subdivisions: number = 4; // Default 4 steps per beat (16th notes)

  // Comlink communication
  private stepCallbacks: Set<(stepData: StepData) => void> = new Set(); // Renamed from beatCallbacks

  static get parameterDescriptors() {
    return [
      {
        name: "bpm",
        defaultValue: 120,
        minValue: 20,
        maxValue: 960,
        automationRate: "k-rate",
      },
    ];
  }

  constructor() {
    super();

    // Set up message port handling to receive the MessageChannel port
    this.port.onmessage = (event: MessageEvent) => {
      const { type, port } = event.data;

      if (type === "connect" && port) {
        // Use the received port for Comlink communication
        this.setupComlinkEndpoint(port);
      }
    };
  }

  // Set up Comlink on the received MessageChannel port
  private setupComlinkEndpoint(port: MessagePort) {
    const sequencerProcessorInterface: SequencerProcessorInterface = {
      start: this.start.bind(this),
      stop: this.stop.bind(this),
      pause: this.pause.bind(this),
      reset: this.reset.bind(this),

      // State access
      getState: () => {
        return {
          running: this.running,
          beatCount: this.beatCount,
          stepCount: this.stepCount,
          nextEventTime: this.nextEventTime,
          bpm: this.getBpm(),
          beatsPerBar: this.beatsPerBar,
          numBars: this.numBars,
          subdivisions: this.subdivisions,
        };
      },

      setBeatsPerBar: (beats: number) => {
        this.beatsPerBar = beats;
      },

      setNumBars: (numBars: number) => {
        this.numBars = numBars;
      },

      setSubdivisions: (subdivisions: number) => {
        this.subdivisions = subdivisions;
      },

      // Event listeners with proxy to maintain function references
      onStep: Comlink.proxy((callback: (beatData: StepData) => void) => {
        this.stepCallbacks.add(callback);
      }),

      offStep: Comlink.proxy((callback: (beatData: StepData) => void) => {
        this.stepCallbacks.delete(callback);
      }),
    };
    // Use Comlink for all communication through the dedicated port
    Comlink.expose(sequencerProcessorInterface, port);
  }

  // Core clock methods
  start(startTime: number = currentTime) {
    this.running = true;
    this.nextEventTime = startTime;
    
    // If resuming from pause, restore position; otherwise start fresh
    if (!this.paused) {
      this.stepCount = 0;
      this.beatCount = 0;
    } else {
      // Resume from paused position
      this.stepCount = this.pausedStepCount;
      this.beatCount = this.pausedBeatCount;
      this.paused = false;
    }
  }

  stop() {
    this.running = false;
    this.paused = false;
    // Reset position on stop
    this.stepCount = 0;
    this.beatCount = 0;
    this.pausedStepCount = 0;
    this.pausedBeatCount = 0;
  }

  pause() {
    if (this.running) {
      this.running = false;
      this.paused = true;
      // Preserve current position
      this.pausedStepCount = this.stepCount;
      this.pausedBeatCount = this.beatCount;
    }
  }

  reset() {
    this.stepCount = 0;
    this.beatCount = 0;
    this.pausedStepCount = 0;
    this.pausedBeatCount = 0;
    this.paused = false;
  }

  private getBpm(): number {
    // Get the current BPM from parameters
    return 120; // Default value, will be overridden by parameters
  }

  // Calculate steps per bar based on beats per bar and subdivisions
  private getStepsPerBar(): number {
    return this.beatsPerBar * this.subdivisions;
  }

  // Calculate step, beat and bar indices from beat number
  private calculateBeatInfo(beatNumber: number): {
    stepIndex: number;
    beatIndex: number;
    barIndex: number;
    beatsPerBar: number;
    numBars: number;
    subdivisions: number;
  } {
    const stepsPerBar = this.getStepsPerBar();
    const totalSteps = stepsPerBar * this.numBars;

    // Calculate global step position within entire pattern (0-based)
    const globalStep = (beatNumber * this.subdivisions) % totalSteps;

    // Calculate bar index (0-based)
    const barIndex = Math.floor(globalStep / stepsPerBar);

    // Calculate step within current bar
    const stepInBar = globalStep % stepsPerBar;

    // Calculate beat index within current bar (0-based)
    const beatIndex = Math.floor(stepInBar / this.subdivisions);

    // Calculate step index within current beat (0-based)
    const stepIndex = stepInBar % this.subdivisions;

    return {
      stepIndex,
      beatIndex,
      barIndex,
      beatsPerBar: this.beatsPerBar,
      numBars: this.numBars,
      subdivisions: this.subdivisions,
    };
  }

  // Process method handles audio block timing
  process(
    _inputs: Float32Array[][],
    _outputs: Float32Array[][],
    parameters: Record<string, Float32Array>
  ): boolean {
    // Skip processing if not running
    if (!this.running) {
      return true;
    }

    // Get the BPM value
    const bpm = parameters.bpm[0];

    // Calculate beat duration in seconds
    const beatDuration = 60 / bpm;

    // Calculate subdivision duration in seconds
    const subdivisionDuration = beatDuration / this.subdivisions;

    // Get current time (for this audio block)
    const currentBlockTime = currentTime;

    // Process each sample in the block
    for (let i = 0; i < 128; i++) {
      const currentSampleTime = currentBlockTime + i * this.sampleTime;

      // Check if we've reached the next subdivision time
      if (this.running && currentSampleTime >= this.nextEventTime) {
        // Calculate current beat (integer division)
        this.beatCount = Math.floor(this.stepCount / this.subdivisions);

        // Get step and bar information based on current step count
        const beatInfo = this.calculateBeatInfo(this.beatCount);

        // Correct stepIndex and barIndex calculations
        const beatData: StepData = {
          // Global counters (monotonically increasing)
          beatNumber: this.beatCount, // Global beat counter (increases every subdivisions steps)
          stepNumber: this.stepCount, // Global step counter (increases with each subdivision)

          // Timing information
          time: this.nextEventTime,
          actualTime: currentSampleTime,
          deviation: currentSampleTime - this.nextEventTime,

          // Position indices within pattern (cyclical, all 0-indexed)
          stepIndex: this.stepCount % this.subdivisions, // Corrected calculation for step index
          beatIndex: this.beatCount % this.beatsPerBar, // Corrected calculation for bar index
          barIndex:
            Math.floor(this.beatCount / this.beatsPerBar) % this.numBars, // Corrected calculation for bar index

          // Pattern configuration
          beatsPerBar: beatInfo.beatsPerBar,
          numBars: beatInfo.numBars,
          subdivisions: beatInfo.subdivisions,
        };

        // Notify via Comlink callbacks
        if (this.stepCallbacks.size > 0) {
          for (const callback of this.stepCallbacks) {
            try {
              callback(beatData);
            } catch (error) {
              console.error("Error in step callback:", error);
            }
          }
        }

        // Schedule next subdivision
        this.stepCount++;
        this.nextEventTime += subdivisionDuration;
      }
    }

    // Keep the processor alive
    return true;
  }
}

// Register the processor
registerProcessor("sequencer-clock", SequencerClockProcessor);
