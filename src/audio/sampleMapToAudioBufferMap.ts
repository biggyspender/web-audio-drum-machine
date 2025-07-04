import type { AudioBufferMap } from "./AudioBufferMap";
import type { SampleBuffer } from "./SampleBuffer";
import type { SampleMap } from "./SampleMap";

export async function sampleMapToAudioBufferMap<K extends string>(
  audioContext: AudioContext,
  sampleMap: SampleMap<K>
): Promise<AudioBufferMap<K>> {
  const promises = Object.entries<SampleBuffer<K>>(sampleMap).map(
    async ([id, { buffer }]) => {
      const audioBuffer = await audioContext.decodeAudioData(buffer.slice(0));
      return [id as K, audioBuffer] as const;
    }
  );
  const ret = Object.fromEntries(await Promise.all(promises)) as Record<
    K,
    AudioBuffer
  >;
  return ret;
}
