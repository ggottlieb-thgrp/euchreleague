import "server-only";
import { and, eq, desc, inArray } from "drizzle-orm";
import { db } from "@/db";
import { seasons, weeks, users } from "@/db/schema";
import type { ScoredGame } from "@/lib/stats";

export type League = "competitive" | "casual";

/** Query-string key used to select a specific week to view/edit per league. */
export const WEEK_PARAM: Record<League, "cWeek" | "sWeek"> = {
  competitive: "cWeek",
  casual: "sWeek",
};

/** The active season for a league (or null if none has been created yet). */
export async function getActiveSeason(league: League) {
  return db.query.seasons.findFirst({
    where: and(eq(seasons.league, league), eq(seasons.isActive, true)),
  });
}

/**
 * Weeks of a season. By default only player-visible (published/completed)
 * weeks; pass includePreview for admin views.
 */
export async function getSeasonWeeks(seasonId: number, includePreview = false) {
  const rows = await db.query.weeks.findMany({
    where: eq(weeks.seasonId, seasonId),
    orderBy: [desc(weeks.weekNumber)],
  });
  return includePreview
    ? rows
    : rows.filter((w) => w.status === "published" || w.status === "completed");
}

/** The latest player-visible week of a league's active season. */
export async function getCurrentWeek(league: League, includePreview = false) {
  const season = await getActiveSeason(league);
  if (!season) return null;
  const wks = await getSeasonWeeks(season.id, includePreview);
  return wks[0] ?? null;
}

/**
 * All scored games for a league's active season, shaped for the stats helpers.
 * Only player-visible weeks are included.
 */
export async function getScoredGames(league: League): Promise<ScoredGame[]> {
  const season = await getActiveSeason(league);
  if (!season) return [];

  const wks = await db.query.weeks.findMany({
    where: eq(weeks.seasonId, season.id),
    with: {
      matchups: {
        with: { games: { with: { scores: true } } },
      },
    },
  });

  const games: ScoredGame[] = [];
  for (const w of wks) {
    if (w.status !== "published" && w.status !== "completed") continue;
    for (const m of w.matchups) {
      if (m.isBye) continue;
      for (const g of m.games) {
        games.push({
          gameId: g.id,
          weekNumber: w.weekNumber,
          gameNum: g.gameNum,
          submittedAt: g.submittedAt,
          winnerTeam: g.winnerTeam,
          scores: g.scores.map((s) => ({
            userId: s.userId,
            team: s.team,
            points: s.points,
          })),
        });
      }
    }
  }
  return games;
}

export interface DetailedPlayer {
  userId: string;
  name: string;
  seat: number;
}
export interface DetailedGame {
  id: number;
  gameNum: number;
  comboIndex: number | null;
  winnerTeam: number | null;
  submittedAt: Date | null;
  scores: { userId: string; points: number; team: number }[];
}
export interface DetailedMatchup {
  id: number;
  isBye: boolean;
  league: League;
  location: { id: number; name: string } | null;
  players: DetailedPlayer[];
  games: DetailedGame[];
  scheduled: {
    status: "unscheduled" | "proposed" | "confirmed";
    startsAt: Date | null;
    locationName: string | null;
  } | null;
}
export interface DetailedWeek {
  id: number;
  weekNumber: number;
  status: "pending" | "preview" | "published" | "completed";
  startsOn: Date | null;
  scoresDueAt: Date | null;
  matchups: DetailedMatchup[];
}

/**
 * Fully-loaded weeks for a league's active season: matchups, seated players
 * (with names), games + scores, and scheduling. Shared by pairings, scores,
 * and history views.
 */
export async function getWeeksDetailed(
  league: League,
  opts: { includePreview?: boolean; weekId?: number } = {},
): Promise<DetailedWeek[]> {
  const season = await getActiveSeason(league);
  if (!season) return [];

  const wks = await db.query.weeks.findMany({
    where: eq(weeks.seasonId, season.id),
    orderBy: [desc(weeks.weekNumber)],
    with: {
      matchups: {
        with: {
          location: { columns: { id: true, name: true } },
          players: { with: { user: { columns: { id: true, name: true, email: true } } } },
          games: { with: { scores: true } },
          scheduledGame: { with: { location: { columns: { name: true } } } },
        },
      },
    },
  });

  const visible = wks.filter((w) =>
    opts.weekId
      ? w.id === opts.weekId
      : opts.includePreview
        ? true
        : w.status === "published" || w.status === "completed",
  );

  return visible.map((w) => ({
    id: w.id,
    weekNumber: w.weekNumber,
    status: w.status,
    startsOn: w.startsOn,
    scoresDueAt: w.scoresDueAt,
    matchups: [...w.matchups]
      .sort((a, b) => a.id - b.id)
      .map((m) => ({
        id: m.id,
        isBye: m.isBye,
        league: m.league as League,
        location: m.location ?? null,
        players: [...m.players]
          .sort((a, b) => a.seat - b.seat)
          .map((p) => ({
            userId: p.userId,
            name: p.user.name ?? p.user.email.split("@")[0],
            seat: p.seat,
          })),
        games: [...m.games]
          .sort((a, b) => a.gameNum - b.gameNum)
          .map((g) => ({
            id: g.id,
            gameNum: g.gameNum,
            comboIndex: g.comboIndex,
            winnerTeam: g.winnerTeam,
            submittedAt: g.submittedAt,
            scores: g.scores.map((s) => ({
              userId: s.userId,
              points: s.points,
              team: s.team,
            })),
          })),
        scheduled: m.scheduledGame
          ? {
              status: m.scheduledGame.status,
              startsAt: m.scheduledGame.startsAt,
              locationName: m.scheduledGame.location?.name ?? null,
            }
          : null,
      })),
  }));
}

/** id -> display name map for a set of user ids. */
export async function getUserNames(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();
  const rows = await db
    .select({ id: users.id, name: users.name, email: users.email })
    .from(users)
    .where(inArray(users.id, ids));
  return new Map(rows.map((r) => [r.id, r.name ?? r.email.split("@")[0]]));
}
