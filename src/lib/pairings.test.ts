import { describe, it, expect } from "vitest";
import { shuffle, generatePairings, seededRng } from "./pairings";

describe("shuffle", () => {
  it("preserves all elements", () => {
    const input = Array.from({ length: 20 }, (_, i) => `u${i}`);
    const out = shuffle(input, seededRng(42));
    expect(out).toHaveLength(20);
    expect(new Set(out)).toEqual(new Set(input));
  });

  it("is deterministic for a fixed seed", () => {
    const input = ["a", "b", "c", "d", "e"];
    expect(shuffle(input, seededRng(7))).toEqual(shuffle(input, seededRng(7)));
  });

  it("is unbiased across positions over many runs", () => {
    // Sanity check Fisher-Yates: element 'a' lands roughly uniformly in each slot.
    const input = ["a", "b", "c", "d"];
    const counts = [0, 0, 0, 0];
    const N = 8000;
    for (let i = 0; i < N; i++) {
      const out = shuffle(input, seededRng(i + 1));
      counts[out.indexOf("a")]++;
    }
    for (const c of counts) {
      expect(c / N).toBeGreaterThan(0.2);
      expect(c / N).toBeLessThan(0.3);
    }
  });
});

describe("generatePairings", () => {
  it("chunks into groups of 4", () => {
    const ids = Array.from({ length: 8 }, (_, i) => `u${i}`);
    const groups = generatePairings(ids, seededRng(1));
    expect(groups).toHaveLength(2);
    expect(groups.every((g) => g.playerIds.length === 4 && !g.isBye)).toBe(true);
  });

  it("marks a leftover group as a bye", () => {
    const ids = Array.from({ length: 6 }, (_, i) => `u${i}`);
    const groups = generatePairings(ids, seededRng(1));
    expect(groups).toHaveLength(2);
    expect(groups[0].isBye).toBe(false);
    expect(groups[1]).toMatchObject({ isBye: true });
    expect(groups[1].playerIds).toHaveLength(2);
  });

  it("includes every player exactly once", () => {
    const ids = Array.from({ length: 11 }, (_, i) => `u${i}`);
    const groups = generatePairings(ids, seededRng(99));
    const all = groups.flatMap((g) => g.playerIds);
    expect(new Set(all)).toEqual(new Set(ids));
    expect(all).toHaveLength(11);
  });

  it("handles empty input", () => {
    expect(generatePairings([], seededRng(1))).toEqual([]);
  });
});
