import { describe, it, expect } from "vitest";
import { computeLeaderboard, computePlayerStats, type ScoredGame } from "./stats";

// Two players per team for brevity; helper builds a completed game.
function game(
  gameId: number,
  weekNumber: number,
  gameNum: number,
  t0: [string, string],
  t1: [string, string],
  s0: number,
  s1: number,
): ScoredGame {
  return {
    gameId,
    weekNumber,
    gameNum,
    winnerTeam: s0 >= s1 ? 0 : 1,
    scores: [
      { userId: t0[0], team: 0, points: s0 },
      { userId: t0[1], team: 0, points: s0 },
      { userId: t1[0], team: 1, points: s1 },
      { userId: t1[1], team: 1, points: s1 },
    ],
  };
}

const GAMES: ScoredGame[] = [
  game(1, 1, 1, ["a", "b"], ["c", "d"], 10, 6),
  game(2, 1, 2, ["a", "c"], ["b", "d"], 8, 10),
  game(3, 2, 1, ["a", "d"], ["b", "c"], 10, 9),
];

describe("computeLeaderboard", () => {
  it("ranks by wins then points", () => {
    const lb = computeLeaderboard(GAMES);
    // a: wins g1,g3 (2 wins), loss g2. points 10+8+10=28
    const a = lb.find((r) => r.userId === "a")!;
    expect(a).toMatchObject({ wins: 2, losses: 1, points: 28, gamesPlayed: 3 });
    // a and b both have 2 wins; b has 29 pts vs a's 28, so the points tiebreak
    // puts b on top.
    const b = lb.find((r) => r.userId === "b")!;
    expect(b).toMatchObject({ wins: 2, points: 29 });
    expect(lb[0].userId).toBe("b");
    expect(lb[1].userId).toBe("a");
  });

  it("ignores games that aren't submitted", () => {
    const withPending: ScoredGame[] = [
      ...GAMES,
      { gameId: 4, weekNumber: 2, gameNum: 2, winnerTeam: null, scores: [] },
    ];
    expect(computeLeaderboard(withPending)).toEqual(computeLeaderboard(GAMES));
  });
});

describe("computePlayerStats", () => {
  it("computes record, partners, and streak for a player", () => {
    const s = computePlayerStats("a", GAMES);
    expect(s).toMatchObject({ wins: 2, losses: 1, points: 28, gamesPlayed: 3 });
    expect(s.winPct).toBe(67);
    // partners across the 3 games: b (g1), c (g2), d (g3) once each
    expect(s.partners.map((p) => p.userId).sort()).toEqual(["b", "c", "d"]);
    // most recent game (week2) was a win => streak +1 (preceded by a loss in g2)
    expect(s.streak).toBe(1);
  });

  it("tracks a multi-game win streak", () => {
    const streakGames: ScoredGame[] = [
      game(1, 1, 1, ["a", "b"], ["c", "d"], 6, 10), // a loses
      game(2, 1, 2, ["a", "b"], ["c", "d"], 10, 4), // a wins
      game(3, 2, 1, ["a", "b"], ["c", "d"], 10, 5), // a wins
    ];
    expect(computePlayerStats("a", streakGames).streak).toBe(2);
  });

  it("builds a per-week trend", () => {
    const s = computePlayerStats("a", GAMES);
    expect(s.trend).toEqual([
      { weekNumber: 1, wins: 1, points: 18 },
      { weekNumber: 2, wins: 1, points: 10 },
    ]);
  });
});
