import type { PlaySample } from "./PlaySample";

export function createSource<K extends string>({
  audioContext,
  audioBufferMap,
  playSample,
  destination,
}: CreateSourceOpts<K>) {
  const audioBuffer = audioBufferMap[playSample.sample.id];
  const source = audioContext.createBufferSource();
  source.buffer = audioBuffer;
  source.playbackRate.value = 1;
  const gainNode = audioContext.createGain();
  gainNode.gain.value = Math.max(0, Math.min(playSample.velocity / 255, 1));
  source.connect(gainNode);
  gainNode.connect(destination);

  function endHandler() {
    source.stop();
    gainNode.disconnect(destination);
    source.disconnect(gainNode);
    source.removeEventListener("ended", endHandler);
  }
  source.addEventListener("ended", endHandler);
  return source;
}
type CreateSourceOpts<K extends string> = {
  audioContext: AudioContext;
  audioBufferMap: Record<K, AudioBuffer>;
  playSample: PlaySample<K>;
  destination: AudioNode;
};
