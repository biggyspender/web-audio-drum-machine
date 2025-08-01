import React from "react";
import styles from "./StepButton.module.css";

type StepButtonBaseProps = {
  isActive: boolean;
  velocity?: number; // 0-255, controls hit intensity
  onMouseDown?: () => void;
  onMouseEnter?: () => void;
  backlightIntensity?: number; // 0-1, controls backlight intensity for playhead effect
  style?: React.CSSProperties; // Allow additional styles for grid positioning
};

interface StepButtonClickProps extends StepButtonBaseProps {
  type: "button";
  onClick: () => void;
}

interface StepButtonVelocityProps extends StepButtonBaseProps {
  type: "velocity-button";
  onVelocityChange: (velocity: number) => void;
}

type StepButtonProps = StepButtonClickProps | StepButtonVelocityProps;

// Type-safe CSS custom properties
interface StepButtonCSSProps extends React.CSSProperties {
  "--backlight-intensity"?: number;
  "--velocity-intensity"?: number;
}

// ...existing code...
export function StepButton(props: StepButtonProps) {
  // Unpack common props
  const {
    isActive,
    velocity = 0,
    onMouseDown,
    onMouseEnter,
    backlightIntensity = 0,
    style,
  } = props;

  // Compute velocity intensity for both types
  const velocityIntensity = props.type === "velocity-button"
    ? (isActive ? Math.max(0, Math.min(velocity, 255)) / 255 : 0)
    : 0;

  // Compute cssProps at top level
  const cssProps: StepButtonCSSProps = React.useMemo(
    () => ({
      "--backlight-intensity": backlightIntensity,
      "--velocity-intensity": velocityIntensity,
      ...style, // Merge additional styles
    }),
    [backlightIntensity, velocityIntensity, style]
  );

  if (props.type === "velocity-button") {
    const { onVelocityChange } = props;
    // Calculate velocity from click Y position
    const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const y = e.clientY - rect.top;
      const height = rect.height;
      // Clamp and invert: top = 255, bottom = 0
      let velocity = Math.round(255 * (1 - y / height));
      velocity = Math.max(0, Math.min(velocity, 255));
      onVelocityChange(velocity);
    };
    return (
      <button
        className={`${styles.stepButton} ${isActive ? styles.active : ""}`}
        onClick={handleButtonClick}
        onMouseDown={onMouseDown}
        onMouseEnter={onMouseEnter}
        aria-label={`Step ${isActive ? "active" : "inactive"}`}
        type="button"
        style={cssProps}
      >
        {/* Visual indicator for active state */}
      </button>
    );
  } else if (props.type === "button") {
    const { onClick } = props;
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
  } else {
    // Should never happen, but TypeScript requires a return
    return null;
  }
}
