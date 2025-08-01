import type { Meta, StoryObj } from '@storybook/react-vite';
import { useState } from 'react';
import { StepButton } from './StepButton';

const meta = {
  title: 'Sequencer/StepButton',
  component: StepButton,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'A step button component for the drum machine sequencer grid. Features vintage drum machine aesthetic with 3:2 aspect ratio for touch targets.',
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    isActive: {
      control: 'boolean',
      description: 'Whether the step is active (will trigger a sound)',
    },
    backlightIntensity: {
      control: { type: 'range', min: 0, max: 1, step: 0.1 },
      description: 'Backlight intensity (0-1) for playhead indication',
    },
    onClick: {
      action: 'clicked',
      description: 'Callback fired when the step button is clicked',
    },
  },
} satisfies Meta<typeof StepButton>;

export default meta;
type Story = StoryObj<typeof meta>;

// Default inactive state
export const Inactive: Story = {
  args: {
    type: "button",
    isActive: false,
    onClick: () => {},
  },
};

// Active state with orange glow
export const Active: Story = {
  args: {
    type: "button",
    isActive: true,
    onClick: () => {},
  },
};

// Size verification - multiple buttons to verify consistent sizing
export const SizeVerification: Story = {
  args: {
    type: "button",
    isActive: false,
    onClick: () => {},
  },
  render: (args) => (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <div style={{ fontSize: '12px', color: '#ccc' }}>32×48px:</div>
      <StepButton {...args} isActive={false} />
      <StepButton {...args} isActive={true} />
      <StepButton {...args} isActive={false} />
      <div style={{ fontSize: '10px', color: '#666', marginLeft: '8px' }}>
        Expected: 32px wide × 48px tall (3:2 ratio)
      </div>
    </div>
  ),
};

// Backlight effect demonstration
export const BacklightOff: Story = {
  args: {
    type: "button",
    isActive: false,
    backlightIntensity: 0,
    onClick: () => {},
  },
};

export const BacklightLow: Story = {
  args: {
    type: "button",
    isActive: false,
    backlightIntensity: 0.3,
    onClick: () => {},
  },
};

export const BacklightMedium: Story = {
  args: {
    type: "button",
    isActive: false,
    backlightIntensity: 0.6,
    onClick: () => {},
  },
};

export const BacklightFull: Story = {
  args: {
    type: "button",
    isActive: false,
    backlightIntensity: 1.0,
    onClick: () => {},
  },
};

// Combined active state with backlight
export const ActiveWithBacklight: Story = {
  args: {
    type: "button",
    isActive: true,
    backlightIntensity: 1.0,
    onClick: () => {},
  },
};

// Backlight intensity comparison
export const BacklightComparison: Story = {
  args: {
    type: "button",
    isActive: false,
    onClick: () => {},
  },
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', alignItems: 'center' }}>
      <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '8px' }}>
        Backlight Intensity Levels
      </div>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <StepButton {...args} backlightIntensity={0} />
          <span style={{ fontSize: '10px', color: '#666' }}>0.0</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <StepButton {...args} backlightIntensity={0.25} />
          <span style={{ fontSize: '10px', color: '#666' }}>0.25</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <StepButton {...args} backlightIntensity={0.5} />
          <span style={{ fontSize: '10px', color: '#666' }}>0.5</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <StepButton {...args} backlightIntensity={0.75} />
          <span style={{ fontSize: '10px', color: '#666' }}>0.75</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
          <StepButton {...args} backlightIntensity={1.0} />
          <span style={{ fontSize: '10px', color: '#666' }}>1.0</span>
        </div>
      </div>
      <div style={{ fontSize: '10px', color: '#666', textAlign: 'center', maxWidth: '300px' }}>
        Demonstrates incandescent bulb backlight effect for playhead indication.
        Transitions slowly to emulate old-style light bulbs.
      </div>
    </div>
  ),
};

// Interactive backlight toggle story
export const InteractiveBacklight: Story = {
  args: {
    type: "button",
    isActive: false,
    onClick: () => {},
  },
  render: (args) => {
    const [backlightIntensity, setBacklightIntensity] = useState(0);
    const [isToggling, setIsToggling] = useState(false);
    
    const toggleBacklight = () => {
      setIsToggling(true);
      // Toggle between 0 and 1
      const newIntensity = backlightIntensity > 0 ? 0 : 1;
      setBacklightIntensity(newIntensity);
      
      // Reset toggle state after animation
      setTimeout(() => setIsToggling(false), 600);
    };
    
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', alignItems: 'center' }}>
        <div style={{ fontSize: '14px', color: '#ccc', textAlign: 'center' }}>
          Interactive Backlight Toggle
        </div>
        
        <StepButton 
          type="button"
          isActive={args.isActive}
          backlightIntensity={backlightIntensity}
          onClick={toggleBacklight}
        />
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontSize: '12px', color: '#888' }}>
            Intensity: {backlightIntensity.toFixed(1)}
          </div>
          <div style={{ fontSize: '10px', color: '#666', maxWidth: '200px', textAlign: 'center' }}>
            Click the button to toggle backlight on/off.
            {isToggling && ' (Transitioning...)'}
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={() => setBacklightIntensity(0)}
            style={{ 
              padding: '4px 8px', 
              fontSize: '10px', 
              background: backlightIntensity === 0 ? '#ff6b35' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            Off
          </button>
          <button 
            onClick={() => setBacklightIntensity(0.5)}
            style={{ 
              padding: '4px 8px', 
              fontSize: '10px', 
              background: backlightIntensity === 0.5 ? '#ff6b35' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            Half
          </button>
          <button 
            onClick={() => setBacklightIntensity(1)}
            style={{ 
              padding: '4px 8px', 
              fontSize: '10px', 
              background: backlightIntensity === 1 ? '#ff6b35' : '#333',
              color: '#fff',
              border: 'none',
              borderRadius: '2px',
              cursor: 'pointer'
            }}
          >
            Full
          </button>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story: 'Interactive demonstration of the backlight effect. Click the step button or use the control buttons to toggle backlight intensity and observe the smooth incandescent bulb transitions.',
      },
    },
  },
};
