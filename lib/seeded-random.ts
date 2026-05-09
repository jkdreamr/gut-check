// lib/seeded-random.ts — tiny deterministic RNG seeded from a string.
//
// We use this to fill gaps in real Newnal data with stable, plausible
// signals (gym cancellation history, subscription usage frequency, etc).
// Two calls with the same DID always produce the same synthesized profile,
// so screenshots, demos, and proposal logs stay reproducible.

function hashString(str: string): number {
  let hash = 2166136261;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function makeRng(seed: string) {
  let state = hashString(seed) || 1;
  function next(): number {
    // mulberry32
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  return {
    next,
    int(minInclusive: number, maxInclusive: number): number {
      return Math.floor(next() * (maxInclusive - minInclusive + 1)) + minInclusive;
    },
    pick<T>(arr: readonly T[]): T {
      return arr[Math.floor(next() * arr.length)];
    },
    chance(prob: number): boolean {
      return next() < prob;
    },
    sample<T>(arr: readonly T[], k: number): T[] {
      const copy = arr.slice();
      const out: T[] = [];
      for (let i = 0; i < k && copy.length; i++) {
        const idx = Math.floor(next() * copy.length);
        out.push(copy[idx]);
        copy.splice(idx, 1);
      }
      return out;
    },
  };
}

export type SeededRng = ReturnType<typeof makeRng>;
