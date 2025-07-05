import type { SampleBuffer } from "../../audio/SampleBuffer";
import type { GridState } from "./types";
import { StepButton } from "./StepButton";
import styles from "./StepSequencer.module.css";
import React from "react";

interface StepSequencerProps<K extends string> {
  sampleMap: Record<K, SampleBuffer<K>>;
  gridState: GridState<K>;
  onStepToggle: (trackKey: K, stepIndex: number) => void;
  playheadPosition?: number; // Current step position for backlight effect (0-15)
  vertical?: boolean; // Responsive layout mode
}

export function StepSequencer<K extends string>({
  sampleMap,
  gridState,
  onStepToggle,
  playheadPosition,
  vertical = false,
}: StepSequencerProps<K>) {
  const trackKeys = Object.keys(sampleMap) as K[];
  const stepCount = gridState[trackKeys[0]]?.length || 0;

  // Render
  if (vertical) {
    // Vertical mode: instruments = columns, steps = rows
    const verticalTrackKeys = [...trackKeys].reverse();
    return (
      <div className={styles.sequencer} data-vertical>
        {/* Top row: instrument labels (truncated) */}
        <div className={styles.cornerCell} style={{ gridColumn: 1, gridRow: 1 }}></div>
        {verticalTrackKeys.map((trackKey, i) => (
          <div
            key={`header-${i}`}
            className={styles.trackLabel}
            style={{ gridColumn: i + 2, gridRow: 1 }}
          >
            {trackKey.slice(0, 2)}
          </div>
        ))}
        {/* Step number headers at side */}
        {Array.from({ length: stepCount }, (_, i) => (
          <div
            key={`stepnum-${i}`}
            className={styles.stepHeader}
            style={{ gridColumn: 1, gridRow: i + 2 }}
          >
            {i + 1}
          </div>
        ))}
        {/* Step buttons */}
        {Array.from({ length: stepCount }, (_, rowIdx) =>
          verticalTrackKeys.map((_, colIdx) => (
            <StepButton
              key={`btn-${rowIdx}-${colIdx}`}
              isActive={(() => {
                const trackKey = verticalTrackKeys[colIdx];
                return gridState[trackKey]?.[rowIdx];
              })()}
              onClick={() => {
                const trackKey = verticalTrackKeys[colIdx];
                onStepToggle(trackKey, rowIdx);
              }}
              backlightIntensity={playheadPosition === rowIdx ? 1.0 : 0.0}
              style={{ gridColumn: colIdx + 2, gridRow: rowIdx + 2 }}
            />
          ))
        )}
      </div>
    );
  }

  // Horizontal mode (default)
  return (
    <div className={styles.sequencer}>
      {/* Header row - empty space for track labels column */}
      <div className={styles.trackLabel} style={{ gridColumn: 1, gridRow: 1 }}></div>
      {/* Header row - step number headers */}
      {Array.from({ length: stepCount }, (_, i) => (
        <div
          key={`header-${i}`}
          className={styles.stepHeader}
          style={{
            gridColumn: i + 2,
            gridRow: 1,
            "--playhead-intensity": playheadPosition === i ? 1 : 0,
          } as React.CSSProperties & { "--playhead-intensity": number }}
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
            style={{ gridColumn: 1, gridRow: trackIndex + 2 }}
          >
            {trackKey}
          </div>
          {/* Step buttons for this track */}
          {Array.from({ length: stepCount }, (_, stepIndex) => (
            <StepButton
              key={`${trackKey}-${stepIndex}`}
              isActive={gridState[trackKey][stepIndex]}
              onClick={() => onStepToggle(trackKey, stepIndex)}
              backlightIntensity={playheadPosition === stepIndex ? 1.0 : 0.0}
              style={{ gridColumn: stepIndex + 2, gridRow: trackIndex + 2 }}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
