export interface StepData {
  // Global counters (monotonically increasing)
  beatNumber: number; // Global beat counter (increases every subdivisions steps)
  stepNumber: number; // Global step counter (increases with each subdivision)
  
  // Timing information
  time: number; // Scheduled time of the subdivision event
  actualTime: number; // Actual time when the event was processed
  deviation: number; // Timing accuracy (actualTime - time)

  // Position indices (cyclical, all 0-indexed)
  stepIndex: number; // Position within the current beat (0 to subdivisions-1)
  beatIndex: number; // Position within the current bar (0 to beatsPerBar-1)
  barIndex: number; // Position within the pattern (0 to numBars-1)

  // Pattern configuration 
  beatsPerBar: number; // Number of beats in each bar (e.g., 4 for 4/4)
  numBars: number; // Number of bars in the pattern
  subdivisions: number; // Steps per beat (e.g., 4 for 16th notes)
}
