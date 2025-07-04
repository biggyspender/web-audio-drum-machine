export interface ProcessorState {
    running: boolean;
    beatCount: number;    // Global beat counter (increments every subdivisions steps)
    stepCount: number;    // Global step counter (increments each subdivision)
    nextEventTime: number; // Time of the next subdivision event
    bpm: number;
    beatsPerBar: number; // Number of beats in each bar
    numBars: number;     // Number of bars in the pattern
    subdivisions: number; // Steps per beat
}
