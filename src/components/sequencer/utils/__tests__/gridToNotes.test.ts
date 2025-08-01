import { describe, it, expect } from 'vitest';
import { gridToNotes } from '../gridToNotes';
import type { GridState } from '../../types';
import type { SampleBuffer } from '../../../../audio/SampleBuffer';

describe('gridToNotes', () => {
  const mockSampleMap: Record<'kick' | 'snare' | 'hat', SampleBuffer<'kick' | 'snare' | 'hat'>> = {
    kick: { id: 'kick', buffer: new ArrayBuffer(0) },
    snare: { id: 'snare', buffer: new ArrayBuffer(0) },
    hat: { id: 'hat', buffer: new ArrayBuffer(0) },
  };

  it('should convert empty grid to empty notes array', () => {
    const emptyGrid: GridState<'kick' | 'snare' | 'hat'> = {
      kick: new Array(16).fill(0),
      snare: new Array(16).fill(0),
      hat: new Array(16).fill(0),
    };
    
    const result = gridToNotes(emptyGrid, mockSampleMap);
    
    expect(result).toHaveLength(16);
    result.forEach(stepSamples => {
      expect(stepSamples).toHaveLength(0);
    });
  });

  it('should convert single active step to notes', () => {
    const gridState: GridState<'kick' | 'snare' | 'hat'> = {
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      snare: new Array(16).fill(0),
      hat: new Array(16).fill(0),
    };
    
    const result = gridToNotes(gridState, mockSampleMap);
    
    // Step 0 should have kick sample
    expect(result[0]).toHaveLength(1);
    expect(result[0][0].sample).toEqual(mockSampleMap.kick);
    expect(result[0][0].velocity).toBe(1.0); // Default kick velocity
    
    // All other steps should be empty
    for (let i = 1; i < 16; i++) {
      expect(result[i]).toHaveLength(0);
    }
  });

  it('should handle multiple samples on same step', () => {
    const gridState: GridState<'kick' | 'snare' | 'hat'> = {
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      snare: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      hat: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    
    const result = gridToNotes(gridState, mockSampleMap);
    
    // Step 0 should have all three samples
    expect(result[0]).toHaveLength(3);
    
    const samples = result[0].map(playSample => playSample.sample.id);
    expect(samples).toContain('kick');
    expect(samples).toContain('snare');
    expect(samples).toContain('hat');
  });

  it('should use correct default velocities', () => {
    const gridState: GridState<'kick' | 'snare' | 'hat'> = {
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      snare: [0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
      hat: [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    
    const result = gridToNotes(gridState, mockSampleMap);
    
    // Check velocities match defaults
    expect(result[0][0].velocity).toBe(1.0); // kick
    expect(result[1][0].velocity).toBe(1.0); // snare  
    expect(result[2][0].velocity).toBe(0.3); // hat
  });

  it('should handle unknown track types with default velocity', () => {
    const customSampleMap: Record<'custom', SampleBuffer<'custom'>> = {
      custom: { id: 'custom', buffer: new ArrayBuffer(0) },
    };
    
    const gridState: GridState<'custom'> = {
      custom: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    
    const result = gridToNotes(gridState, customSampleMap);
    
    // Unknown track should use default velocity of 1.0
    expect(result[0][0].velocity).toBe(1.0);
  });

  it('should produce correct output format', () => {
    const gridState: GridState<'kick'> = {
      kick: [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    };
    
    const sampleMap: Record<'kick', SampleBuffer<'kick'>> = {
      kick: { id: 'kick', buffer: new ArrayBuffer(0) },
    };
    
    const result = gridToNotes(gridState, sampleMap);
    
    // Should be array of 16 steps
    expect(result).toHaveLength(16);
    
    // Each step should be array of PlaySample objects
    expect(Array.isArray(result[0])).toBe(true);
    
    // PlaySample should have correct structure
    expect(result[0][0]).toHaveProperty('sample');
    expect(result[0][0]).toHaveProperty('velocity');
    expect(typeof result[0][0].velocity).toBe('number');
  });
});
