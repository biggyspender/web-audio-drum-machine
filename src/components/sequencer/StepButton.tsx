import React from "react";
import styles from "./StepButton.module.css";

interface StepButtonProps {
  isActive: boolean;
  onClick: () => void;
  backlightIntensity?: number; // 0-1, controls backlight intensity for playhead effect
  style?: React.CSSProperties; // Allow additional styles for grid positioning
}

// Type-safe CSS custom properties
interface StepButtonCSSProps extends React.CSSProperties {
  "--backlight-intensity"?: number;
}

export function StepButton({
  isActive,
  onClick,
  backlightIntensity = 0,
  style,
}: StepButtonProps) {
  const cssProps: StepButtonCSSProps = React.useMemo(
    () => ({
      "--backlight-intensity": backlightIntensity,
      ...style, // Merge additional styles
    }),
    [backlightIntensity, style]
  );

  return (
    <button
      className={`${styles.stepButton} ${isActive ? styles.active : ""}`}
      onClick={onClick}
      aria-label={`Step ${isActive ? "active" : "inactive"}`}
      type="button"
      style={cssProps}
    >
      {/* Visual indicator for active state */}
    </button>
  );
}
