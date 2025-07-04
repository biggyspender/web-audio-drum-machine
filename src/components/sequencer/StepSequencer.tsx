import type { SampleBuffer } from "../../audio/SampleBuffer";
import type { GridState } from "./types";
import { STEP_COUNT } from "./types";
import { StepButton } from "./StepButton";
import styles from "./StepSequencer.module.css";
import React from "react";

interface StepSequencerProps<K extends string> {
  sampleMap: Record<K, SampleBuffer<K>>;
  gridState: GridState<K>;
  onStepToggle: (trackKey: K, stepIndex: number) => void;
  playheadPosition?: number; // Current step position for backlight effect (0-15)
}

export function StepSequencer<K extends string>({
  sampleMap,
  gridState,
  onStepToggle,
  playheadPosition,
}: StepSequencerProps<K>) {
  const trackKeys = Object.keys(sampleMap) as K[];

  return (
    <div className={styles.sequencer}>
      {/* Header row - empty space for track labels column */}
      <div
        className={styles.trackLabel}
        style={{ gridColumn: 1, gridRow: 1 }}
      ></div>

      {/* Header row - step number headers */}
      {Array.from({ length: STEP_COUNT }, (_, i) => (
        <div
          key={`header-${i}`}
          className={styles.stepHeader}
          style={
            {
              gridColumn: i + 2, // Column 2-17 (after the label column)
              gridRow: 1,
              "--playhead-intensity": playheadPosition === i ? 1 : 0,
            } as React.CSSProperties & { "--playhead-intensity": number }
          }
        >
          {i + 1}
        </div>
      ))}

      {/* Track rows */}
      {trackKeys.map((trackKey, trackIndex) => (
        <React.Fragment key={`trackrow-${trackKey}`}>
          {/* Track label */}
          <div
            key={`label-${trackKey}`}
            className={styles.trackLabel}
            style={{
              gridColumn: 1,
              gridRow: trackIndex + 2, // Row 2+ (after header row)
            }}
          >
            {trackKey}
          </div>

          {/* Step buttons for this track */}
          {Array.from({ length: STEP_COUNT }, (_, stepIndex) => (
            <StepButton
              key={`${trackKey}-${stepIndex}`}
              isActive={gridState[trackKey][stepIndex]}
              onClick={() => onStepToggle(trackKey, stepIndex)}
              backlightIntensity={playheadPosition === stepIndex ? 1.0 : 0.0}
              style={{
                gridColumn: stepIndex + 2, // Column 2-17
                gridRow: trackIndex + 2, // Row 2+
              }}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
