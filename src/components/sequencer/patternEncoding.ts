// Binary encoding for drum patterns with velocity and kit support
// Format: BPM(1) + Swing(1) + KitNameLen(1) + KitName(N) + TrackCount(1) + GridData(TracksX16)

import { getKitTracks } from "../../audio/kits";

const STEP_COUNT = 16;
const MIN_BPM = 60;
const MAX_BPM = 180;
const MIN_SWING = 0.5;
const MAX_SWING = 1.0;

interface ShareableState {
  bpm: number;
  swing: number;
  kit: string;
  grid: Record<string, boolean[]>;
}

/**
 * Encode drum pattern to compact binary format with velocity support
 * @param pattern - Pattern state with BPM, swing, kit, and grid
 * @returns Base64-encoded binary string
 */
export function encodePatternToBase64(pattern: ShareableState): string {
  try {
    // Validate and normalize inputs
    const kitName = pattern.kit || "default";
    const tracks = getKitTracks(kitName);
    const numTracks = tracks.length;
    
    // Clamp values to valid ranges
    const bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, Math.round(pattern.bpm)));
    const swing = Math.max(MIN_SWING, Math.min(MAX_SWING, pattern.swing));
    
    // Encode kit name as UTF-8
    const kitNameBytes = new TextEncoder().encode(kitName);
    if (kitNameBytes.length > 255) {
      throw new Error(`Kit name too long: ${kitNameBytes.length} bytes`);
    }
    
    // Calculate buffer size
    const bufferSize = 4 + kitNameBytes.length + (numTracks * STEP_COUNT);
    const buffer = new ArrayBuffer(bufferSize);
    const view = new DataView(buffer);
    let offset = 0;
    
    // Encode BPM (0-120 maps to 60-180)
    view.setUint8(offset++, bpm - MIN_BPM);
    
    // Encode swing (0-255 maps to 0.5-1.0)
    view.setUint8(offset++, Math.round((swing - MIN_SWING) * 510));
    
    // Encode kit name length
    view.setUint8(offset++, kitNameBytes.length);
    
    // Encode kit name bytes
    for (let i = 0; i < kitNameBytes.length; i++) {
      view.setUint8(offset++, kitNameBytes[i]);
    }
    
    // Encode number of tracks
    view.setUint8(offset++, numTracks);
    
    // Encode grid data: 1 byte per step (0x00=false, 0xFF=true, future: 0x01-0xFE=velocity)
    for (let trackIndex = 0; trackIndex < numTracks; trackIndex++) {
      const trackName = tracks[trackIndex];
      const track = pattern.grid[trackName] || new Array(STEP_COUNT).fill(false);
      
      for (let step = 0; step < STEP_COUNT; step++) {
        view.setUint8(offset++, track[step] ? 0xFF : 0x00);
      }
    }
    
    // Convert to base64
    const bytes = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes));
  } catch (error) {
    console.error("Pattern encoding failed:", error);
    // Fallback to legacy JSON encoding for safety
    return encodeLegacyPattern(pattern);
  }
}

/**
 * Decode binary pattern from base64 string
 * @param encoded - Base64-encoded binary pattern
 * @returns Decoded pattern state or null if invalid
 */
export function decodePatternFromBase64(encoded: string): ShareableState | null {
  try {
    // Try binary format first
    const binaryResult = decodeBinaryPattern(encoded);
    if (binaryResult) {
      return binaryResult;
    }
    
    // Fallback to legacy JSON format
    return decodeLegacyPattern(encoded);
  } catch (error) {
    console.error("Pattern decoding failed:", error);
    return null;
  }
}

/**
 * Decode binary pattern format
 */
function decodeBinaryPattern(encoded: string): ShareableState | null {
  try {
    const binaryString = atob(encoded);
    
    // Basic validation - minimum size check
    if (binaryString.length < 4) {
      return null; // Too small for binary format
    }
    
    const buffer = new ArrayBuffer(binaryString.length);
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    const view = new DataView(buffer);
    let offset = 0;
    
    // Decode BPM
    const bpm = view.getUint8(offset++) + MIN_BPM;
    
    // Decode swing
    const swing = (view.getUint8(offset++) / 510) + MIN_SWING;
    
    // Decode kit name
    const kitNameLength = view.getUint8(offset++);
    if (offset + kitNameLength >= buffer.byteLength) {
      return null; // Invalid kit name length
    }
    
    const kitNameBytes = new Uint8Array(buffer, offset, kitNameLength);
    const kitName = new TextDecoder().decode(kitNameBytes);
    offset += kitNameLength;
    
    // Decode number of tracks
    if (offset >= buffer.byteLength) {
      return null; // Missing track count
    }
    const numTracks = view.getUint8(offset++);
    
    // Validate remaining buffer size
    const expectedGridSize = numTracks * STEP_COUNT;
    if (offset + expectedGridSize !== buffer.byteLength) {
      return null; // Buffer size mismatch
    }
    
    // Get track names from kit
    const tracks = getKitTracks(kitName);
    if (tracks.length !== numTracks) {
      return null; // Track count mismatch
    }
    
    // Decode grid
    const grid: Record<string, boolean[]> = {};
    for (let trackIndex = 0; trackIndex < numTracks; trackIndex++) {
      const trackName = tracks[trackIndex];
      const track: boolean[] = [];
      
      for (let step = 0; step < STEP_COUNT; step++) {
        const value = view.getUint8(offset++);
        track[step] = value === 0xFF; // 0xFF = true, 0x00 = false
      }
      
      grid[trackName] = track;
    }
    
    return { bpm, swing, kit: kitName, grid };
  } catch {
    return null;
  }
}

/**
 * Legacy JSON encoding (fallback)
 */
function encodeLegacyPattern(pattern: unknown): string {
  const json = JSON.stringify(pattern);
  return btoa(encodeURIComponent(json));
}

/**
 * Legacy JSON decoding (fallback)
 */
function decodeLegacyPattern(encoded: string): ShareableState | null {
  try {
    const json = decodeURIComponent(atob(encoded));
    const parsed = JSON.parse(json);
    
    // Ensure we have the expected structure
    if (
      parsed &&
      typeof parsed === "object" &&
      "grid" in parsed &&
      "bpm" in parsed &&
      "swing" in parsed
    ) {
      return {
        bpm: parsed.bpm,
        swing: parsed.swing,
        kit: parsed.kit || "default",
        grid: parsed.grid,
      };
    }
    
    return null;
  } catch {
    return null;
  }
}
