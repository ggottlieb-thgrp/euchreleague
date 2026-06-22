import Link from "next/link";
import { MapPin, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { COMBOS } from "@/lib/euchre";
import { scheduleFormatter as scheduleFmt } from "@/lib/time";
import type { DetailedMatchup } from "@/lib/data/league";
import { cn } from "@/lib/utils";

const SEAT_LETTERS = ["A", "B", "C", "D"];

export function MatchupCard({
  matchup,
  title,
  highlightUserId,
  footer,
}: {
  matchup: DetailedMatchup;
  title?: string;
  highlightUserId?: string;
  footer?: React.ReactNode;
}) {
  const seats = matchup.players; // sorted by seat
  const tracksScores = matchup.league === "competitive";
  const nameForSeat = (seat: number) =>
    seats.find((p) => p.seat === seat)?.name ?? `Seat ${SEAT_LETTERS[seat]}`;

  if (matchup.isBye) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <span className="font-sans font-bold text-thg-slate">{title ?? "Bye"}</span>
          <Badge variant="soft">Bye week</Badge>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-thg-slate-light">
            Sitting out this week: {seats.map((p) => p.name).join(", ") || "—"}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
        <span className="font-sans font-bold text-thg-slate">{title ?? "Matchup"}</span>
        <div className="flex items-center gap-2">
          {matchup.scheduled?.status === "confirmed" && matchup.scheduled.startsAt && (
            <Badge variant="success">
              <CalendarClock className="h-3 w-3" />
              {scheduleFmt.format(matchup.scheduled.startsAt)}
            </Badge>
          )}
          {matchup.scheduled?.locationName && (
            <Badge variant="soft">
              <MapPin className="h-3 w-3" />
              {matchup.scheduled.locationName}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Player roster */}
        <div className="flex flex-wrap gap-2">
          {seats.map((p) => (
            <Link
              key={p.userId}
              href={`/players/${p.userId}`}
              className={cn(
                "rounded-full border px-2.5 py-1 text-sm font-semibold hover:bg-thg-mist-light",
                p.userId === highlightUserId
                  ? "border-thg-yellow bg-thg-yellow-light/40 text-thg-slate"
                  : "border-thg-slate/15 text-thg-slate",
              )}
            >
              {p.name}
            </Link>
          ))}
        </div>

        {tracksScores ? (
          <div className="divide-y divide-thg-slate/10 rounded-lg border border-thg-slate/10">
            {matchup.games.map((g) => {
              const combo = g.comboIndex ?? g.gameNum - 1;
              const [t0Seats, t1Seats] = COMBOS[combo as 0 | 1 | 2];
              const pointsForTeam = (team: number) =>
                g.scores.find((s) => s.team === team)?.points;
              const s0 = pointsForTeam(0);
              const s1 = pointsForTeam(1);
              const played = g.submittedAt !== null;
              return (
                <div
                  key={g.gameNum}
                  className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-2 text-sm"
                >
                  <TeamLabel
                    names={[nameForSeat(t0Seats[0]), nameForSeat(t0Seats[1])]}
                    won={played && g.winnerTeam === 0}
                    align="right"
                  />
                  <div className="text-center font-mono text-thg-slate-light">
                    {played ? (
                      <span className="font-bold text-thg-slate">
                        {s0 ?? "–"}–{s1 ?? "–"}
                      </span>
                    ) : (
                      <span className="text-xs uppercase tracking-wide">G{g.gameNum}</span>
                    )}
                  </div>
                  <TeamLabel
                    names={[nameForSeat(t1Seats[0]), nameForSeat(t1Seats[1])]}
                    won={played && g.winnerTeam === 1}
                    align="left"
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="rounded-lg border border-thg-slate/10 bg-thg-mist-light/50 px-3 py-2 text-sm text-thg-slate-light">
            Casual matchups do not track scores or standings.
          </p>
        )}
        {footer}
      </CardContent>
    </Card>
  );
}

function TeamLabel({
  names,
  won,
  align,
}: {
  names: string[];
  won: boolean;
  align: "left" | "right";
}) {
  return (
    <div className={cn("flex items-center gap-1", align === "right" ? "justify-end" : "justify-start")}>
      {align === "right" && won && <span>🏆</span>}
      <span className={cn(won ? "font-bold text-thg-slate" : "text-thg-slate-light")}>
        {names.join(" & ")}
      </span>
      {align === "left" && won && <span>🏆</span>}
    </div>
  );
}
