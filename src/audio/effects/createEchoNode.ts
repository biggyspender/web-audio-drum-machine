import type { AudioEffectNodeBase } from "../AudioEffectNodeBase";
import { createFeedbackNode } from "./createFeedbackNode";

export type EchoNode = AudioEffectNodeBase & {
  readonly delayTime: AudioParam;
  readonly feedback: AudioParam;
  readonly level: AudioParam;
};

export function createEchoNode(audioContext: AudioContext): EchoNode {
  const inputNode = audioContext.createGain();
  const feedbackNode = createFeedbackNode(audioContext);
  const feedbackGainNode = audioContext.createGain();
  const outputNode = audioContext.createGain();
  feedbackNode.connect(feedbackGainNode);
  feedbackGainNode.connect(outputNode);
  inputNode.connect(feedbackNode.input);
  inputNode.connect(outputNode);
  return {
    input: inputNode,
    connect: (destination: AudioNode) => outputNode.connect(destination),
    disconnect: (destinationNode?: AudioNode) => {
      if (destinationNode) {
        outputNode.disconnect(destinationNode);
      } else {
        outputNode.disconnect();
      }
    },
    get delayTime() {
      return feedbackNode.delayTime;
    },
    get feedback() {
      return feedbackNode.feedback;
    },
    get level() {
      return feedbackGainNode.gain;
    },
  };
}
