import { createOutputEffectsChain } from "./createOutputEffectsChain";

/**
 * Creates a per-track effects send routing system that manages individual track sends
 * and a shared effects chain. Returns the effects chain params plus track access.
 */
export function createPerTrackEffectsRouter<K extends string>(
  audioContext: AudioContext,
  trackKeys: K[],
  impulse: AudioBuffer,
  destination: AudioNode
) {
  // Create shared effects chain
  const effectsChain = createOutputEffectsChain(audioContext, impulse);
  
  // Create dry mix gain node (collects all dry signals)
  const dryMix = audioContext.createGain();
  
  // Create wet mix gain node (receives effects output)
  const wetMix = audioContext.createGain();
  wetMix.gain.value = 1;
  
  // Connect effects chain output to wet mix
  effectsChain.connect(wetMix);
  
  // Create final sum node
  const finalSum = audioContext.createGain();
  dryMix.connect(finalSum);
  wetMix.connect(finalSum);
  finalSum.connect(destination);
  
  // Create per-track routing
  const trackSends: Record<string, AudioParam> = {};
  const trackInputs: Record<string, AudioNode> = {};
  
  trackKeys.forEach((trackKey) => {
    // Create per-track input gain node
    const trackInput = audioContext.createGain();
    trackInputs[trackKey] = trackInput;
    
    // Create send and dry gain nodes for this track
    const sendGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    
    // Connect track input to both send and dry paths
    trackInput.connect(sendGain);
    trackInput.connect(dryGain);
    
    // Connect send path to effects chain input
    sendGain.connect(effectsChain.input);
    
    // Connect dry path to dry mix
    dryGain.connect(dryMix);
    
    // Set initial values
    sendGain.gain.value = 0; // No send initially
    dryGain.gain.value = 1; // Full dry initially
    
    // Create wrapped AudioParam that auto-adjusts dry level
    const originalSendParam = sendGain.gain;
    const wrappedSendParam = {
      get value() { return originalSendParam.value; },
      set value(val: number) {
        const clampedVal = Math.max(0, Math.min(1, val));
        originalSendParam.value = clampedVal;
        dryGain.gain.value = 1 - clampedVal;
      },
      setValueAtTime: (value: number, startTime: number) => {
        const clampedValue = Math.max(0, Math.min(1, value));
        originalSendParam.setValueAtTime(clampedValue, startTime);
        dryGain.gain.setValueAtTime(1 - clampedValue, startTime);
        return originalSendParam;
      },
      linearRampToValueAtTime: (value: number, endTime: number) => {
        const clampedValue = Math.max(0, Math.min(1, value));
        originalSendParam.linearRampToValueAtTime(clampedValue, endTime);
        dryGain.gain.linearRampToValueAtTime(1 - clampedValue, endTime);
        return originalSendParam;
      },
      exponentialRampToValueAtTime: (value: number, endTime: number) => {
        const clampedValue = Math.max(0, Math.min(1, value));
        originalSendParam.exponentialRampToValueAtTime(clampedValue, endTime);
        dryGain.gain.exponentialRampToValueAtTime(1 - clampedValue, endTime);
        return originalSendParam;
      },
      setTargetAtTime: (target: number, startTime: number, timeConstant: number) => {
        const clampedTarget = Math.max(0, Math.min(1, target));
        originalSendParam.setTargetAtTime(clampedTarget, startTime, timeConstant);
        dryGain.gain.setTargetAtTime(1 - clampedTarget, startTime, timeConstant);
        return originalSendParam;
      },
      setValueCurveAtTime: (values: number[] | Float32Array, startTime: number, duration: number) => {
        const clampedValues = Array.from(values).map(v => Math.max(0, Math.min(1, v)));
        const dryValues = clampedValues.map(v => 1 - v);
        originalSendParam.setValueCurveAtTime(new Float32Array(clampedValues), startTime, duration);
        dryGain.gain.setValueCurveAtTime(new Float32Array(dryValues), startTime, duration);
        return originalSendParam;
      },
      cancelScheduledValues: (cancelTime: number) => {
        originalSendParam.cancelScheduledValues(cancelTime);
        dryGain.gain.cancelScheduledValues(cancelTime);
        return originalSendParam;
      },
      cancelAndHoldAtTime: (cancelTime: number) => {
        originalSendParam.cancelAndHoldAtTime(cancelTime);
        dryGain.gain.cancelAndHoldAtTime(cancelTime);
        return originalSendParam;
      },
      // AudioParam properties
      get defaultValue() { return originalSendParam.defaultValue; },
      get maxValue() { return originalSendParam.maxValue; },
      get minValue() { return originalSendParam.minValue; },
      get automationRate() { return originalSendParam.automationRate; },
      set automationRate(value) { originalSendParam.automationRate = value; }
    } as AudioParam;
    
    trackSends[trackKey] = wrappedSendParam;
  });
  
  // Return object with all required properties
  return {
    // Effects chain AudioParams
    echoDelayTime: effectsChain.echoDelayTime,
    echoFeedback: effectsChain.echoFeedback,
    echoLevel: effectsChain.echoLevel,
    reverbLevel: effectsChain.reverbLevel,
    
    // Track-specific properties
    trackSends: trackSends as Record<K, AudioParam>,
    trackInputs: trackInputs as Record<K, AudioNode>,
    
    // AudioEffectNodeBase compatibility
    input: finalSum, // Not used but required for interface compatibility
    connect: (dest: AudioNode) => finalSum.connect(dest),
    disconnect: (dest?: AudioNode) => {
      if (dest) {
        finalSum.disconnect(dest);
      } else {
        finalSum.disconnect();
      }
      // Also disconnect internal nodes
      effectsChain.disconnect();
      dryMix.disconnect();
      wetMix.disconnect();
    },
  };
}

/**
 * Type guard to check if an effects chain has per-track routing
 */
export function hasPerTrackRouting<K extends string>(
  effectsChain: unknown
): effectsChain is ReturnType<typeof createPerTrackEffectsRouter<K>> & {
  trackSends: Record<K, AudioParam>;
  trackInputs: Record<K, AudioNode>;
} {
  return (
    typeof effectsChain === 'object' &&
    effectsChain !== null &&
    'trackSends' in effectsChain &&
    'trackInputs' in effectsChain
  );
}
