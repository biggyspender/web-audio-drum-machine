import type { SampleBuffer } from "../../../audio/SampleBuffer";
import { decodePatternFromUrlSafe } from "../../../audio/urlSafeEncoding";
import type { GridState } from "../types";
export function createDefaultGridPattern<K extends string>(
  _sampleMap: Record<K, SampleBuffer<K>>
): GridState<K> {
  const encodedPattern =
    "HiQAOwdkZWZhdWx0BO9rLF4AAD1FACyAJAAAADwAAAAAfwAAAAAAAAB_AAAAU0y_ObVQq1l3sk3qUktOAAAAAAAAAAAAAAAAAAAATF4~";
  const decodedPattern = decodePatternFromUrlSafe(encodedPattern);
  if (!decodedPattern) {
    throw new Error("Failed to decode default pattern");
  }
  return decodedPattern.grid as GridState<K>;
}
