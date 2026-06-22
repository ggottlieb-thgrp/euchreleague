/**
 * Find common play windows for a matchup's players from their free slot sets.
 *
 * Availability is a fixed grid of 30-min slots (see lib/time.ts), so overlap is
 * a set intersection per slot. We slide a window of `minSlots` (a game is ~90
 * min = 3 slots) across each weekday and report windows where enough players
 * are free for the whole window. When no full overlap exists we degrade to
 * windows where all-but-one are free, flagged with who's missing.
 */
import { SLOTS_PER_DAY, WEEKDAYS, SLOT_MINUTES } from "@/lib/time";

export interface PlayerFree {
  userId: string;
  /** Set of free slotKeys ("{weekday}-{slotIndex}"). */
  free: Set<string>;
}

export interface CommonWindow {
  weekday: number;
  startSlot: number;
  endSlot: number; // exclusive
  durationMin: number;
  availableUserIds: string[];
  missingUserIds: string[];
  allFree: boolean;
}

export interface FindWindowsOptions {
  /** Window length in slots (default 3 = 90 min). */
  minSlots?: number;
  /** Minimum players free for the whole window. Defaults to all players. */
  requireCount?: number;
}

function key(weekday: number, slot: number) {
  return `${weekday}-${slot}`;
}

/**
 * Returns windows ranked best-first: all-free first, then by player count,
 * then earlier in the week / day, then longer windows.
 */
export function findCommonWindows(
  players: PlayerFree[],
  opts: FindWindowsOptions = {},
): CommonWindow[] {
  const minSlots = opts.minSlots ?? 3;
  const total = players.length;
  const requireCount = opts.requireCount ?? total;
  const allIds = players.map((p) => p.userId);

  const windows: CommonWindow[] = [];

  for (const weekday of WEEKDAYS) {
    // For each start slot, who is free for the entire window?
    type Raw = { start: number; available: string[] };
    const raws: Raw[] = [];
    for (let start = 0; start + minSlots <= SLOTS_PER_DAY; start++) {
      const available = players
        .filter((p) => {
          for (let s = start; s < start + minSlots; s++) {
            if (!p.free.has(key(weekday, s))) return false;
          }
          return true;
        })
        .map((p) => p.userId);
      if (available.length >= requireCount) raws.push({ start, available });
    }

    // Merge consecutive start positions with the same available set into one
    // longer window so the UI shows "Tue 12:00–1:30" instead of 3 overlapping rows.
    let i = 0;
    while (i < raws.length) {
      const setStr = [...raws[i].available].sort().join(",");
      let j = i;
      while (
        j + 1 < raws.length &&
        raws[j + 1].start === raws[j].start + 1 &&
        [...raws[j + 1].available].sort().join(",") === setStr
      ) {
        j++;
      }
      const startSlot = raws[i].start;
      const endSlot = raws[j].start + minSlots;
      const available = raws[i].available;
      windows.push({
        weekday,
        startSlot,
        endSlot,
        durationMin: (endSlot - startSlot) * SLOT_MINUTES,
        availableUserIds: available,
        missingUserIds: allIds.filter((id) => !available.includes(id)),
        allFree: available.length === total,
      });
      i = j + 1;
    }
  }

  return windows.sort(rankWindows);
}

function rankWindows(a: CommonWindow, b: CommonWindow): number {
  if (a.allFree !== b.allFree) return a.allFree ? -1 : 1;
  if (a.availableUserIds.length !== b.availableUserIds.length)
    return b.availableUserIds.length - a.availableUserIds.length;
  if (a.weekday !== b.weekday) return a.weekday - b.weekday;
  if (a.startSlot !== b.startSlot) return a.startSlot - b.startSlot;
  return b.durationMin - a.durationMin;
}

/**
 * Convenience: full overlap if any exists, otherwise the best-effort
 * "all but one" windows. Returns `{ windows, degraded }`.
 */
export function suggestWindows(
  players: PlayerFree[],
  minSlots = 3,
): { windows: CommonWindow[]; degraded: boolean } {
  const full = findCommonWindows(players, { minSlots });
  if (full.length > 0) return { windows: full, degraded: false };
  if (players.length <= 1) return { windows: [], degraded: false };
  const partial = findCommonWindows(players, {
    minSlots,
    requireCount: players.length - 1,
  });
  return { windows: partial, degraded: partial.length > 0 };
}
