import { describe, it, expect } from "vitest";
import {
  COMBOS,
  teamForSeat,
  seatsForTeam,
  winningTeam,
  buildGameScoreRows,
} from "./euchre";

describe("euchre combos", () => {
  it("pairs everyone with everyone across the 3 combos", () => {
    // Collect each player's partner per combo; over 3 games seat 0 should
    // partner 1, 2, and 3 exactly once each.
    const partnersOfA = COMBOS.map((c) => {
      const team = c[0].includes(0) ? c[0] : c[1];
      return team.find((s) => s !== 0);
    });
    expect(new Set(partnersOfA)).toEqual(new Set([1, 2, 3]));
  });

  it("teamForSeat is consistent with seatsForTeam", () => {
    for (let combo = 0; combo < 3; combo++) {
      for (let seat = 0; seat < 4; seat++) {
        const team = teamForSeat(combo as 0 | 1 | 2, seat as 0 | 1 | 2 | 3);
        expect(seatsForTeam(combo as 0 | 1 | 2, team)).toContain(seat);
      }
    }
  });
});

describe("winningTeam", () => {
  it("higher score wins", () => {
    expect(winningTeam(10, 7)).toBe(0);
    expect(winningTeam(6, 10)).toBe(1);
  });
});

describe("buildGameScoreRows", () => {
  it("assigns each seat its team's score", () => {
    const seats = ["uA", "uB", "uC", "uD"];
    // combo 0 => team0=(A,B), team1=(C,D)
    const rows = buildGameScoreRows(seats, 0, 10, 6);
    const byUser = Object.fromEntries(rows.map((r) => [r.userId, r]));
    expect(byUser.uA).toMatchObject({ team: 0, points: 10 });
    expect(byUser.uB).toMatchObject({ team: 0, points: 10 });
    expect(byUser.uC).toMatchObject({ team: 1, points: 6 });
    expect(byUser.uD).toMatchObject({ team: 1, points: 6 });
  });
});
