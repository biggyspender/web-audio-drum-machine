import { StepButton } from "./sequencer/StepButton";
import styles from "./StopButton.module.css";

interface StopButtonProps {
  isActive: boolean;
  onClick: () => void;
}

// Simple "back to start" SVG (skip back icon)
const BackToStartIcon = () => (
  <svg 
    className={styles.icon} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M6 6h2v12H6zm3.5 6l8.5 6V6l-8.5 6z" />
  </svg>
);

export function StopButton({ isActive, onClick }: StopButtonProps) {
  return (
    <div className={styles.container}>
      <StepButton
        isActive={isActive}
        onClick={onClick}
        backlightIntensity={isActive ? 1.0 : 0.0}
      />
      <div className={styles.iconOverlay}>
        <BackToStartIcon />
      </div>
    </div>
  );
}
