import { createEchoNode } from "./effects/createEchoNode";
import { createReverbNode } from "./effects/createReverbNode";
import type { AudioEffectNodeBase } from "./AudioEffectNodeBase";

export type OutputEffectsChainNode = AudioEffectNodeBase & {
  readonly echoDelayTime: AudioParam;
  readonly echoFeedback: AudioParam;
  readonly echoLevel: AudioParam;
  readonly reverbLevel: AudioParam;
};

export function createOutputEffectsChain(
  audioContext: AudioContext,
  impulse: AudioBuffer
): OutputEffectsChainNode {
  const echo = createEchoNode(audioContext);
  echo.feedback.value = 0.33;
  echo.level.value = 1;

  const reverb = createReverbNode(audioContext, impulse);
  reverb.wet.value = 0.25; // Set wet level to 25%
  reverb.dry.value = 1; // Set dry level to 75%

  // Chain: echo -> reverb -> destination
  echo.connect(reverb.input);

  return {
    input: echo.input,
    connect: (dest: AudioNode) => reverb.connect(dest),
    disconnect: (dest?: AudioNode) => reverb.disconnect(dest),
    get echoDelayTime() {
      return echo.delayTime;
    },
    get echoFeedback() {
      return echo.feedback;
    },
    get echoLevel() {
      return echo.level;
    },
    get reverbLevel() {
      return reverb.wet;
    },
  };
}
