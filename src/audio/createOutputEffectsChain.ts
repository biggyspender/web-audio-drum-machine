import { createCompositeAudioGraph } from "./createCompositeAudioGraph";
import { createEchoNode } from "./effects/createEchoNode";
import { createReverbNode } from "./effects/createReverbNode";

export function createOutputEffectsChain(
  audioContext: AudioContext,
  impulse: AudioBuffer
) {
  return createCompositeAudioGraph<{
    echoDelayTime: AudioParam;
    echoFeedback: AudioParam;
    echoLevel: AudioParam;
    reverbLevel: AudioParam;
  }>(audioContext, {}, ({ source, destination }) => {
    const echo = createEchoNode(audioContext);
    echo.feedback.value = 0.33;
    echo.level.value = 1;

    const reverb = createReverbNode(audioContext, impulse);
    reverb.wet.value = 0.25;
    reverb.dry.value = 1;

    // Chain: echo -> reverb -> destination
    source.connect(echo.input);
    echo.connect(reverb.input);
    reverb.connect(destination);

    return {
      echoDelayTime: echo.delayTime,
      echoFeedback: echo.feedback,
      echoLevel: echo.level,
      reverbLevel: reverb.wet,
    };
  });
}
