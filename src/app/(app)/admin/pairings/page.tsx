import { asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getWeeksDetailed, type League } from "@/lib/data/league";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MatchupCard } from "@/components/matchup/matchup-card";
import { MatchupEditor, ByeGroupEditor } from "@/components/admin/matchup-editor";
import { WeekActions } from "@/components/admin/season-controls";

export const dynamic = "force-dynamic";

const LEAGUES: League[] = ["competitive", "casual"];

export default async function AdminPairingsPage() {
  const allUsers = await db
    .select({ id: users.id, name: users.name, email: users.email, league: users.league })
    .from(users)
    .orderBy(asc(users.name));

  const sections = await Promise.all(
    LEAGUES.map(async (league) => {
      const weeks = await getWeeksDetailed(league, { includePreview: true });
      // Show the most recent non-completed week for editing.
      const week = weeks.find((w) => w.status === "preview" || w.status === "published") ?? null;
      const players = allUsers
        .filter((u) => u.league === league)
        .map((u) => ({ id: u.id, name: u.name ?? u.email.split("@")[0] }));
      return { league, week, players };
    }),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Pairings editor"
        description="Review the current preview, tweak groups, then publish."
      />

      {sections.map(({ league, week, players }) => (
        <section key={league}>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-bold text-thg-slate capitalize">{league} league</h2>
            {week && <Badge variant={week.status === "preview" ? "yellow" : "success"}>
              Week {week.weekNumber} · {week.status}
            </Badge>}
          </div>

          {!week ? (
            <EmptyState
              title="Nothing to edit"
              description="Generate a week's pairings from the Overview tab first."
            />
          ) : (
            <div className="space-y-4">
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
                      {week.status !== "preview" ? (
                        <MatchupCard matchup={m} title={m.isBye ? "Bye" : "Matchup"} />
                      ) : m.isBye ? (
                        <ByeGroupEditor
                          matchupId={m.id}
                          seatUserIds={m.players.map((p) => p.userId)}
                          allPlayers={players}
                        />
                      ) : (
                        <MatchupEditor
                          matchupId={m.id}
                          seatUserIds={[0, 1, 2, 3].map(
                            (seat) => m.players.find((p) => p.seat === seat)?.userId,
                          )}
                          allPlayers={players}
                        />
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
