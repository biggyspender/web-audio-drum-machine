import type { AudioEffectNodeBase } from "../AudioEffectNodeBase";

export type ReverbNode = AudioEffectNodeBase & {
  readonly wet: AudioParam;
  readonly dry: AudioParam;
};

export function createReverbNode(
  audioContext: AudioContext,
  impulseBuffer: AudioBuffer
): ReverbNode {
  // Create nodes
  const revNode = audioContext.createConvolver();
  const inputNode = audioContext.createGain();
  const outputNode = audioContext.createGain();
  const dryNode = audioContext.createGain(); // For clean signal
  const wetNode = audioContext.createGain(); // For reverb signal

  revNode.buffer = impulseBuffer;

  // Set default values
  wetNode.gain.value = 0.5;
  dryNode.gain.value = 1;

  // Connect the nodes
  // Input → dry → output
  inputNode.connect(dryNode);
  dryNode.connect(outputNode);

  // Input → reverb → wet → output
  inputNode.connect(revNode);
  revNode.connect(wetNode);
  wetNode.connect(outputNode);

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
    get wet() {
      return wetNode.gain;
    },
    get dry() {
      return dryNode.gain;
    },
  };
}
