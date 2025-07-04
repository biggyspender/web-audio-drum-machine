import { pipeInto } from "ts-functional-pipe";
import { fetchSample } from "./fetchSample";
import type { SampleBuffer } from "./SampleBuffer";
import { toObject } from "./toObject";
import type { SampleMap } from "./SampleMap";

export async function fetchSampleMap<K extends string>(
  samples: Record<K, string>
): Promise<SampleMap<K>> {
  const sampleBuffers = await Promise.all(
    Object.entries(samples).map(async (v) => {
      const [id, url] = v as [K, string];
      const buffer = await fetchSample(url);
      return {
        id,
        buffer,
      };
    })
  );
  return pipeInto(
    sampleBuffers,
    toObject(
      (b) => b.id,
      (b) => ({ id: b.id, buffer: b.buffer } satisfies SampleBuffer<K>)
    )
  ) as SampleMap<K>;
}
