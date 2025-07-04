/**
 * Creates a deterministic random number generator function based on a seed value.
 * The returned function will always produce the same sequence of numbers for the same seed.
 *
 * @param seed - The seed value to initialize the random number generator
 * @returns A function that takes an index and returns a deterministic random number between 0 and 1
 */
export function createSeededRNG(seed: number): (index: number) => number {
  // Implementation of a simple but effective PRNG algorithm (xorshift)
  return (index: number): number => {
    // Combine the seed and index to get a unique starting point
    let state = seed + index * 1000003; // Prime number to help distribution

    // Simple xorshift algorithm
    state ^= state << 13;
    state ^= state >>> 17;
    state ^= state << 5;

    // Convert to a value between 0 and 1
    // We use abs and modulo to ensure we get a positive number less than 1
    //return Math.abs((state % 100000) / 100000);
    return (state >>> 0) / 4294967296;
  };
}
