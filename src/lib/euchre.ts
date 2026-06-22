/**
 * Euchre matchup logic, ported from Season 1 (index.html ~lines 93-109, 593-597).
 *
 * A matchup is 4 players in seats 0..3 (A/B/C/D). Each of the 3 games uses one
 * of 3 partner combinations so everyone partners with everyone once:
 *   combo 0: (A,B) vs (C,D)
 *   combo 1: (A,C) vs (B,D)
 *   combo 2: (A,D) vs (B,C)
 */

export const NUM_GAMES = 3;
export const SEATS = [0, 1, 2, 3] as const;
export type Seat = 0 | 1 | 2 | 3;
export type ComboIndex = 0 | 1 | 2;
export type Team = 0 | 1;

/** Seats on each team for every combo: COMBOS[combo][team] -> [seat, seat]. */
export const COMBOS: ReadonlyArray<readonly [readonly [Seat, Seat], readonly [Seat, Seat]]> = [
  [
    [0, 1],
    [2, 3],
  ],
  [
    [0, 2],
    [1, 3],
  ],
  [
    [0, 3],
    [1, 2],
  ],
] as const;

/** Which team (0 or 1) a seat is on for a given combo. */
export function teamForSeat(combo: ComboIndex, seat: Seat): Team {
  return COMBOS[combo][0].includes(seat) ? 0 : 1;
}

/** The two seats forming `team` in `combo`. */
export function seatsForTeam(combo: ComboIndex, team: Team): readonly [Seat, Seat] {
  return COMBOS[combo][team];
}

/** Winning team from two team scores. Higher score wins; ties resolve to team 0. */
export function winningTeam(scoreTeam0: number, scoreTeam1: number): Team {
  return scoreTeam0 >= scoreTeam1 ? 0 : 1;
}

/**
 * Build per-player score rows for a submitted game.
 * `seatUserIds[seat]` is the user id occupying that seat.
 */
export function buildGameScoreRows(
  seatUserIds: readonly string[],
  combo: ComboIndex,
  scoreTeam0: number,
  scoreTeam1: number,
): { userId: string; team: Team; points: number }[] {
  return SEATS.map((seat) => {
    const team = teamForSeat(combo, seat as Seat);
    return {
      userId: seatUserIds[seat],
      team,
      points: team === 0 ? scoreTeam0 : scoreTeam1,
    };
  });
}
