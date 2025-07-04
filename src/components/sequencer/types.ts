// Generic grid state type derived from sample map
export type GridState<K extends string> = Record<K, boolean[]>;

// Default track velocities
export const DEFAULT_TRACK_VELOCITIES: Record<string, number> = {
  kick: 1.0,
  snare: 1.0,
  hat: 0.3,
  clap: 0.3,
} as const;

// Step count constant (parameterizable later)
export const STEP_COUNT = 16;
