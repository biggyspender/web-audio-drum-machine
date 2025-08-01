import type { SampleBuffer } from "../../audio/SampleBuffer";
import type { GridState } from "./types";
import { StepButton } from "./StepButton";
import Knob from "../Knob";
import styles from "./StepSequencer.module.css";
import React, { useRef, useState, useCallback, useEffect } from "react";

interface StepSequencerProps<K extends string> {
  sampleMap: Record<K, SampleBuffer<K>>;
  gridState: GridState<K>;
  onStepToggle: (trackKey: K, stepIndex: number, velocity: number) => void;
  playheadPosition?: number; // Current step position for backlight effect (0-15)
  vertical?: boolean; // Responsive layout mode
  trackSends?: Record<K, number>; // Per-track effects send levels (0-1)
  onTrackSendChange?: (trackKey: K, value: number) => void; // Handler for send level changes
}

const VELOCITIES = [0, 255, 128];

export function StepSequencer<K extends string>({
  sampleMap,
  gridState,
  onStepToggle,
  playheadPosition,
  vertical = false,
  trackSends,
  onTrackSendChange,
}: StepSequencerProps<K>) {
  const trackKeys = Object.keys(sampleMap) as K[];
  const stepCount = gridState[trackKeys[0]]?.length || 0;

  // Drag state for painting
  const [dragging, setDragging] = useState(false);
  const [dragValue, setDragValue] = useState<number | null>(null);
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
  // Cycle velocity: 0 -> 128 -> 255 -> 0 ...
  const nextVelocity = (current: number) => {
    const idx = VELOCITIES.indexOf(current);
    return VELOCITIES[(idx + 1) % VELOCITIES.length];
  };

  const handleStepMouseDown = useCallback(
    (trackKey: K, stepIndex: number) => {
      const current = gridState[trackKey][stepIndex] ?? 0;
      const newValue = nextVelocity(current);
      setDragging(true);
      setDragValue(newValue);
      paintedRef.current = new Set([`${trackKey}:${stepIndex}`]);
      onStepToggle(trackKey, stepIndex, newValue);
    },
    [gridState, onStepToggle]
  );

  const handleStepMouseEnter = useCallback(
    (trackKey: K, stepIndex: number) => {
      if (!dragging || dragValue === null) return;
      const key = `${trackKey}:${stepIndex}`;
      if (paintedRef.current.has(key)) return;
      // Only set if not already at dragValue
      if (gridState[trackKey][stepIndex] !== dragValue) {
        onStepToggle(trackKey, stepIndex, dragValue);
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
        <div
          className={styles.cornerCell}
          style={{ gridColumn: 1, gridRow: 1 }}
        ></div>
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
                type="velocity-button"
                key={`btn-${rowIdx}-${colIdx}`}
                isActive={gridState[trackKey]?.[rowIdx] > 0}
                velocity={gridState[trackKey]?.[rowIdx] ?? 0}
                onVelocityChange={(velocity: number) => onStepToggle(trackKey, rowIdx, velocity)}
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
      <div
        className={styles.trackLabel}
        style={{ gridColumn: 1, gridRow: 1 }}
      ></div>
      
      {/* Header row - FX send column */}
      <div
        className={styles.stepHeader}
        style={{ gridColumn: 2, gridRow: 1 }}
      >
        FX
      </div>
      
      {/* Header row - step number headers */}
      {Array.from({ length: stepCount }, (_, i) => (
        <div
          key={`header-${i}`}
          className={styles.stepHeader}
          style={
            {
              gridColumn: i + 3,
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
            style={{ gridColumn: 1, gridRow: trackIndex + 2 }}
          >
            {trackKey}
          </div>
          
          {/* Track effects send knob */}
          <div
            key={`send-${trackKey}`}
            className={styles.trackSend}
            style={{ gridColumn: 2, gridRow: trackIndex + 2 }}
          >
            <Knob
              min={0}
              max={1}
              value={trackSends?.[trackKey] ?? 0}
              onChange={(value) => onTrackSendChange?.(trackKey, value)}
              label=""
              step={0.01}
              precision={2}
              size={20}
            />
          </div>
          
          {/* Step buttons for this track */}
          {Array.from({ length: stepCount }, (_, stepIndex) => (
            <StepButton
              type="velocity-button"
              key={`${trackKey}-${stepIndex}`}
              isActive={gridState[trackKey][stepIndex] > 0}
              velocity={gridState[trackKey][stepIndex] ?? 0}
              onVelocityChange={(velocity: number) => onStepToggle(trackKey, stepIndex, velocity)}
              onMouseDown={() => handleStepMouseDown(trackKey, stepIndex)}
              onMouseEnter={() => handleStepMouseEnter(trackKey, stepIndex)}
              backlightIntensity={playheadPosition === stepIndex ? 1.0 : 0.0}
              style={{ gridColumn: stepIndex + 3, gridRow: trackIndex + 2 }}
            />
          ))}
        </React.Fragment>
      ))}
    </div>
  );
}
