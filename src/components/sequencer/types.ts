// Generic grid state type derived from sample map
// Now stores velocity per hit (0 = off, 128/255 = on)
export type GridState<K extends string> = Record<K, number[]>;

// Default track velocities
export const DEFAULT_TRACK_VELOCITIES: Record<string, number> = {
  kick: 1.0,
  snare: 1.0,
  hat: 0.3,
  clap: 0.3,
} as const;

// Step count constant (parameterizable later)
export const STEP_COUNT = 16;
