import type { SampleBuffer } from "../../audio/SampleBuffer";
import type { GridState } from "./types";
import { StepButton } from "./StepButton";
import styles from "./StepSequencer.module.css";
import React, { useRef, useState, useCallback, useEffect } from "react";

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

  // Drag state for painting
  const [dragging, setDragging] = useState(false);
  const [dragValue, setDragValue] = useState<boolean | null>(null);
  // To avoid repeated updates on the same button
  const paintedRef = useRef<Set<string>>(new Set());

  // End drag on mouseup anywhere
  useEffect(() => {
    if (!dragging) return;
    const handleUp = () => {
      setDragging(false);
      setDragValue(null);
      paintedRef.current.clear();
    };
    window.addEventListener("mouseup", handleUp);
    return () => window.removeEventListener("mouseup", handleUp);
  }, [dragging]);

  // Handlers for step buttons
  const handleStepMouseDown = useCallback(
    (trackKey: K, stepIndex: number) => {
      const current = !!gridState[trackKey][stepIndex];
      const newValue = !current;
      setDragging(true);
      setDragValue(newValue);
      paintedRef.current = new Set([`${trackKey}:${stepIndex}`]);
      onStepToggle(trackKey, stepIndex);
    },
    [gridState, onStepToggle]
  );

  const handleStepMouseEnter = useCallback(
    (trackKey: K, stepIndex: number) => {
      if (!dragging || dragValue === null) return;
      const key = `${trackKey}:${stepIndex}`;
      if (paintedRef.current.has(key)) return;
      // Only set if not already at dragValue
      if (!!gridState[trackKey][stepIndex] !== dragValue) {
        onStepToggle(trackKey, stepIndex);
      }
      paintedRef.current.add(key);
    },
    [dragging, dragValue, gridState, onStepToggle]
  );

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
          verticalTrackKeys.map((_, colIdx) => {
            const trackKey = verticalTrackKeys[colIdx];
            return (
              <StepButton
                key={`btn-${rowIdx}-${colIdx}`}
                isActive={gridState[trackKey]?.[rowIdx]}
                onClick={() => onStepToggle(trackKey, rowIdx)}
                onMouseDown={() => handleStepMouseDown(trackKey, rowIdx)}
                onMouseEnter={() => handleStepMouseEnter(trackKey, rowIdx)}
                backlightIntensity={playheadPosition === rowIdx ? 1.0 : 0.0}
                style={{ gridColumn: colIdx + 2, gridRow: rowIdx + 2 }}
              />
            );
          })
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
              //onClick={() => onStepToggle(trackKey, stepIndex)}
              onMouseDown={() => handleStepMouseDown(trackKey, stepIndex)}
              onMouseEnter={() => handleStepMouseEnter(trackKey, stepIndex)}
              backlightIntensity={playheadPosition === stepIndex ? 1.0 : 0.0}
              style={{ gridColumn: stepIndex + 2, gridRow: trackIndex + 2 }}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
