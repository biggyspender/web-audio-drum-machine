// Kit definitions for drum machine sample sets
// Each kit defines the track names and sample order for encoding

export interface KitDefinition {
  readonly name: string;
  readonly tracks: readonly string[];
}

// Registry of available drum kits
export const DRUM_KITS = {
  default: {
    name: "Default",
    tracks: ["kick", "snare", "hat", "clap"] as const,
  },
  // Future kits can be added here
  // "808": {
  //   name: "808 Kit", 
  //   tracks: ["kick808", "snare808", "hat808", "crash808", "ride808"] as const,
  // },
} as const;

export type KitName = keyof typeof DRUM_KITS;

/**
 * Get track names for a specific kit
 * @param kitName - Name of the kit
 * @returns Array of track names, falls back to default kit if unknown
 */
export function getKitTracks(kitName: string): readonly string[] {
  const kit = DRUM_KITS[kitName as KitName];
  return kit ? kit.tracks : DRUM_KITS.default.tracks;
}

/**
 * Get kit definition by name
 * @param kitName - Name of the kit
 * @returns Kit definition, falls back to default if unknown
 */
export function getKitDefinition(kitName: string): KitDefinition {
  const kit = DRUM_KITS[kitName as KitName];
  return kit || DRUM_KITS.default;
}

/**
 * Validate if a kit name exists
 * @param kitName - Name to validate
 * @returns True if kit exists
 */
export function isValidKitName(kitName: string): kitName is KitName {
  return kitName in DRUM_KITS;
}

/**
 * Get all available kit names
 * @returns Array of all kit names
 */
export function getAvailableKits(): KitName[] {
  return Object.keys(DRUM_KITS) as KitName[];
}
