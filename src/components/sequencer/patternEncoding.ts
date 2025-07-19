// Utility functions for encoding/decoding drum patterns as base64 JSON

export function encodePatternToBase64(pattern: unknown): string {
  const json = JSON.stringify(pattern);
  // btoa handles only ASCII, so encodeURIComponent is used for UTF-8 safety
  return btoa(encodeURIComponent(json));
}

export function decodePatternFromBase64(encoded: string): unknown {
  try {
    const json = decodeURIComponent(atob(encoded));
    return JSON.parse(json);
  } catch {
    return null;
  }
}
