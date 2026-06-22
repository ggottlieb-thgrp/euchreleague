import "server-only";
import { and, eq, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { weeks, optIns } from "@/db/schema";
import { getActiveSeason, type League } from "./league";

/**
 * The week currently accepting opt-ins: the latest not-yet-published week
 * (pending or preview) of the active season. Null when there isn't one open.
 */
export async function getOptInWeek(league: League) {
  const season = await getActiveSeason(league);
  if (!season) return null;
  const open = await db.query.weeks.findMany({
    where: eq(weeks.seasonId, season.id),
    orderBy: [desc(weeks.weekNumber)],
  });
  return open.find((w) => w.status === "pending" || w.status === "preview") ?? null;
}

export async function getUserOptIn(userId: string, weekId: number): Promise<boolean> {
  const row = await db.query.optIns.findFirst({
    where: and(eq(optIns.userId, userId), eq(optIns.weekId, weekId)),
  });
  // Default to opted-in if they haven't set a preference yet.
  return row ? row.optedIn : true;
}

/** User ids opted in for a week (respecting explicit opt-outs). */
export async function getOptedInUserIds(weekId: number, candidateIds: string[]): Promise<string[]> {
  if (candidateIds.length === 0) return [];
  const rows = await db
    .select({ userId: optIns.userId, optedIn: optIns.optedIn })
    .from(optIns)
    .where(and(eq(optIns.weekId, weekId), inArray(optIns.userId, candidateIds)));
  const explicit = new Map(rows.map((r) => [r.userId, r.optedIn]));
  // Default opted-in unless explicitly opted out.
  return candidateIds.filter((id) => explicit.get(id) !== false);
}
