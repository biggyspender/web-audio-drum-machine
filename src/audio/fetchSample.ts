export async function fetchSample(url: string): Promise<ArrayBuffer> {
  const r = await fetch(url);
  return await r.arrayBuffer();
}
