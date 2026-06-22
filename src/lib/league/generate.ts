import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { weeks, matchups, matchupPlayers, games, users } from "@/db/schema";
import { generatePairings } from "@/lib/pairings";
import { getOptedInUserIds } from "@/lib/data/optin";
import type { League } from "@/lib/data/league";

/**
 * Generate (or regenerate) pairings for a week and leave it in `preview`.
 * Shared by the admin "Generate" button and the weekly cron so there's one
 * code path. neon-http has no multi-statement transactions, so this runs
 * sequentially; the leading delete makes it idempotent/safe to re-run.
 */
export async function generateWeekPairings(weekId: number) {
  const week = await db.query.weeks.findFirst({ where: eq(weeks.id, weekId) });
  if (!week) throw new Error("Week not found");
  if (week.status === "published" || week.status === "completed") {
    throw new Error("Week is already published — unpublish before regenerating.");
  }

  // Determine the league from the week's season.
  const seasonRow = await db.query.seasons.findFirst({
    where: (s, { eq: eqf }) => eqf(s.id, week.seasonId),
  });
  if (!seasonRow) throw new Error("Season not found");
  const league = seasonRow.league as League;

  // Candidate players = everyone in this league.
  const candidates = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.league, league));
  const candidateIds = candidates.map((c) => c.id);
  const optedIds = await getOptedInUserIds(weekId, candidateIds);

  // Clear any prior matchups for this week (cascade removes players/games).
  await db.delete(matchups).where(eq(matchups.weekId, weekId));

  const groups = generatePairings(optedIds);
  let created = 0;

  for (const group of groups) {
    const [m] = await db
      .insert(matchups)
      .values({ weekId, league, isBye: group.isBye })
      .returning({ id: matchups.id });

    await db.insert(matchupPlayers).values(
      group.playerIds.map((userId, seat) => ({ matchupId: m.id, userId, seat })),
    );

    if (!group.isBye) {
      // Pre-create the 3 games with the standard partner rotation.
      await db.insert(games).values(
        [1, 2, 3].map((gameNum) => ({
          matchupId: m.id,
          gameNum,
          comboIndex: gameNum - 1,
        })),
      );
    }
    created++;
  }

  await db
    .update(weeks)
    .set({ status: "preview", generatedAt: new Date() })
    .where(eq(weeks.id, weekId));

  return { matchups: created, players: optedIds.length };
}
