/**
 * Leaderboard + player profile aggregation. Pure functions over scored-game
 * rows so they're trivially testable; the DB layer just feeds them rows.
 * Replaces Season 1's client-side reduce (index.html ~lines 722-744).
 */

export interface ScoredGame {
  gameId: number;
  weekNumber: number;
  gameNum: number;
  submittedAt: Date | null;
  winnerTeam: number | null; // null = tied game or not yet submitted
  scores: { userId: string; team: number; points: number }[];
}

export interface LeaderboardRow {
  userId: string;
  wins: number;
  losses: number;
  ties: number;
  points: number;
  gamesPlayed: number;
  avgPoints: number;
}

const completed = (g: ScoredGame) => g.submittedAt !== null;

/** Wins desc, then points desc — matches Season 1's tiebreak. */
export function computeLeaderboard(games: ScoredGame[]): LeaderboardRow[] {
  const stats = new Map<string, LeaderboardRow>();
  const get = (userId: string) => {
    let row = stats.get(userId);
    if (!row) {
      row = { userId, wins: 0, losses: 0, ties: 0, points: 0, gamesPlayed: 0, avgPoints: 0 };
      stats.set(userId, row);
    }
    return row;
  };

  for (const g of games) {
    if (!completed(g)) continue;
    for (const s of g.scores) {
      const row = get(s.userId);
      row.points += s.points;
      row.gamesPlayed += 1;
      if (g.winnerTeam === null) row.ties += 1;
      else if (s.team === g.winnerTeam) row.wins += 1;
      else row.losses += 1;
    }
  }

  const rows = [...stats.values()];
  for (const r of rows) {
    r.avgPoints = r.gamesPlayed ? Math.round((r.points / r.gamesPlayed) * 10) / 10 : 0;
  }
  return rows.sort((a, b) => b.wins - a.wins || b.points - a.points);
}

export interface PartnerStat {
  userId: string;
  games: number;
  wins: number;
}

export interface WeekTrendPoint {
  weekNumber: number;
  wins: number;
  points: number;
}

export interface PlayerStats {
  wins: number;
  losses: number;
  ties: number;
  points: number;
  gamesPlayed: number;
  avgPoints: number;
  winPct: number;
  /** Current streak: positive = consecutive wins, negative = losses. */
  streak: number;
  partners: PartnerStat[];
  trend: WeekTrendPoint[];
}

export function computePlayerStats(userId: string, games: ScoredGame[]): PlayerStats {
  const mine = games
    .filter((g) => completed(g) && g.scores.some((s) => s.userId === userId))
    .sort((a, b) => a.weekNumber - b.weekNumber || a.gameNum - b.gameNum);

  let wins = 0,
    losses = 0,
    ties = 0,
    points = 0;
  const partners = new Map<string, PartnerStat>();
  const trend = new Map<number, WeekTrendPoint>();
  const outcomes: boolean[] = []; // true = win, in chronological order

  for (const g of mine) {
    const me = g.scores.find((s) => s.userId === userId)!;
    const tied = g.winnerTeam === null;
    const won = !tied && me.team === g.winnerTeam;
    points += me.points;
    if (tied) ties += 1;
    else if (won) wins += 1;
    else losses += 1;
    if (!tied) outcomes.push(won);

    // Partner = other player on my team
    const partner = g.scores.find((s) => s.team === me.team && s.userId !== userId);
    if (partner) {
      let p = partners.get(partner.userId);
      if (!p) {
        p = { userId: partner.userId, games: 0, wins: 0 };
        partners.set(partner.userId, p);
      }
      p.games += 1;
      if (won) p.wins += 1;
    }

    let t = trend.get(g.weekNumber);
    if (!t) {
      t = { weekNumber: g.weekNumber, wins: 0, points: 0 };
      trend.set(g.weekNumber, t);
    }
    t.points += me.points;
    if (won) t.wins += 1;
  }

  // Current streak from the most recent outcome backward.
  let streak = 0;
  for (let i = outcomes.length - 1; i >= 0; i--) {
    if (i === outcomes.length - 1) {
      streak = outcomes[i] ? 1 : -1;
    } else if (outcomes[i] === outcomes[outcomes.length - 1]) {
      streak += outcomes[i] ? 1 : -1;
    } else break;
  }

  const gamesPlayed = wins + losses + ties;
  return {
    wins,
    losses,
    ties,
    points,
    gamesPlayed,
    avgPoints: gamesPlayed ? Math.round((points / gamesPlayed) * 10) / 10 : 0,
    winPct: gamesPlayed ? Math.round((wins / gamesPlayed) * 100) : 0,
    streak,
    partners: [...partners.values()].sort((a, b) => b.games - a.games || b.wins - a.wins),
    trend: [...trend.values()].sort((a, b) => a.weekNumber - b.weekNumber),
  };
}
