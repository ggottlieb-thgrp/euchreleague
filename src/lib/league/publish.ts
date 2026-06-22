import "server-only";
import { and, eq, max } from "drizzle-orm";
import { db } from "@/db";
import { weeks, seasons, announcements } from "@/db/schema";
import { notifyPairingsPublished } from "@/lib/notifications";

/**
 * Ensure the next pending week exists so opt-ins can accumulate during the
 * current play-week. Respects the season's configured number of weeks.
 */
async function ensureNextPendingWeek(seasonId: number) {
  const season = await db.query.seasons.findFirst({ where: eq(seasons.id, seasonId) });
  if (!season) return;
  const [{ value: maxNum }] = await db
    .select({ value: max(weeks.weekNumber) })
    .from(weeks)
    .where(eq(weeks.seasonId, seasonId));
  const current = maxNum ?? 0;
  if (current >= season.numWeeks) return; // season is full
  // Only create if there isn't already a not-yet-published week waiting.
  const existing = await db.query.weeks.findFirst({
    where: and(eq(weeks.seasonId, seasonId), eq(weeks.status, "pending")),
  });
  if (existing) return;
  await db.insert(weeks).values({ seasonId, weekNumber: current + 1, status: "pending" });
}

/**
 * Publish a week: flip status, post an announcement, and fan out notifications.
 * Idempotent — calling it on an already-published week is a no-op. Shared by
 * the admin "Publish" button and the auto-publish cron.
 */
export async function publishWeek(weekId: number, opts: { postAnnouncement?: boolean } = {}) {
  const week = await db.query.weeks.findFirst({ where: eq(weeks.id, weekId) });
  if (!week) throw new Error("Week not found");
  if (week.status === "published" || week.status === "completed") {
    return { ok: true, alreadyPublished: true };
  }

  await db
    .update(weeks)
    .set({ status: "published", publishedAt: new Date() })
    .where(eq(weeks.id, weekId));

  if (opts.postAnnouncement !== false) {
    await db.insert(announcements).values({
      title: `Week ${week.weekNumber} pairings are up!`,
      body: `This week's matchups have been posted. Check the Pairings tab to see your group, then head to Schedule to lock in a time and place to play. Scores are due Friday — good luck!`,
    });
  }

  // Open the next week for opt-ins.
  await ensureNextPendingWeek(week.seasonId);

  // Email fan-out (best-effort; never blocks publishing).
  try {
    await notifyPairingsPublished(weekId);
  } catch (err) {
    console.error("notifyPairingsPublished failed:", err);
  }

  return { ok: true, alreadyPublished: false };
}
