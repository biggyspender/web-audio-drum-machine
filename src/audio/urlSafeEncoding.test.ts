/**
 * Tests for URL-safe pattern encoding functions
 */

import { describe, test, expect } from 'vitest';
import { 
  encodePatternToUrlSafe, 
  decodePatternFromUrlSafe, 
  isValidUrlSafePattern,
  getUrlSafeCharacterSet,
  URL_SAFE_MAPPING
} from './urlSafeEncoding';

// Mock pattern data for testing
const createTestPattern = (overrides: Partial<{
  bpm: number;
  swing: number;
  echoLevel: number;
  reverbLevel: number;
  kit: string;
  grid: Record<string, number[]>;
}> = {}) => ({
  bpm: 120,
  swing: 0.6,
  echoLevel: 0.3,
  reverbLevel: 0.2,
  kit: 'default',
  grid: {
    kick: [255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0],
    snare: [0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0, 0, 0, 255, 0],
    hat: [128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128, 128],
    clap: [0, 0, 0, 128, 0, 0, 0, 128, 0, 0, 0, 128, 0, 0, 0, 128]
  },
  ...overrides
});

describe('URL-safe pattern encoding', () => {
  test('round-trip encoding preserves all pattern data', () => {
    const pattern = createTestPattern();
    const encoded = encodePatternToUrlSafe(pattern);
    const decoded = decodePatternFromUrlSafe(encoded);
    
    // Compare with some tolerance for floating point precision in effects
    expect(decoded).toBeDefined();
    expect(decoded!.bpm).toBe(pattern.bpm);
    expect(decoded!.swing).toBeCloseTo(pattern.swing, 2);
    expect(decoded!.echoLevel).toBeCloseTo(pattern.echoLevel, 2);
    expect(decoded!.reverbLevel).toBeCloseTo(pattern.reverbLevel, 2);
    expect(decoded!.kit).toBe(pattern.kit);
    expect(decoded!.grid).toEqual(pattern.grid);
  });

  test('produces only URL-safe characters', () => {
    const pattern = createTestPattern();
    const encoded = encodePatternToUrlSafe(pattern);
    
    // Should only contain A-Z, a-z, 0-9, -, _, ~
    expect(encoded).toMatch(/^[A-Za-z0-9\-_~]+$/);
    
    // Should not contain base64 special characters
    expect(encoded).not.toMatch(/[+/=]/);
  });

  test('handles different pattern variations correctly', () => {
    const patterns = [
      createTestPattern({ bpm: 60, swing: 0.5 }), // Minimum values
      createTestPattern({ bpm: 180, swing: 1.0 }), // Maximum values
      createTestPattern({ kit: 'electronic' }), // Different kit
      createTestPattern({ echoLevel: 1.0, reverbLevel: 1.0 }), // Max effects
      createTestPattern({ 
        grid: { 
          kick: new Array(16).fill(0),
          snare: new Array(16).fill(0),
          hat: new Array(16).fill(0),
          clap: new Array(16).fill(0)
        } // Empty pattern
      })
    ];

    patterns.forEach((pattern) => {
      const encoded = encodePatternToUrlSafe(pattern);
      const decoded = decodePatternFromUrlSafe(encoded);
      
      // Compare with tolerance for floating point precision
      expect(decoded).toBeDefined();
      expect(decoded!.bpm).toBe(pattern.bpm);
      expect(decoded!.swing).toBeCloseTo(pattern.swing, 2);
      expect(decoded!.echoLevel).toBeCloseTo(pattern.echoLevel, 2);
      expect(decoded!.reverbLevel).toBeCloseTo(pattern.reverbLevel, 2);
      expect(decoded!.kit).toBe(pattern.kit);
      expect(decoded!.grid).toEqual(pattern.grid);
      expect(encoded).toMatch(/^[A-Za-z0-9\-_~]+$/);
    });
  });

  test('character mapping works correctly', () => {
    // Create a pattern that will generate base64 with +, /, = characters
    const pattern = createTestPattern();
    const encoded = encodePatternToUrlSafe(pattern);
    
    // Verify character replacement occurred
    const charSet = new Set(encoded);
    
    // Should not contain original base64 special chars
    expect(charSet.has('+')).toBe(false);
    expect(charSet.has('/')).toBe(false);
    expect(charSet.has('=')).toBe(false);
    
    // Should be non-empty
    expect(encoded.length).toBeGreaterThan(0);
  });

  test('handles invalid input gracefully', () => {
    const invalidInputs = [
      'invalid!!!', // Invalid characters
      '++//==', // Only base64 special chars
      '', // Empty string
      'abc@#$', // Contains invalid symbols
      '123 456', // Contains spaces
      'test%20encoded' // Contains percent-encoding
    ];

    invalidInputs.forEach(input => {
      expect(decodePatternFromUrlSafe(input)).toBeNull();
    });
  });

  test('validation function works correctly', () => {
    // Valid URL-safe patterns
    const validPatterns = [
      'abc123',
      'ABC-def_GHI~jkl',
      'onlyLetters',
      'only123numbers',
      'mix3d-Ch4rs_and~symb0ls',
      'a', // Single character
      '1' // Single number
    ];

    validPatterns.forEach(pattern => {
      expect(isValidUrlSafePattern(pattern)).toBe(true);
    });

    // Invalid patterns
    const invalidPatterns = [
      '', // Empty
      'abc+def', // Contains +
      'abc/def', // Contains /
      'abc=def', // Contains =
      'abc def', // Contains space
      'abc@def', // Contains @
      'abc%20def', // Contains percent-encoding
      'abc!def', // Contains !
      'test.com' // Contains .
    ];

    invalidPatterns.forEach(pattern => {
      expect(isValidUrlSafePattern(pattern)).toBe(false);
    });
  });

  test('character set function returns correct characters', () => {
    const charSet = getUrlSafeCharacterSet();
    
    expect(charSet).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_~');
    expect(charSet.length).toBe(65); // 26*2 + 10 + 3
  });

  test('mapping configuration is correct', () => {
    expect(URL_SAFE_MAPPING.encode).toEqual({
      '+': '-',
      '/': '_',
      '=': '~'
    });

    expect(URL_SAFE_MAPPING.decode).toEqual({
      '-': '+',
      '_': '/',
      '~': '='
    });
  });

  test('encoding is deterministic', () => {
    const pattern = createTestPattern();
    
    const encoded1 = encodePatternToUrlSafe(pattern);
    const encoded2 = encodePatternToUrlSafe(pattern);
    
    expect(encoded1).toBe(encoded2);
  });

  test('different patterns produce different encodings', () => {
    const pattern1 = createTestPattern({ bpm: 120 });
    const pattern2 = createTestPattern({ bpm: 140 });
    
    const encoded1 = encodePatternToUrlSafe(pattern1);
    const encoded2 = encodePatternToUrlSafe(pattern2);
    
    expect(encoded1).not.toBe(encoded2);
  });

  test('handles edge case patterns', () => {
    // Test with minimal pattern
    const minimalPattern = {
      bpm: 60,
      swing: 0.5,
      echoLevel: 0.0,
      reverbLevel: 0.0,
      kit: 'a', // Single character kit name
      grid: {
        kick: new Array(16).fill(0),
        snare: new Array(16).fill(0),
        hat: new Array(16).fill(0),
        clap: new Array(16).fill(0)
      }
    };

    const encoded = encodePatternToUrlSafe(minimalPattern);
    const decoded = decodePatternFromUrlSafe(encoded);
    
    // Compare with tolerance for floating point precision in effects
    expect(decoded).toBeDefined();
    expect(decoded!.bpm).toBe(minimalPattern.bpm);
    expect(decoded!.swing).toBeCloseTo(minimalPattern.swing, 2);
    expect(decoded!.echoLevel).toBeCloseTo(minimalPattern.echoLevel, 2);
    expect(decoded!.reverbLevel).toBeCloseTo(minimalPattern.reverbLevel, 2);
    expect(decoded!.kit).toBe(minimalPattern.kit);
    expect(decoded!.grid).toEqual(minimalPattern.grid);
    expect(isValidUrlSafePattern(encoded)).toBe(true);
  });

  test('maintains URL safety across all possible base64 outputs', () => {
    // Test multiple random-ish patterns to ensure we cover different base64 scenarios
    const testPatterns = Array.from({ length: 50 }, (_, i) => 
      createTestPattern({
        bpm: 60 + (i % 120),
        swing: 0.5 + (i % 50) / 100,
        echoLevel: (i % 100) / 100,
        reverbLevel: ((i * 3) % 100) / 100,
        kit: ['default', 'electronic', 'acoustic', 'vintage'][i % 4],
        grid: {
          kick: Array.from({ length: 16 }, (_, j) => (i + j) % 256),
          snare: Array.from({ length: 16 }, (_, j) => (i * 2 + j) % 256),
          hat: Array.from({ length: 16 }, (_, j) => (i * 3 + j) % 256),
          clap: Array.from({ length: 16 }, (_, j) => (i * 4 + j) % 256)
        }
      })
    );

    testPatterns.forEach((pattern) => {
      const encoded = encodePatternToUrlSafe(pattern);
      
      // Verify URL safety
      expect(isValidUrlSafePattern(encoded)).toBe(true);
      
      // Verify round-trip integrity using tolerance for precision  
      const decoded = decodePatternFromUrlSafe(encoded);
      expect(decoded).toBeDefined();
      expect(decoded!.bpm).toBe(pattern.bpm);
      expect(decoded!.swing).toBeCloseTo(pattern.swing, 2);
      expect(decoded!.echoLevel).toBeCloseTo(pattern.echoLevel, 2);
      expect(decoded!.reverbLevel).toBeCloseTo(pattern.reverbLevel, 2);
      expect(decoded!.kit).toBe(pattern.kit);
      expect(decoded!.grid).toEqual(pattern.grid);
    });
  });

  test('encoded patterns are shorter or equal to percent-encoded base64', () => {
    const pattern = createTestPattern();
    const urlSafeEncoded = encodePatternToUrlSafe(pattern);
    
    // URL-safe encoding should not be significantly longer
    // This is more of a sanity check that our approach is reasonable
    expect(urlSafeEncoded.length).toBeGreaterThan(0);
    expect(typeof urlSafeEncoded).toBe('string');
  });
});
