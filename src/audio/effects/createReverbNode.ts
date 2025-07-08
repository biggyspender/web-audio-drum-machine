import { createCompositeAudioGraph } from "../createCompositeAudioGraph";

export function createReverbNode(
  audioContext: AudioContext,
  impulseBuffer: AudioBuffer
) {
  return createCompositeAudioGraph<{ wet: AudioParam; dry: AudioParam }>(
    audioContext,
    {},
    ({ source, destination }) => {
      const revNode = audioContext.createConvolver();
      const dryNode = audioContext.createGain();
      const wetNode = audioContext.createGain();

      revNode.buffer = impulseBuffer;
      wetNode.gain.value = 0.5;
      dryNode.gain.value = 1;

      // Input → dry → output
      source.connect(dryNode);
      dryNode.connect(destination);

      // Input → reverb → wet → output
      source.connect(revNode);
      revNode.connect(wetNode);
      wetNode.connect(destination);

      return {
        wet: wetNode.gain,
        dry: dryNode.gain,
      };
    }
  );
}
