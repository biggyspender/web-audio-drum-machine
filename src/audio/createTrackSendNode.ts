import { createCompositeAudioGraph } from "./createCompositeAudioGraph";

/**
 * Creates a track send node that splits audio into dry and wet (send) signals
 * Following the composite audio graph pattern for automatic cleanup
 */
export function createTrackSendNode(
  audioContext: AudioContext,
  effectsInput: AudioNode,
  dryOutput: AudioNode
) {
  return createCompositeAudioGraph<{
    sendLevel: AudioParam;
  }>(audioContext, {}, ({ source }) => {
    // Create gain nodes for send and dry paths
    const sendGain = audioContext.createGain();
    const dryGain = audioContext.createGain();
    
    // Connect input to both paths
    source.connect(sendGain);
    source.connect(dryGain);
    
    // Connect send path to effects chain
    sendGain.connect(effectsInput);
    
    // Connect dry path to dry output
    dryGain.connect(dryOutput);
    
    // Set initial values: 0% send = 100% dry, 100% send = 100% wet + 0% dry
    sendGain.gain.value = 0; // No send initially
    dryGain.gain.value = 1; // Full dry initially
    
    // Wire up automatic dry/wet balancing
    // When send level changes, automatically adjust dry level
    const updateDryLevel = () => {
      dryGain.gain.value = 1 - sendGain.gain.value;
    };
    
    // Expose send level parameter with automatic dry adjustment
    const originalSendParam = sendGain.gain;
    const wrappedSendParam = {
      get value() { return originalSendParam.value; },
      set value(val: number) {
        originalSendParam.value = Math.max(0, Math.min(1, val));
        updateDryLevel();
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
    
    return {
      sendLevel: wrappedSendParam,
    };
  });
}
