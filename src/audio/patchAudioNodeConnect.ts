/* eslint-disable @typescript-eslint/no-explicit-any */
// src/audio/patchAudioNodeConnect.ts
// Monkey-patch AudioNode.connect and disconnect to track connections for graph traversal

const connectionMap = new WeakMap<AudioNode, Set<AudioNode>>();

export function getAudioNodeConnections(
  node: AudioNode
): Set<AudioNode> | undefined {
  return connectionMap.get(node);
}
let count = 0;
export function patchAudioNodeConnect(debug?: boolean) {
  // Only patch once
  if ((AudioNode.prototype as any)._connectPatched) return;
  (AudioNode.prototype as any)._connectPatched = true;

  const origConnect = AudioNode.prototype.connect;
  AudioNode.prototype.connect = function (
    this: AudioNode,
    dest: AudioNode,
    ...args: any[]
  ) {
    if (dest instanceof AudioNode) {
      if (!connectionMap.has(this)) {
        connectionMap.set(this, new Set());
        count++;
        if (debug) console.debug(`AudioNode.connect: ${count} nodes`);
      }
      connectionMap.get(this)!.add(dest);
    }
    // @ts-expect-error: allow extra args for connect
    return origConnect.apply(this, [dest, ...args]);
  } as typeof AudioNode.prototype.connect;

  const origDisconnect = AudioNode.prototype.disconnect;
  AudioNode.prototype.disconnect = function (
    this: AudioNode,
    dest?: AudioNode,
    ...args: any[]
  ) {
    if (dest instanceof AudioNode) {
      const set = connectionMap.get(this);
      if (set) {
        set.delete(dest);
        if (set.size === 0) {
          connectionMap.delete(this);
          count--;
          if (debug) console.debug(`AudioNode.disconnect: ${count} nodes`);
        }
      }
    } else if (dest === undefined) {
      connectionMap.delete(this);
    }
    // @ts-expect-error: allow extra args for disconnect
    return origDisconnect.apply(this, [dest, ...args]);
  } as typeof AudioNode.prototype.disconnect;
}
