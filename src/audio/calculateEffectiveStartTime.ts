import type { Sequence } from "./Sequence";

export function calculateEffectiveStartTime<K extends string>({
  playbackTime,
  currentEffectiveStartTime,
  currentBpm,
  currentSeq,
}: {
  playbackTime: number;
  currentEffectiveStartTime: number;
  currentBpm: number;
  currentSeq: Sequence<K>;
}) {
  const elapsedTime = playbackTime - currentEffectiveStartTime;

  // Calculate sequence duration with current BPM
  const beatDuration = 60 / currentBpm;
  const barDuration = currentSeq.timeSignature[0] * beatDuration;
  const sequenceDuration = currentSeq.bars * barDuration;

  // Calculate current phase (0-1) within the sequence loop
  const phase = (elapsedTime % sequenceDuration) / sequenceDuration;

  // Calculate new sequence duration with new BPM
  const newBeatDuration = 60 / currentSeq.bpm;
  const newBarDuration = currentSeq.timeSignature[0] * newBeatDuration;
  const newSequenceDuration = currentSeq.bars * newBarDuration;

  // Adjust effective start time to maintain the same phase with new BPM
  return playbackTime - phase * newSequenceDuration;
}
