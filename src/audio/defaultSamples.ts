import kick from "./assets/audio/kick.wav?url";
import snare from "./assets/audio/snare.wav?url";
import hat from "./assets/audio/hat.wav?url";
import clap from "./assets/audio/clap.wav?url";
import impulse from "./assets/audio/reverb-impulse.wav?url";

export const defaultSamples = {
  hat,
  clap,
  snare,
  kick,
  impulse,
} as const;
