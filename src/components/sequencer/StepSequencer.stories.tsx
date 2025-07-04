import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState, useEffect } from 'react';
import { StepSequencer } from './StepSequencer';
import type { GridState } from './types';
import type { SampleBuffer } from '../../audio/SampleBuffer';

// Mock sample data for stories
const mockSampleMap: Record<'kick' | 'snare' | 'hat', SampleBuffer<'kick' | 'snare' | 'hat'>> = {
  kick: { id: 'kick', buffer: new ArrayBuffer(0) },
  snare: { id: 'snare', buffer: new ArrayBuffer(0) },
  hat: { id: 'hat', buffer: new ArrayBuffer(0) },
};

const emptyGridState: GridState<'kick' | 'snare' | 'hat'> = {
  kick: new Array(16).fill(false),
  snare: new Array(16).fill(false),
  hat: new Array(16).fill(false),
};

const samplePatternGridState: GridState<'kick' | 'snare' | 'hat'> = {
  kick: [true, false, false, false, false, false, false, true, true, false, false, false, false, false, false, false],
  snare: [false, false, false, false, true, false, false, false, false, false, false, false, true, false, false, false],
  hat: [true, false, true, false, true, false, true, false, true, false, true, false, true, false, true, false],
};

const meta = {
  title: 'Sequencer/StepSequencer',
  component: StepSequencer,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A grid-based step sequencer component with dynamic tracks based on sample map. Features vintage drum machine aesthetic with 16 steps per track.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    sampleMap: {
      description: 'Map of sample IDs to SampleBuffer objects',
    },
    gridState: {
      description: 'Current state of the grid (which steps are active)',
    },
    onStepToggle: {
      action: 'step-toggled',
      description: 'Callback fired when a step is toggled',
    },
  },
} satisfies Meta<typeof StepSequencer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Empty grid state
export const EmptyGrid: Story = {
  args: {
    sampleMap: mockSampleMap,
    gridState: emptyGridState,
    onStepToggle: () => {},
  },
};

// Grid with sample pattern
export const WithPattern: Story = {
  args: {
    sampleMap: mockSampleMap,
    gridState: samplePatternGridState,
    onStepToggle: () => {},
  },
};

// Layout verification - check grid dimensions and spacing
export const LayoutVerification: Story = {
  args: {
    sampleMap: mockSampleMap,
    gridState: emptyGridState,
    onStepToggle: () => {},
  },
  render: (args) => (
    <div style={{ border: '1px dashed #666', padding: '20px' }}>
      <div style={{ fontSize: '12px', color: '#ccc', marginBottom: '10px' }}>
        Grid Layout: 80px label + 16×32px steps + 4px gaps
      </div>
      <StepSequencer {...args} />
      <div style={{ fontSize: '10px', color: '#666', marginTop: '10px' }}>
        Expected: 3 tracks × 16 steps, with step numbers header
      </div>
    </div>
  ),
};

// Dynamic track count verification
export const DynamicTracks: Story = {
  args: {
    sampleMap: {
      kick: { id: 'kick', buffer: new ArrayBuffer(0) },
      snare: { id: 'snare', buffer: new ArrayBuffer(0) },
    } as Record<'kick' | 'snare', SampleBuffer<'kick' | 'snare'>>,
    gridState: {
      kick: new Array(16).fill(false),
      snare: new Array(16).fill(false),
    } as GridState<'kick' | 'snare'>,
    onStepToggle: () => {},
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates how the grid adapts to different sample maps - only 2 tracks in this example.',
      },
    },
  },
};

// Playhead animation demonstration
export const PlayheadAnimation: Story = {
  args: {
    sampleMap: mockSampleMap,
    gridState: samplePatternGridState,
    onStepToggle: () => {},
  },
  render: (args) => {
    const [playheadPosition, setPlayheadPosition] = useState<number>(0);
    
    useEffect(() => {
      const interval = setInterval(() => {
        setPlayheadPosition(prev => (prev + 1) % 16);
      }, 200); // Move every 200ms for demonstration
      
      return () => clearInterval(interval);
    }, []);
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
        <div style={{ fontSize: '14px', color: '#ccc', textAlign: 'center' }}>
          Playhead Animation Demo
        </div>
        <StepSequencer {...args} playheadPosition={playheadPosition} />
        <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', maxWidth: '400px' }}>
          Current step: {playheadPosition + 1}/16<br/>
          Watch the backlight move across each column to indicate the current playback position.
          The incandescent bulb effect transitions slowly for authentic vintage feel.
        </div>
      </div>
    );
  },
};

// Static playhead positions for comparison
export const PlayheadComparison: Story = {
  args: {
    sampleMap: mockSampleMap,
    gridState: samplePatternGridState,
    onStepToggle: () => {},
  },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
      <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '8px' }}>
        Playhead Positions Comparison
      </div>
      
      {/* Step 1 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontSize: '12px', color: '#888' }}>Step 1 (Beat 1)</div>
        <StepSequencer {...args} playheadPosition={0} />
      </div>
      
      {/* Step 5 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontSize: '12px', color: '#888' }}>Step 5 (Beat 2)</div>
        <StepSequencer {...args} playheadPosition={4} />
      </div>
      
      {/* Step 9 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontSize: '12px', color: '#888' }}>Step 9 (Beat 3)</div>
        <StepSequencer {...args} playheadPosition={8} />
      </div>
      
      {/* Step 13 */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
        <div style={{ fontSize: '12px', color: '#888' }}>Step 13 (Beat 4)</div>
        <StepSequencer {...args} playheadPosition={12} />
      </div>
      
      <div style={{ fontSize: '10px', color: '#666', textAlign: 'center', maxWidth: '400px' }}>
        Shows how the backlight illuminates different columns to indicate playback position.
        Each column represents one 16th note step in the sequence.
      </div>
    </div>
  ),
};
