import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { vi, beforeAll, afterEach } from 'vitest';

// Mock window.AudioContext and related audio APIs
class MockAudioContext {
  destination = {};
  currentTime = 0;

  createGain() {
    return {
      gain: { value: 0, setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }
  
  createOscillator() {
    return {
      type: 'sine',
      frequency: { value: 440, setValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  
  createBufferSource() {
    return {
      buffer: null,
      connect: vi.fn(),
      disconnect: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
    };
  }
  
  decodeAudioData() {
    return Promise.resolve({});
  }
}

// Setup global mocks
beforeAll(() => {
  window.AudioContext = MockAudioContext as unknown as typeof AudioContext;
  vi.spyOn(window, 'fetch');
  
  // Add more audio-related mocks as needed
});

// Clean up after each test
afterEach(() => {
  cleanup();
});

// Clean up mocks after tests
afterEach(() => {
  vi.clearAllMocks();
});
