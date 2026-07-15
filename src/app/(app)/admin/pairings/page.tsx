import { asc } from "drizzle-orm";
import Link from "next/link";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getWeeksDetailed, WEEK_PARAM, type League } from "@/lib/data/league";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchupEditor, ByeGroupEditor } from "@/components/admin/matchup-editor";
import { WeekActions } from "@/components/admin/season-controls";
import { ScoreEntryForm, type GameFormState } from "@/components/scores/score-entry-form";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LEAGUES: League[] = ["competitive", "casual"];

const STATUS_BADGE = {
  pending: "soft",
  preview: "yellow",
  published: "success",
  completed: "slate",
} as const;

export default async function AdminPairingsPage({
  searchParams,
}: {
  searchParams: Promise<{ cWeek?: string; sWeek?: string }>;
}) {
  const params = await searchParams;
  const allUsers = await db
    .select({ id: users.id, name: users.name, email: users.email, league: users.league })
    .from(users)
    .orderBy(asc(users.name));

  const sections = await Promise.all(
    LEAGUES.map(async (league) => {
      const allWeeks = await getWeeksDetailed(league, { includePreview: true });
      const requestedId = Number(params[WEEK_PARAM[league]]);
      const week =
        (Number.isFinite(requestedId) && allWeeks.find((w) => w.id === requestedId)) ||
        allWeeks.find((w) => w.status === "preview" || w.status === "published") ||
        allWeeks[0] ||
        null;
      const players = allUsers
        .filter((u) => u.league === league)
        .map((u) => ({ id: u.id, name: u.name ?? u.email.split("@")[0] }));
      return { league, allWeeks, week, players };
    }),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pairings editor"
        description="Review the current preview, tweak groups, then publish. Jump to any past week to fix a roster or correct scores."
      />

      {sections.map(({ league, allWeeks, week, players }) => (
        <section key={league}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-bold text-thg-slate capitalize">{league} league</h2>
            {week && <Badge variant={STATUS_BADGE[week.status]}>Week {week.weekNumber} · {week.status}</Badge>}
          </div>

          {allWeeks.length > 1 && (
            <div className="mb-3 flex flex-wrap gap-1.5">
              {allWeeks.map((w) => (
                <Link
                  key={w.id}
                  href={`/admin/pairings?${WEEK_PARAM[league]}=${w.id}`}
                  className={cn(
                    "rounded-md border px-2.5 py-1 text-xs font-semibold",
                    week?.id === w.id
                      ? "border-thg-slate bg-thg-slate text-white"
                      : "border-thg-slate/20 text-thg-slate hover:bg-thg-mist-light",
                  )}
                >
                  Wk {w.weekNumber}
                </Link>
              ))}
            </div>
          )}

          {!week ? (
            <EmptyState
              title="Nothing to edit"
              description="Generate a week's pairings from the Overview tab first."
            />
          ) : (
            <div className="space-y-4">
              {week.status !== "preview" && (
                <p className="text-sm text-thg-slate-light">
                  {week.status === "completed"
                    ? "This week is complete — roster and score edits here won't notify anyone."
                    : "This week is already published — edits here won't notify players unless you republish."}
                </p>
              )}
              <div className="flex justify-end">
                <WeekActions weekId={week.id} status={week.status} />
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                {week.matchups.map((m) => (
                  <Card key={m.id} accent={!m.isBye}>
                    <CardHeader>
                      <CardTitle>{m.isBye ? "Bye group" : `Matchup #${m.id}`}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {m.isBye ? (
                        <ByeGroupEditor
                          matchupId={m.id}
                          seatUserIds={m.players.map((p) => p.userId)}
                          allPlayers={players}
                        />
                      ) : (
                        <>
                          <MatchupEditor
                            matchupId={m.id}
                            seatUserIds={[0, 1, 2, 3].map(
                              (seat) => m.players.find((p) => p.seat === seat)?.userId,
                            )}
                            allPlayers={players}
                          />
                          {league === "competitive" && (
                            <div className="space-y-2 pt-1">
                              {[1, 2, 3].map((gameNum) => {
                                const seatNames = [0, 1, 2, 3].map(
                                  (seat) =>
                                    m.players.find((p) => p.seat === seat)?.name ?? `Seat ${seat}`,
                                );
                                const existing = m.games.find((g) => g.gameNum === gameNum);
                                const initial: GameFormState = existing
                                  ? {
                                      comboIndex: existing.comboIndex,
                                      scoreTeam0:
                                        existing.scores.find((s) => s.team === 0)?.points ?? null,
                                      scoreTeam1:
                                        existing.scores.find((s) => s.team === 1)?.points ?? null,
                                      submitted: existing.submittedAt !== null,
                                    }
                                  : {
                                      comboIndex: null,
                                      scoreTeam0: null,
                                      scoreTeam1: null,
                                      submitted: false,
                                    };
                                return (
                                  <ScoreEntryForm
                                    key={gameNum}
                                    matchupId={m.id}
                                    gameNum={gameNum}
                                    seatNames={seatNames}
                                    initial={initial}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                ))}
                {week.matchups.length === 0 && (
                  <p className="text-sm text-thg-slate-light">
                    No matchups generated yet for this week.
                  </p>
                )}
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
