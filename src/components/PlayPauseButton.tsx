import { StepButton } from "./sequencer/StepButton";
import styles from "./PlayPauseButton.module.css";

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onClick: () => void;
}

// Simple play arrow SVG
const PlayIcon = () => (
  <svg 
    className={styles.icon} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M8 5v14l11-7z" />
  </svg>
);

// Simple pause bars SVG
const PauseIcon = () => (
  <svg 
    className={styles.icon} 
    viewBox="0 0 24 24" 
    fill="currentColor"
  >
    <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
  </svg>
);

export function PlayPauseButton({ isPlaying, onClick }: PlayPauseButtonProps) {
  return (
    <div className={styles.container}>
      <StepButton
        isActive={isPlaying}
        onClick={onClick}
        backlightIntensity={isPlaying ? 1.0 : 0.0}
      />
      <div className={styles.iconOverlay}>
        {isPlaying ? <PauseIcon /> : <PlayIcon />}
      </div>
    </div>
  );
}
