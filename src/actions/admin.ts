"use server";

import { revalidatePath } from "next/cache";
import { and, eq, max } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  seasons,
  weeks,
  matchups,
  matchupPlayers,
  locations,
  announcements,
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

export async function publishWeekAction(weekId: number) {
  await requireAdmin();
  try {
    await publishWeek(weekId);
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

/** Replace the four seated players of a matchup (seat order preserved). */
export async function setMatchupPlayers(matchupId: number, userIds: string[]) {
  await requireAdmin();
  if (userIds.length !== 4 || new Set(userIds).size !== 4) {
    return { ok: false, error: "Pick four distinct players." };
  }
  await db.delete(matchupPlayers).where(eq(matchupPlayers.matchupId, matchupId));
  await db
    .insert(matchupPlayers)
    .values(userIds.map((userId, seat) => ({ matchupId, userId, seat })));
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
