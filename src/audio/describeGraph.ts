// Utility to describe the structure of a Web Audio graph
// Traverses from the given root node and outputs a readable tree
import { getAudioNodeConnections } from "./patchAudioNodeConnect";

function describeGraph(root: AudioNode): string {
  const visited = new Set<AudioNode>();
  const lines: string[] = [];

  function nodeLabel(node: AudioNode): string {
    const type = node.constructor.name;
    // Add key properties for common node types
    if (type === "GainNode") {
      return `${type} (gain=${(node as GainNode).gain?.value})`;
    }
    if (type === "BiquadFilterNode") {
      return `${type} (type=${(node as BiquadFilterNode).type}, freq=${
        (node as BiquadFilterNode).frequency?.value
      })`;
    }
    if (type === "DelayNode") {
      return `${type} (delayTime=${(node as DelayNode).delayTime?.value})`;
    }
    if (type === "OscillatorNode") {
      return `${type} (type=${(node as OscillatorNode).type}, freq=${
        (node as OscillatorNode).frequency?.value
      })`;
    }
    return type;
  }

  function walk(node: AudioNode, depth: number) {
    const indent = "  ".repeat(depth);
    lines.push(`${indent}${nodeLabel(node)}`);
    if (visited.has(node)) {
      lines[lines.length - 1] += " [cycle]";
      return;
    }
    visited.add(node);
    // Use the patched connection map for outgoing connections
    const outputs = getAudioNodeConnections(node);
    if (outputs && outputs.size > 0) {
      for (const out of outputs) {
        walk(out, depth + 1);
      }
    }
  }

  walk(root, 0);
  return lines.join("\n");
}

export default describeGraph;
