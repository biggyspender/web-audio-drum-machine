// Common base type for audio effect nodes
export type AudioEffectNodeBase = {
  input: AudioNode;
  connect: (destination: AudioNode) => AudioNode;
  disconnect: (destinationNode?: AudioNode) => void;
};
