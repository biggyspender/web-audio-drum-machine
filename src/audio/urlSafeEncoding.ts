/**
 * URL-safe pattern encoding for clean route-based URLs
 * 
 * Converts base64 pattern encoding to URL-safe format by replacing:
 * + → -, / → _, = → ~
 * 
 * This avoids the need for percent-encoding while maintaining readability
 * and ensuring all characters are valid in URL path segments.
 */

import { encodePatternToBase64, decodePatternFromBase64 } from '../components/sequencer/patternEncoding';

interface ShareableState {
  bpm: number;
  swing: number;
  echoLevel: number;
  reverbLevel: number;
  kit: string;
  grid: Record<string, number[]>; // velocity per step (0, 128, 255)
}

/**
 * Convert base64 pattern encoding to URL-safe format
 * 
 * Character mapping:
 * - + → - (plus to hyphen)
 * - / → _ (slash to underscore) 
 * - = → ~ (equals to tilde)
 * 
 * @param pattern - Complete drum pattern state
 * @returns URL-safe encoded string containing only A-Za-z0-9-_~
 */
export function encodePatternToUrlSafe(pattern: ShareableState): string {
  const base64 = encodePatternToBase64(pattern);
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_') 
    .replace(/=/g, '~');
}

/**
 * Convert URL-safe pattern back to ShareableState
 * 
 * Reverses the character mapping:
 * - - → + (hyphen to plus)
 * - _ → / (underscore to slash)
 * - ~ → = (tilde to equals)
 * 
 * @param encoded - URL-safe encoded pattern string
 * @returns Decoded pattern state or null if invalid
 */
export function decodePatternFromUrlSafe(encoded: string): ShareableState | null {
  try {
    // Validate URL-safe character set first
    if (!isValidUrlSafePattern(encoded)) {
      return null;
    }
    
    // Convert back to standard base64
    const base64 = encoded
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .replace(/~/g, '=');
    
    // Use existing base64 decoder
    return decodePatternFromBase64(base64);
  } catch (error) {
    console.warn('Invalid URL-safe pattern:', error);
    return null;
  }
}

/**
 * Validate that a string contains only URL-safe pattern characters
 * 
 * Valid characters: A-Z, a-z, 0-9, -, _, ~
 * Must be non-empty string
 * 
 * @param encoded - String to validate
 * @returns true if string is valid URL-safe pattern format
 */
export function isValidUrlSafePattern(encoded: string): boolean {
  return /^[A-Za-z0-9\-_~]+$/.test(encoded) && encoded.length > 0;
}

/**
 * Get the URL-safe character set as a string for documentation/validation
 * @returns String containing all valid URL-safe pattern characters
 */
export function getUrlSafeCharacterSet(): string {
  return 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_~';
}

/**
 * Character mapping configuration for URL-safe encoding
 * Exported for testing and documentation purposes
 */
export const URL_SAFE_MAPPING = {
  encode: { '+': '-', '/': '_', '=': '~' },
  decode: { '-': '+', '_': '/', '~': '=' }
} as const;
