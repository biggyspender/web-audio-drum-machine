import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { StepSequencer } from "./StepSequencer";
import { createDefaultGridPattern } from "./utils/createDefaultPattern";
import { gridToNotes } from "./utils/gridToNotes";
import type { GridState } from "./types";
import type { SampleBuffer } from "../../audio/SampleBuffer";

// Define specific track type for consistency
type TrackType = "kick" | "snare" | "hat" | "clap";

// Mock sample data with specific typing
const mockSampleMap: Record<TrackType, SampleBuffer<TrackType>> = {
  kick: { id: "kick", buffer: new ArrayBuffer(0) },
  snare: { id: "snare", buffer: new ArrayBuffer(0) },
  hat: { id: "hat", buffer: new ArrayBuffer(0) },
  clap: { id: "clap", buffer: new ArrayBuffer(0) },
};

// Create a wrapper component with explicit typing to resolve generic issues
type StepSequencerWrapperProps = {
  sampleMap: Record<TrackType, SampleBuffer<TrackType>>;
  gridState: GridState<TrackType>;
  onStepToggle: (trackKey: TrackType, stepIndex: number) => void;
};

const StepSequencerWrapper = (props: StepSequencerWrapperProps) => {
  return <StepSequencer {...props} />;
};

const meta = {
  title: "Sequencer/State Management",
  component: StepSequencerWrapper,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Stories testing state management functionality for the step sequencer.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta<typeof StepSequencerWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

// Test default pattern creation
export const DefaultPattern: Story = {
  args: {
    sampleMap: mockSampleMap,
    gridState: createDefaultGridPattern(mockSampleMap),
    onStepToggle: () => {},
  },
  parameters: {
    docs: {
      description: {
        story:
          "Demonstrates the default pattern created by createDefaultGridPattern() - kick on 1&9, snare on 5&13, hat on every other beat.",
      },
    },
  },
};

// Interactive state management test
export const InteractiveToggle: Story = {
  args: {
    sampleMap: mockSampleMap,
    gridState: createDefaultGridPattern(mockSampleMap),
    onStepToggle: () => {},
  },
  render: (args) => {
    const [gridState, setGridState] = useState<GridState<TrackType>>(
      args.gridState
    );

    const handleStepToggle = (trackKey: TrackType, stepIndex: number) => {
      setGridState((prevGrid: GridState<TrackType>) => ({
        ...prevGrid,
        [trackKey]: prevGrid[trackKey].map((active: boolean, index: number) =>
          index === stepIndex ? !active : active
        ),
      }));
    };

    return (
      <div>
        <StepSequencerWrapper
          sampleMap={args.sampleMap}
          gridState={gridState}
          onStepToggle={handleStepToggle}
        />
        <div style={{ marginTop: "20px", fontSize: "12px", color: "#ccc" }}>
          Click any step to toggle it on/off. State updates should be immediate.
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive test for step toggle functionality. Click any step to toggle its state and verify real-time updates.",
      },
    },
  },
};

// Grid-to-notes conversion visualization
export const AudioConversion: Story = {
  args: {
    sampleMap: mockSampleMap,
    gridState: createDefaultGridPattern(mockSampleMap),
    onStepToggle: () => {},
  },
  render: (args) => {
    const [gridState, setGridState] = useState<GridState<TrackType>>(
      createDefaultGridPattern(mockSampleMap)
    );

    const handleStepToggle = (trackKey: TrackType, stepIndex: number) => {
      setGridState((prevGrid) => ({
        ...prevGrid,
        [trackKey]: prevGrid[trackKey].map((active, index) =>
          index === stepIndex ? !active : active
        ),
      }));
    };

    const notes = gridToNotes(gridState, mockSampleMap);
    const activeSteps = notes
      .map((stepSamples, index) => ({
        step: index + 1,
        samples: stepSamples.map((ps) => ({
          id: ps.sample.id,
          velocity: ps.velocity,
        })),
      }))
      .filter((step) => step.samples.length > 0);

    return (
      <div>
        <StepSequencerWrapper
          sampleMap={args.sampleMap}
          gridState={gridState}
          onStepToggle={handleStepToggle}
        />
        <div
          style={{
            marginTop: "20px",
            padding: "15px",
            background: "#333",
            borderRadius: "4px",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              fontWeight: "bold",
              color: "#ccc",
              marginBottom: "10px",
            }}
          >
            Audio Conversion Output:
          </div>
          <div
            style={{ fontSize: "12px", color: "#aaa", fontFamily: "monospace" }}
          >
            {activeSteps.length === 0 ? (
              <div>No active steps</div>
            ) : (
              activeSteps.map((step) => (
                <div key={step.step}>
                  Step {step.step}:{" "}
                  {step.samples.map((s) => `${s.id}(${s.velocity})`).join(", ")}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  },
  parameters: {
    docs: {
      description: {
        story:
          "Visualizes the output of gridToNotes() conversion. Shows which samples will play on each step with their velocities.",
      },
    },
  },
};
