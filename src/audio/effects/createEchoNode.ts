import { createCompositeAudioGraph } from "../createCompositeAudioGraph";
import { createFeedbackNode } from "./createFeedbackNode";

export function createEchoNode(audioContext: AudioContext) {
  return createCompositeAudioGraph<{
    delayTime: AudioParam;
    feedback: AudioParam;
    level: AudioParam;
  }>(audioContext, {}, ({ source, destination }) => {
    // Feedback echo structure: input -> feedbackNode -> feedbackGain -> output
    const feedbackNode = createFeedbackNode(audioContext);
    const feedbackGainNode = audioContext.createGain();

    // Wire up the graph
    source.connect(feedbackNode.input);
    feedbackNode.connect(feedbackGainNode);
    feedbackGainNode.connect(destination);
    // Dry signal
    source.connect(destination);

    return {
      delayTime: feedbackNode.delayTime,
      feedback: feedbackNode.feedback,
      level: feedbackGainNode.gain,
    };
  });
}
