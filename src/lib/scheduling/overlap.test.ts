import { describe, it, expect } from "vitest";
import { findCommonWindows, suggestWindows, type PlayerFree } from "./overlap";

function player(userId: string, slotKeys: string[]): PlayerFree {
  return { userId, free: new Set(slotKeys) };
}

// Helper to make a contiguous run of slot keys on a weekday.
function run(weekday: number, from: number, to: number): string[] {
  const out: string[] = [];
  for (let s = from; s <= to; s++) out.push(`${weekday}-${s}`);
  return out;
}

describe("findCommonWindows", () => {
  it("finds a full 4-player overlap window", () => {
    const players = [
      player("a", run(1, 8, 12)),
      player("b", run(1, 9, 14)),
      player("c", run(1, 8, 11)),
      player("d", run(1, 9, 13)),
    ];
    const windows = findCommonWindows(players, { minSlots: 3 });
    expect(windows.length).toBeGreaterThan(0);
    const best = windows[0];
    expect(best.allFree).toBe(true);
    expect(best.weekday).toBe(1);
    // common region is slots 9..11 (all four overlap)
    expect(best.startSlot).toBe(9);
    expect(best.availableUserIds.sort()).toEqual(["a", "b", "c", "d"]);
  });

  it("merges consecutive equal-availability windows into one longer window", () => {
    const players = [player("a", run(0, 0, 9)), player("b", run(0, 0, 9))];
    const windows = findCommonWindows(players, { minSlots: 3 });
    // One merged window covering the whole free run.
    expect(windows[0].startSlot).toBe(0);
    expect(windows[0].endSlot).toBe(10);
    expect(windows[0].allFree).toBe(true);
  });

  it("returns nothing when fewer than required are free for a full window", () => {
    const players = [
      player("a", run(1, 0, 2)),
      player("b", run(2, 0, 2)), // different day
    ];
    expect(findCommonWindows(players, { minSlots: 3 })).toHaveLength(0);
  });
});

describe("suggestWindows", () => {
  it("degrades to all-but-one when no full overlap exists", () => {
    const players = [
      player("a", run(1, 8, 11)),
      player("b", run(1, 8, 11)),
      player("c", run(1, 8, 11)),
      player("d", run(3, 8, 11)), // d only free a different day
    ];
    const { windows, degraded } = suggestWindows(players, 3);
    expect(degraded).toBe(true);
    expect(windows[0].availableUserIds.sort()).toEqual(["a", "b", "c"]);
    expect(windows[0].missingUserIds).toEqual(["d"]);
  });

  it("prefers full overlap and is not degraded when it exists", () => {
    const players = [player("a", run(1, 8, 12)), player("b", run(1, 8, 12))];
    const { degraded } = suggestWindows(players, 3);
    expect(degraded).toBe(false);
  });
});
