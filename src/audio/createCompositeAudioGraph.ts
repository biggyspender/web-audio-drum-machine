import type { AudioEffectNodeBase } from "./AudioEffectNodeBase";

/**
 * Factory for composite audio graphs with type-safe param exposure.
 * @param audioContext The AudioContext to use
 * @param options Generic options for future extensibility
 * @param callback Receives { source, destination } GainNodes to wire up the graph, returns a record of AudioParams to expose
 */
export function createCompositeAudioGraph<
  TParams extends Record<string, AudioParam>,
  TOptions extends object = object
>(
  audioContext: AudioContext,
  options: TOptions,
  callback: (nodes: { source: GainNode; destination: GainNode }) => TParams
): AudioEffectNodeBase & TParams {
  // options is currently unused, but reserved for future use
  void options;
  // Create input/output gain nodes
  const input = audioContext.createGain();
  const output = audioContext.createGain();

  // User wires up the graph
  const params =
    callback({ source: input, destination: output }) || ({} as TParams);

  const baseNode = {
    input,
    connect: (destination: AudioNode) => output.connect(destination),
    disconnect: (destinationNode?: AudioNode) => {
      if (destinationNode) {
        output.disconnect(destinationNode);
      } else {
        output.disconnect();
      }
    },
  };

  const obj = { ...params, ...baseNode };

  // AudioEffectNodeBase implementation
  const node = Object.create(null) as AudioEffectNodeBase & TParams;

  (Object.keys(obj) as Array<keyof typeof node>).forEach((key) => {
    Object.defineProperty(node, key, {
      get: () => obj[key],
      enumerable: true,
      configurable: true,
    });
  });

  return node;
}
