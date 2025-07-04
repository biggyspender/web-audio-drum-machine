import type { PlaySample } from "./PlaySample";
import type { Sequence } from "./Sequence";

/**
 * Applies swing to a play sample by adjusting its timing
 * @param slotIndex The index of the time slot
 * @param slotDuration The duration of one time slot
 * @param sequence The sequence containing swing settings
 * @param beatDuration The duration of one beat
 * @param swingValue The amount of swing to apply (0.5=none, 0.67=triplet, 1.0=full)
 * @param playSample The play sample to apply swing to
 * @returns The sample with swing timing applied
 */
export function applySwing<K extends string>(
  slotIndex: number,
  slotDuration: number,
  sequence: Sequence<K>,
  beatDuration: number,
  swingValue: number,
  playSample: PlaySample<K>
) {
  // Apply swing to even-numbered 16th notes
  let time = slotIndex * slotDuration;

  // Calculate whether this slot is an even-numbered 16th note that needs swing
  // First, convert the slot index to a 16th note position
  const slotsPerBeat = sequence.timeSignature[1]; // e.g., 4 slots per beat in 4/4
  const sixteenthNotesPerBeat = 4; // 16th notes per beat is always 4
  const sixteenthNotesPerSlot = sixteenthNotesPerBeat / slotsPerBeat;

  // Calculate the 16th note position (0-based)
  const sixteenthPosition = slotIndex * sixteenthNotesPerSlot;

  // Check if this is a 16th note position (not an 8th, quarter, etc.)
  if (Number.isInteger(sixteenthPosition)) {
    // Check if it's an even-numbered 16th note (2nd, 4th, etc. = odd indices at 0-based)
    if (sixteenthPosition % 2 === 1) {
      // Apply swing - calculate the delay amount based on the swing percentage
      // At 0.5, there should be no swing (evenly spaced 16ths)
      // At 0.667, it's a perfect triplet swing
      // At 1.0, the 2nd 16th aligns with the next 8th note
      // Duration of a 16th note
      const sixteenthNoteDuration = beatDuration / 4;

      // Maximum swing would move the 16th note all the way to the next 8th note
      const maxSwingOffset = sixteenthNoteDuration;

      // Calculate swing offset:
      // 0.5 = no swing (0 offset)
      // 1.0 = full swing (moved to next 8th note)
      const swingOffset = (swingValue - 0.5) * 2 * maxSwingOffset;

      time += swingOffset;
    }
  }

  return {
    playSample,
    time,
  };
}
