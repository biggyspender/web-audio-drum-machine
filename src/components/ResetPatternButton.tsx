import { StepButton } from "./sequencer/StepButton";
import styles from "./ResetPatternButton.module.css";

interface ResetPatternButtonProps {
  isActive?: boolean;
  onClick: () => void;
}

// Simple reset icon (circular arrow)
const ResetPatternIcon = () => (
  <svg className={styles.icon} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 6V3L7 8l5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h2c0 2.21 1.79 4 4 4s4-1.79 4-4-1.79-4-4-4z" />
  </svg>
);

export function ResetPatternButton({
  isActive = true,
  onClick,
}: ResetPatternButtonProps) {
  return (
    <div className={styles.container}>
      <StepButton
        type="button"
        isActive={isActive}
        onClick={onClick}
        backlightIntensity={isActive ? 1.0 : 0.0}
      />
      <div className={styles.iconOverlay}>
        <ResetPatternIcon />
      </div>
    </div>
  );
}
