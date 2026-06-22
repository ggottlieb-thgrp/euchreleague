"use server";

import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { games, gameScores, matchups, matchupPlayers } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { buildGameScoreRows, winningTeam, type ComboIndex } from "@/lib/euchre";

export interface SubmitGameInput {
  matchupId: number;
  gameNum: number;
  comboIndex: ComboIndex;
  scoreTeam0: number;
  scoreTeam1: number;
}

export async function submitGame(input: SubmitGameInput) {
  const user = await requireUser();
  const { matchupId, gameNum, comboIndex, scoreTeam0, scoreTeam1 } = input;

  // Validate inputs
  if (![1, 2, 3].includes(gameNum)) return { ok: false, error: "Invalid game." };
  if (![0, 1, 2].includes(comboIndex)) return { ok: false, error: "Invalid pairing." };
  for (const s of [scoreTeam0, scoreTeam1]) {
    if (!Number.isInteger(s) || s < 0 || s > 40) {
      return { ok: false, error: "Scores must be whole numbers between 0 and 40." };
    }
  }

  // Authorize: participant or admin
  const players = await db
    .select({ userId: matchupPlayers.userId, seat: matchupPlayers.seat })
    .from(matchupPlayers)
    .where(eq(matchupPlayers.matchupId, matchupId));
  const isParticipant = players.some((p) => p.userId === user.id);
  if (!isParticipant && user.role !== "admin") {
    return { ok: false, error: "You're not in this matchup." };
  }

  const matchup = await db.query.matchups.findFirst({ where: eq(matchups.id, matchupId) });
  if (!matchup || matchup.isBye) return { ok: false, error: "No scores for a bye." };
  if (matchup.league === "casual") {
    return { ok: false, error: "The casual league does not track scores." };
  }

  // Map seat -> userId
  const seatUserIds: string[] = [];
  for (const p of players) seatUserIds[p.seat] = p.userId;
  if (seatUserIds.filter(Boolean).length !== 4) {
    return { ok: false, error: "Matchup isn't fully seated." };
  }

  const winnerTeam = scoreTeam0 === scoreTeam1 ? null : winningTeam(scoreTeam0, scoreTeam1);
  const rows = buildGameScoreRows(seatUserIds, comboIndex, scoreTeam0, scoreTeam1);

  // Upsert the game, then replace its score rows.
  const [game] = await db
    .insert(games)
    .values({
      matchupId,
      gameNum,
      comboIndex,
      winnerTeam,
      submittedAt: new Date(),
      submittedBy: user.id,
    })
    .onConflictDoUpdate({
      target: [games.matchupId, games.gameNum],
      set: { comboIndex, winnerTeam, submittedAt: new Date(), submittedBy: user.id },
    })
    .returning({ id: games.id });

  await db.delete(gameScores).where(eq(gameScores.gameId, game.id));
  await db
    .insert(gameScores)
    .values(rows.map((r) => ({ gameId: game.id, userId: r.userId, points: r.points, team: r.team })));

  revalidatePath("/scores");
  revalidatePath("/history");
  revalidatePath("/leaderboard");
  revalidatePath("/dashboard");
  return { ok: true };
}

/** Used by admins to clear a submitted game. */
export async function clearGame(matchupId: number, gameNum: number) {
  const user = await requireUser();
  if (user.role !== "admin") return { ok: false, error: "Admins only." };
  await db.delete(games).where(and(eq(games.matchupId, matchupId), eq(games.gameNum, gameNum)));
  revalidatePath("/scores");
  revalidatePath("/history");
  revalidatePath("/leaderboard");
  return { ok: true };
}
