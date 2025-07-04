import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { Knob } from './Knob';

const meta = {
  title: 'Components/Knob',
  component: Knob,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A customizable rotary knob control for audio parameters. Features mouse drag, keyboard navigation, and text input.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    min: {
      control: { type: 'number' },
      description: 'Minimum value of the knob',
    },
    max: {
      control: { type: 'number' },
      description: 'Maximum value of the knob',
    },
    value: {
      control: { type: 'number' },
      description: 'Current value of the knob',
    },
    step: {
      control: { type: 'number' },
      description: 'Step increment for value changes',
    },
    precision: {
      control: { type: 'number', min: 0, max: 5 },
      description: 'Decimal precision for the value',
    },
    size: {
      control: { type: 'range', min: 30, max: 120, step: 10 },
      description: 'Size of the knob in pixels',
    },
    label: {
      control: { type: 'text' },
      description: 'Optional text label for the knob',
    },
  },
} satisfies Meta<typeof Knob>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic knob with default settings
export const Default: Story = {
  args: {
    min: 0,
    max: 100,
    value: 50,
    label: 'Volume',
    onChange: () => {},
  },
};

// Interactive knob that updates its value
export const Interactive: Story = {
  args: {
    min: 0,
    max: 100,
    value: 25,
    label: 'Gain',
    step: 1,
    precision: 0,
    onChange: () => {},
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    
    return (
      <div>
        <Knob {...args} value={value} onChange={setValue} />
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#ccc' }}>
          Current value: {value}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive knob that responds to mouse drag, keyboard input, and text field changes.',
      },
    },
  },
};

// Frequency knob with floating point precision
export const FrequencyKnob: Story = {
  args: {
    min: 20,
    max: 20000,
    value: 440,
    label: 'Frequency',
    step: 1,
    precision: 1,
    size: 80,
    onChange: () => {},
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    
    return (
      <div>
        <Knob {...args} value={value} onChange={setValue} />
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#ccc' }}>
          Frequency: {value.toFixed(1)} Hz
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Frequency control with logarithmic-style range and decimal precision.',
      },
    },
  },
};

// BPM knob with typical range
export const BPMKnob: Story = {
  args: {
    min: 60,
    max: 200,
    value: 120,
    label: 'BPM',
    step: 1,
    precision: 0,
    size: 70,
    onChange: () => {},
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    
    return (
      <div>
        <Knob {...args} value={value} onChange={setValue} />
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#ccc' }}>
          Tempo: {value} BPM
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'BPM control with typical tempo range for music production.',
      },
    },
  },
};

// Fine control knob with decimal precision
export const FineControl: Story = {
  args: {
    min: -1,
    max: 1,
    value: 0,
    label: 'Pan',
    step: 0.01,
    precision: 2,
    size: 60,
    onChange: () => {},
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    
    return (
      <div>
        <Knob {...args} value={value} onChange={setValue} />
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#ccc' }}>
          Pan: {value > 0 ? 'R' : value < 0 ? 'L' : 'C'} {Math.abs(value).toFixed(2)}
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Fine control knob with small steps and high precision for subtle adjustments.',
      },
    },
  },
};

// Size variations demonstration
export const SizeVariations: Story = {
  args: {
    min: 0,
    max: 100,
    value: 50,
    onChange: () => {},
  },
  render: () => {
    const [value1, setValue1] = useState(25);
    const [value2, setValue2] = useState(50);
    const [value3, setValue3] = useState(75);
    
    return (
      <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        <Knob
          min={0}
          max={100}
          value={value1}
          onChange={setValue1}
          label="Small"
          size={40}
        />
        <Knob
          min={0}
          max={100}
          value={value2}
          onChange={setValue2}
          label="Medium"
          size={60}
        />
        <Knob
          min={0}
          max={100}
          value={value3}
          onChange={setValue3}
          label="Large"
          size={90}
        />
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstration of different knob sizes (40px, 60px, 90px).',
      },
    },
  },
};

// Accessibility features demonstration
export const AccessibilityFeatures: Story = {
  args: {
    min: 0,
    max: 10,
    value: 5,
    label: 'Master Volume',
    step: 0.1,
    precision: 1,
    size: 70,
    ariaDescribedBy: 'volume-description',
    onChange: () => {},
  },
  render: (args) => {
    const [value, setValue] = useState(args.value);
    
    return (
      <div>
        <div id="volume-description" style={{ marginBottom: '10px', fontSize: '12px', color: '#aaa' }}>
          Use arrow keys for fine control, Page Up/Down for coarse control
        </div>
        <Knob {...args} value={value} onChange={setValue} />
        <div style={{ marginTop: '20px', fontSize: '14px', color: '#ccc' }}>
          <strong>Keyboard controls:</strong><br />
          ↑/↓ Arrow keys: ±{args.step}<br />
          Page Up/Down: ±{(args.step || 1) * 10}<br />
          Home/End: Min/Max values
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Demonstrates accessibility features including ARIA labels, keyboard navigation, and screen reader support.',
      },
    },
  },
};

// Edge cases and validation
export const EdgeCases: Story = {
  args: {
    min: 0,
    max: 100,
    value: 50,
    onChange: () => {},
  },
  render: () => {
    const [value1, setValue1] = useState(0);
    const [value2, setValue2] = useState(100);
    const [value3, setValue3] = useState(-50);
    
    return (
      <div style={{ display: 'flex', gap: '30px', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <Knob
            min={0}
            max={0}
            value={value1}
            onChange={setValue1}
            label="Zero Range"
          />
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>
            Min = Max = 0
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Knob
            min={100}
            max={100}
            value={value2}
            onChange={setValue2}
            label="Single Value"
          />
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>
            Min = Max = 100
          </div>
        </div>
        <div style={{ textAlign: 'center' }}>
          <Knob
            min={-100}
            max={0}
            value={value3}
            onChange={setValue3}
            label="Negative Range"
          />
          <div style={{ fontSize: '12px', color: '#aaa', marginTop: '5px' }}>
            Range: -100 to 0
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge cases including zero range, single value, and negative ranges.',
      },
    },
  },
};
