import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import { availabilityRecurring, matchupPlayers } from "@/db/schema";
import { slotKey } from "@/lib/time";
import type { PlayerFree } from "@/lib/scheduling/overlap";

/** Set of recurring free slotKeys ("{weekday}-{slotIndex}") for a user. */
export async function getRecurringAvailability(userId: string): Promise<Set<string>> {
  const rows = await db
    .select({ weekday: availabilityRecurring.weekday, slotIndex: availabilityRecurring.slotIndex })
    .from(availabilityRecurring)
    .where(eq(availabilityRecurring.userId, userId));
  return new Set(rows.map((r) => slotKey(r.weekday, r.slotIndex)));
}

/** Free-slot sets for all players in a matchup, for overlap computation. */
export async function getMatchupAvailability(matchupId: number): Promise<PlayerFree[]> {
  const players = await db
    .select({ userId: matchupPlayers.userId })
    .from(matchupPlayers)
    .where(eq(matchupPlayers.matchupId, matchupId));
  const ids = players.map((p) => p.userId);
  if (ids.length === 0) return [];

  const rows = await db
    .select({
      userId: availabilityRecurring.userId,
      weekday: availabilityRecurring.weekday,
      slotIndex: availabilityRecurring.slotIndex,
    })
    .from(availabilityRecurring)
    .where(inArray(availabilityRecurring.userId, ids));

  const byUser = new Map<string, Set<string>>(ids.map((id) => [id, new Set<string>()]));
  for (const r of rows) byUser.get(r.userId)?.add(slotKey(r.weekday, r.slotIndex));
  return ids.map((userId) => ({ userId, free: byUser.get(userId) ?? new Set() }));
}
