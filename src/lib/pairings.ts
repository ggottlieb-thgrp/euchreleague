/**
 * Weekly pairing generation, ported and hardened from Season 1
 * (index.html ~lines 979-999). Fixes the biased `sort(() => Math.random()-0.5)`
 * shuffle by using Fisher-Yates.
 */

export type Rng = () => number; // returns [0, 1)

/** In-place Fisher-Yates shuffle on a copy; deterministic when `rng` is seeded. */
export function shuffle<T>(items: readonly T[], rng: Rng = Math.random): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface PairingGroup {
  /** Ordered player ids; index === seat (0..3). */
  playerIds: string[];
  /** True when the group has fewer than 4 players and sits out. */
  isBye: boolean;
}

/**
 * Shuffle opted-in player ids and chunk into groups of 4. Any leftover group
 * with fewer than 4 players is marked as a bye.
 */
export function generatePairings(
  optedInUserIds: readonly string[],
  rng: Rng = Math.random,
): PairingGroup[] {
  const shuffled = shuffle(optedInUserIds, rng);
  const groups: PairingGroup[] = [];
  for (let i = 0; i < shuffled.length; i += 4) {
    const chunk = shuffled.slice(i, i + 4);
    groups.push({ playerIds: chunk, isBye: chunk.length < 4 });
  }
  return groups;
}

/**
 * Mulberry32 — a small seedable PRNG, used for previews/tests so a generated
 * preview is reproducible from a seed if we ever want that.
 */
export function seededRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
