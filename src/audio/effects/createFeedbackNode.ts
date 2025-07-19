import { createCompositeAudioGraph } from "../createCompositeAudioGraph";

export function createFeedbackNode(audioContext: AudioContext) {
  return createCompositeAudioGraph(
    audioContext,
    {},
    ({ source, destination }) => {
      const delayNode = audioContext.createDelay();
      const gainNode = audioContext.createGain();

      // Set default values
      delayNode.delayTime.value = 0.3;
      gainNode.gain.value = 0.4;

      // Feedback loop: delay -> gain -> delay
      delayNode.connect(gainNode);
      gainNode.connect(delayNode);

      // Wire up input/output
      source.connect(delayNode);
      delayNode.connect(destination);

      return {
        delayTime: delayNode.delayTime,
        feedback: gainNode.gain,
      };
    }
  );
}
