import { describe, it, expect } from "vitest";
import {
  encodePatternToBase64,
  decodePatternFromBase64,
} from "./patternEncoding";

describe("Binary Pattern Encoding", () => {
  const mockShareableState = {
    bpm: 120,
    swing: 0.55,
    echoLevel: 0.2,
    reverbLevel: 0.25,
    kit: "default",
    grid: {
      kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
      hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0],
      clap: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    },
  };

  describe("encodePatternToBase64", () => {
    it("should encode a valid pattern to base64", () => {
      const encoded = encodePatternToBase64(mockShareableState);
      expect(encoded).toBeDefined();
      expect(typeof encoded).toBe("string");
      expect(encoded.length).toBeGreaterThan(0);
    });

    it("should produce consistent output for same input", () => {
      const encoded1 = encodePatternToBase64(mockShareableState);
      const encoded2 = encodePatternToBase64(mockShareableState);
      expect(encoded1).toBe(encoded2);
    });

    it("should handle BPM boundary values", () => {
      const minBpm = { ...mockShareableState, bpm: 60 };
      const maxBpm = { ...mockShareableState, bpm: 180 };
      
      expect(() => encodePatternToBase64(minBpm)).not.toThrow();
      expect(() => encodePatternToBase64(maxBpm)).not.toThrow();
    });

    it("should clamp BPM values outside valid range", () => {
      const lowBpm = { ...mockShareableState, bpm: 30 };
      const highBpm = { ...mockShareableState, bpm: 300 };
      
      const encodedLow = encodePatternToBase64(lowBpm);
      const encodedHigh = encodePatternToBase64(highBpm);
      
      const decodedLow = decodePatternFromBase64(encodedLow);
      const decodedHigh = decodePatternFromBase64(encodedHigh);
      
      expect(decodedLow?.bpm).toBe(60);
      expect(decodedHigh?.bpm).toBe(180);
    });

    it("should handle swing boundary values", () => {
      const minSwing = { ...mockShareableState, swing: 0.5 };
      const maxSwing = { ...mockShareableState, swing: 1.0 };
      
      expect(() => encodePatternToBase64(minSwing)).not.toThrow();
      expect(() => encodePatternToBase64(maxSwing)).not.toThrow();
    });

    it("should handle empty grid", () => {
      const emptyGrid = {
        ...mockShareableState,
        grid: {
          kick: new Array(16).fill(0),
          snare: new Array(16).fill(0),
          hat: new Array(16).fill(0),
          clap: new Array(16).fill(0),
        },
      };
      
      const encoded = encodePatternToBase64(emptyGrid);
      expect(encoded).toBeDefined();
    });

    it("should handle full grid", () => {
      const fullGrid = {
        ...mockShareableState,
        grid: {
          kick: new Array(16).fill(1),
          snare: new Array(16).fill(1),
          hat: new Array(16).fill(1),
          clap: new Array(16).fill(1),
        },
      };
      
      const encoded = encodePatternToBase64(fullGrid);
      expect(encoded).toBeDefined();
    });

    it("should handle missing kit field", () => {
      const { kit: _kit, ...stateWithoutKit } = mockShareableState;
      const encoded = encodePatternToBase64(stateWithoutKit as typeof mockShareableState);
      expect(encoded).toBeDefined();
    });
  });

  describe("decodePatternFromBase64", () => {
    it("should decode a valid encoded pattern", () => {
      const encoded = encodePatternToBase64(mockShareableState);
      const decoded = decodePatternFromBase64(encoded);
      
      expect(decoded).toBeDefined();
      expect(decoded?.bpm).toBe(mockShareableState.bpm);
      expect(decoded?.kit).toBe(mockShareableState.kit);
      expect(decoded?.grid).toEqual(mockShareableState.grid);
    });

    it("should handle roundtrip encoding perfectly", () => {
      const encoded = encodePatternToBase64(mockShareableState);
      const decoded = decodePatternFromBase64(encoded);
      
      expect(decoded?.bpm).toBe(mockShareableState.bpm);
      expect(Math.abs((decoded?.swing || 0) - mockShareableState.swing)).toBeLessThan(0.01);
      expect(decoded?.kit).toBe(mockShareableState.kit);
      expect(decoded?.grid).toEqual(mockShareableState.grid);
    });

    it("should return null for invalid base64", () => {
      const decoded = decodePatternFromBase64("invalid-base64!");
      expect(decoded).toBeNull();
    });

    it("should return null for corrupted binary data", () => {
      const decoded = decodePatternFromBase64("YWJjZA=="); // "abcd" in base64
      expect(decoded).toBeNull();
    });

    it("should return null for empty string", () => {
      const decoded = decodePatternFromBase64("");
      expect(decoded).toBeNull();
    });

    it("should return null for legacy JSON format", () => {
      // Simulate legacy encoding - should not be supported in binary format
      const legacyPattern = {
        bpm: 140,
        swing: 0.6,
        grid: mockShareableState.grid,
      };
      const legacyJson = JSON.stringify(legacyPattern);
      const legacyEncoded = btoa(encodeURIComponent(legacyJson));
      
      const decoded = decodePatternFromBase64(legacyEncoded);
      expect(decoded).toBeNull(); // Legacy format not supported
    });
  });

  describe("Size Optimization", () => {
    it("should produce significantly smaller output than JSON", () => {
      const binaryEncoded = encodePatternToBase64(mockShareableState);
      
      // Legacy JSON encoding for comparison
      const jsonEncoded = btoa(encodeURIComponent(JSON.stringify(mockShareableState)));
      
      expect(binaryEncoded.length).toBeLessThan(jsonEncoded.length * 0.2); // At least 80% reduction
    });

    it("should have predictable size based on kit tracks", () => {
      const encoded = encodePatternToBase64(mockShareableState);
      // Expected: 4 bytes header + 7 bytes "default" + 4*16 bytes grid = 75 bytes → ~100 chars base64
      expect(encoded.length).toBeLessThan(120);
      expect(encoded.length).toBeGreaterThan(80);
    });
  });

  describe("Performance", () => {
    it("should encode quickly", () => {
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        encodePatternToBase64(mockShareableState);
      }
      const end = performance.now();
      const avgTime = (end - start) / 100;
      
      expect(avgTime).toBeLessThan(1); // <1ms average
    });

    it("should decode quickly", () => {
      const encoded = encodePatternToBase64(mockShareableState);
      
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        decodePatternFromBase64(encoded);
      }
      const end = performance.now();
      const avgTime = (end - start) / 100;
      
      expect(avgTime).toBeLessThan(1); // <1ms average
    });
  });

  describe("Edge Cases", () => {
    it("should handle fractional BPM values", () => {
      const fractionalBpm = { ...mockShareableState, bpm: 120.7 };
      const encoded = encodePatternToBase64(fractionalBpm);
      const decoded = decodePatternFromBase64(encoded);
      
      expect(decoded?.bpm).toBe(121); // Should round
    });

    it("should handle missing grid tracks", () => {
      const partialGrid = {
        ...mockShareableState,
        grid: { kick: new Array(16).fill(1) }, // Missing other tracks
      };
      
      const encoded = encodePatternToBase64(partialGrid);
      const decoded = decodePatternFromBase64(encoded);
      
      expect(decoded).toBeDefined();
      expect(decoded?.grid.kick).toBeDefined();
      expect(decoded?.grid.snare).toEqual(new Array(16).fill(0)); // Should fill missing
    });

    it("should handle unknown kit gracefully", () => {
      const unknownKit = { ...mockShareableState, kit: "unknown-kit" };
      const encoded = encodePatternToBase64(unknownKit);
      const decoded = decodePatternFromBase64(encoded);
      
      expect(decoded?.kit).toBe("unknown-kit"); // Preserves kit name
      expect(decoded?.grid).toBeDefined(); // Uses default track layout
    });
  });
});
