import React from "react";
import styles from "./StepButton.module.css";

interface StepButtonProps {
  isActive: boolean;
  velocity?: number; // 0-255, controls hit intensity
  onClick?: () => void;
  onMouseDown?: () => void;
  onMouseEnter?: () => void;
  backlightIntensity?: number; // 0-1, controls backlight intensity for playhead effect
  style?: React.CSSProperties; // Allow additional styles for grid positioning
}

// Type-safe CSS custom properties
interface StepButtonCSSProps extends React.CSSProperties {
  "--backlight-intensity"?: number;
  "--velocity-intensity"?: number;
}

// ...existing code...
export function StepButton(props: StepButtonProps) {
  const {
    isActive,
    velocity = 0,
    onClick,
    onMouseDown,
    onMouseEnter,
    backlightIntensity = 0,
    style,
  } = props;
  // Map velocity (0-255) to intensity (0-1)
  const velocityIntensity = isActive ? Math.max(0, Math.min(velocity, 255)) / 255 : 0;
  const cssProps: StepButtonCSSProps = React.useMemo(
    () => ({
      "--backlight-intensity": backlightIntensity,
      "--velocity-intensity": velocityIntensity,
      ...style, // Merge additional styles
    }),
    [backlightIntensity, velocityIntensity, style]
  );

  return (
    <button
      className={`${styles.stepButton} ${isActive ? styles.active : ""}`}
      onClick={onClick}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      aria-label={`Step ${isActive ? "active" : "inactive"}`}
      type="button"
      style={cssProps}
    >
      {/* Visual indicator for active state */}
    </button>
  );
}
