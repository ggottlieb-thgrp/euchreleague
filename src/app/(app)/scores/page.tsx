import { ClipboardList } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getWeeksDetailed, type League } from "@/lib/data/league";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScoreEntryForm, type GameFormState } from "@/components/scores/score-entry-form";

export const dynamic = "force-dynamic";

export default async function ScoresPage() {
  const user = await requireUser();
  const league = user.league as League;
  const weeks = await getWeeksDetailed(league);
  const currentWeek = weeks[0] ?? null;
  const myMatchup = currentWeek?.matchups.find(
    (m) => !m.isBye && m.players.some((p) => p.userId === user.id),
  );

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Enter Scores"
        description={currentWeek ? `Week ${currentWeek.weekNumber} · 3 games to 10` : "Submit your game results"}
      />

      {!myMatchup ? (
        <EmptyState
          icon={<ClipboardList className="mx-auto h-8 w-8" />}
          title="Nothing to score right now"
          description="You don't have a matchup this week. Scores open once pairings are posted and you're in a group."
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Your matchup</CardTitle>
            <p className="text-sm text-thg-slate-light">
              {myMatchup.players.map((p) => p.name).join(", ")}
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3].map((gameNum) => {
              const seatNames = [0, 1, 2, 3].map(
                (seat) => myMatchup.players.find((p) => p.seat === seat)?.name ?? `Seat ${seat}`,
              );
              const existing = myMatchup.games.find((g) => g.gameNum === gameNum);
              const initial: GameFormState = existing
                ? {
                    comboIndex: existing.comboIndex,
                    scoreTeam0: existing.scores.find((s) => s.team === 0)?.points ?? null,
                    scoreTeam1: existing.scores.find((s) => s.team === 1)?.points ?? null,
                    submitted: existing.winnerTeam !== null,
                  }
                : { comboIndex: null, scoreTeam0: null, scoreTeam1: null, submitted: false };
              return (
                <ScoreEntryForm
                  key={gameNum}
                  matchupId={myMatchup.id}
                  gameNum={gameNum}
                  seatNames={seatNames}
                  initial={initial}
                />
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
