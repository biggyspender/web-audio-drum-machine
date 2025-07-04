import type { AudioEffectNodeBase } from "../AudioEffectNodeBase";

export type FeedbackNode = AudioEffectNodeBase & {
  readonly delayTime: AudioParam;
  readonly feedback: AudioParam;
};

export function createFeedbackNode(audioContext: AudioContext): FeedbackNode {
  const delayNode = audioContext.createDelay();
  const gainNode = audioContext.createGain();

  // Set default values
  delayNode.delayTime.value = 0.3;
  gainNode.gain.value = 0.4;

  // Feedback loop
  delayNode.connect(gainNode);
  gainNode.connect(delayNode);

  return {
    input: delayNode,
    connect: (destination: AudioNode) => delayNode.connect(destination),
    disconnect: (destinationNode?: AudioNode) => {
      if (destinationNode) {
        delayNode.disconnect(destinationNode);
      } else {
        delayNode.disconnect();
      }
    },
    get delayTime() {
      return delayNode.delayTime;
    },

    get feedback() {
      return gainNode.gain;
    },
  };
}
