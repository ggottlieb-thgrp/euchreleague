"use server";

import { revalidatePath } from "next/cache";
import { and, eq, max, ne } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  seasons,
  weeks,
  matchups,
  matchupPlayers,
  locations,
  announcements,
  optIns,
} from "@/db/schema";
import { requireAdmin } from "@/lib/auth-helpers";
import { generateWeekPairings } from "@/lib/league/generate";
import { publishWeek } from "@/lib/league/publish";
import type { League } from "@/lib/data/league";

function revalidateLeague() {
  for (const p of ["/admin", "/admin/pairings", "/pairings", "/dashboard", "/history"]) {
    revalidatePath(p);
  }
}

/* ---------------------------- Seasons & weeks --------------------------- */

export async function createSeason(input: {
  name: string;
  league: League;
  numWeeks: number;
}) {
  await requireAdmin();
  // Deactivate any prior active season for this league.
  await db
    .update(seasons)
    .set({ isActive: false })
    .where(and(eq(seasons.league, input.league), eq(seasons.isActive, true)));
  const [s] = await db
    .insert(seasons)
    .values({ name: input.name, league: input.league, numWeeks: input.numWeeks, isActive: true })
    .returning({ id: seasons.id });
  revalidateLeague();
  return { ok: true, seasonId: s.id };
}

/** Create the next week (pending, accepting opt-ins) for a season. */
export async function createNextWeek(seasonId: number, scoresDueAt?: Date) {
  await requireAdmin();
  const [{ value: maxNum }] = await db
    .select({ value: max(weeks.weekNumber) })
    .from(weeks)
    .where(eq(weeks.seasonId, seasonId));
  const weekNumber = (maxNum ?? 0) + 1;
  const [w] = await db
    .insert(weeks)
    .values({ seasonId, weekNumber, status: "pending", scoresDueAt: scoresDueAt ?? null })
    .returning({ id: weeks.id });
  revalidateLeague();
  return { ok: true, weekId: w.id, weekNumber };
}

export async function generatePairingsAction(weekId: number) {
  await requireAdmin();
  try {
    const res = await generateWeekPairings(weekId);
    revalidateLeague();
    return { ok: true, ...res };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to generate." };
  }
}

export async function publishWeekAction(weekId: number, opts: { notify?: boolean } = {}) {
  await requireAdmin();
  try {
    await publishWeek(weekId, opts);
    revalidateLeague();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to publish." };
  }
}

export async function unpublishWeekAction(weekId: number) {
  await requireAdmin();
  await db.update(weeks).set({ status: "preview", publishedAt: null }).where(eq(weeks.id, weekId));
  revalidateLeague();
  return { ok: true };
}

/* ------------------------------- Matchups ------------------------------- */

/**
 * Replace a matchup's roster. A real matchup always needs exactly four
 * distinct players; a bye group can hold any number.
 *
 * Anyone newly added who is currently seated somewhere else this week is
 * automatically pulled out of that spot first — as long as it's the bye
 * group they're coming from. Anyone dropped from a real matchup (and not
 * picked up elsewhere in this same save) is automatically moved onto that
 * week's bye group instead of just disappearing. Pulling a player out of a
 * *real* matchup this way is rejected — move them to bye first, then bring
 * them into the new matchup.
 */
export async function setMatchupPlayers(matchupId: number, userIds: string[]) {
  await requireAdmin();

  const matchup = await db.query.matchups.findFirst({ where: eq(matchups.id, matchupId) });
  if (!matchup) return { ok: false, error: "Matchup not found." };

  const filtered = userIds.filter((id) => id !== "");
  if (new Set(filtered).size !== filtered.length) {
    return { ok: false, error: "Pick distinct players — no duplicates." };
  }
  if (!matchup.isBye && filtered.length !== 4) {
    return { ok: false, error: "Pick four distinct players." };
  }

  const currentRows = await db
    .select({ userId: matchupPlayers.userId })
    .from(matchupPlayers)
    .where(eq(matchupPlayers.matchupId, matchupId));
  const currentIds = new Set(currentRows.map((r) => r.userId));

  const added = filtered.filter((id) => !currentIds.has(id));
  const removed = [...currentIds].filter((id) => !filtered.includes(id));

  // Anyone coming in from elsewhere this week must be coming from the bye
  // group — pull them out of it. Coming from a real matchup is rejected so
  // we never silently leave that other matchup short a player.
  for (const userId of added) {
    const [elsewhere] = await db
      .select({ matchupId: matchupPlayers.matchupId, isBye: matchups.isBye })
      .from(matchupPlayers)
      .innerJoin(matchups, eq(matchups.id, matchupPlayers.matchupId))
      .where(
        and(
          eq(matchupPlayers.userId, userId),
          eq(matchups.weekId, matchup.weekId),
          ne(matchupPlayers.matchupId, matchupId),
        ),
      );
    if (!elsewhere) continue;
    if (!elsewhere.isBye) {
      return {
        ok: false,
        error: "One of the selected players is already in another matchup this week — move them to bye first.",
      };
    }
    await db
      .delete(matchupPlayers)
      .where(
        and(eq(matchupPlayers.matchupId, elsewhere.matchupId), eq(matchupPlayers.userId, userId)),
      );
  }

  await db.delete(matchupPlayers).where(eq(matchupPlayers.matchupId, matchupId));
  await db
    .insert(matchupPlayers)
    .values(filtered.map((userId, seat) => ({ matchupId, userId, seat })));

  // Anyone dropped from a real matchup goes on bye instead of vanishing.
  if (!matchup.isBye && removed.length > 0) {
    let byeMatchup = await db.query.matchups.findFirst({
      where: and(
        eq(matchups.weekId, matchup.weekId),
        eq(matchups.league, matchup.league),
        eq(matchups.isBye, true),
      ),
    });
    if (!byeMatchup) {
      [byeMatchup] = await db
        .insert(matchups)
        .values({ weekId: matchup.weekId, league: matchup.league, isBye: true })
        .returning();
    }
    const byeRows = await db
      .select({ userId: matchupPlayers.userId })
      .from(matchupPlayers)
      .where(eq(matchupPlayers.matchupId, byeMatchup.id));
    const byeIds = [...new Set([...byeRows.map((r) => r.userId), ...removed])];
    await db.delete(matchupPlayers).where(eq(matchupPlayers.matchupId, byeMatchup.id));
    await db
      .insert(matchupPlayers)
      .values(byeIds.map((userId, seat) => ({ matchupId: byeMatchup!.id, userId, seat })));
  }

  // Clean up any bye group that a save just emptied out.
  const byeMatchups = await db
    .select({ id: matchups.id })
    .from(matchups)
    .where(and(eq(matchups.weekId, matchup.weekId), eq(matchups.isBye, true)));
  for (const bm of byeMatchups) {
    const rows = await db
      .select({ userId: matchupPlayers.userId })
      .from(matchupPlayers)
      .where(eq(matchupPlayers.matchupId, bm.id));
    if (rows.length === 0) {
      await db.delete(matchups).where(eq(matchups.id, bm.id));
    }
  }

  revalidateLeague();
  return { ok: true };
}

export async function deleteMatchup(matchupId: number) {
  await requireAdmin();
  await db.delete(matchups).where(eq(matchups.id, matchupId));
  revalidateLeague();
  return { ok: true };
}

/* -------------------------------- Users --------------------------------- */

export async function setUserRole(userId: string, role: "player" | "admin") {
  await requireAdmin();
  await db.update(users).set({ role }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function setUserLeague(userId: string, league: League) {
  await requireAdmin();
  await db.update(users).set({ league }).where(eq(users.id, userId));
  revalidatePath("/admin/users");
  return { ok: true };
}

export async function removeUser(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) return { ok: false, error: "You can't remove yourself." };
  await db.delete(users).where(eq(users.id, userId));
  revalidatePath("/admin/users");
  return { ok: true };
}

/** Set a player's opt-in status for the currently open week on their behalf. */
export async function setUserOptInAdmin(userId: string, weekId: number, optedIn: boolean) {
  await requireAdmin();
  await db
    .insert(optIns)
    .values({ userId, weekId, optedIn, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [optIns.userId, optIns.weekId],
      set: { optedIn, updatedAt: new Date() },
    });
  revalidatePath("/admin/users");
  revalidatePath("/pairings");
  revalidatePath("/dashboard");
  return { ok: true };
}

/* ------------------------------ Locations ------------------------------- */

export async function createLocation(input: {
  name: string;
  building?: string;
  floor?: string;
  capacity?: number;
}) {
  await requireAdmin();
  await db.insert(locations).values({
    name: input.name,
    building: input.building || null,
    floor: input.floor || null,
    capacity: input.capacity ?? null,
  });
  revalidatePath("/admin/locations");
  revalidatePath("/availability");
  return { ok: true };
}

export async function toggleLocation(id: number, active: boolean) {
  await requireAdmin();
  await db.update(locations).set({ active }).where(eq(locations.id, id));
  revalidatePath("/admin/locations");
  return { ok: true };
}

/* ---------------------------- Announcements ----------------------------- */

export async function createAnnouncement(input: { title: string; body: string }) {
  const admin = await requireAdmin();
  if (!input.title.trim() || !input.body.trim()) {
    return { ok: false, error: "Title and body are required." };
  }
  await db
    .insert(announcements)
    .values({ title: input.title.trim(), body: input.body.trim(), authorId: admin.id });
  revalidatePath("/announcements");
  revalidatePath("/admin/announcements");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteAnnouncement(id: number) {
  await requireAdmin();
  await db.delete(announcements).where(eq(announcements.id, id));
  revalidatePath("/announcements");
  revalidatePath("/admin/announcements");
  return { ok: true };
}
