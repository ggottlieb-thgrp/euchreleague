import Link from "next/link";
import { Users, CalendarClock } from "lucide-react";
import { requireUser } from "@/lib/auth-helpers";
import { getWeeksDetailed, type League } from "@/lib/data/league";
import { getOptInWeek, getUserOptIn } from "@/lib/data/optin";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { MatchupCard } from "@/components/matchup/matchup-card";
import { OptInToggle } from "@/components/pairings/opt-in-toggle";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PairingsPage() {
  const user = await requireUser();
  const league = user.league as League;

  const [weeks, optInWeek] = await Promise.all([
    getWeeksDetailed(league),
    getOptInWeek(league),
  ]);
  const currentWeek = weeks[0] ?? null;
  const initialOptedIn = optInWeek ? await getUserOptIn(user.id, optInWeek.id) : true;

  return (
    <div>
      <PageHeader title="Pairings" description="Your group for the week, and opt-in for what's next." />

      {/* Opt-in for the upcoming week */}
      {optInWeek && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle>Playing in Week {optInWeek.weekNumber}?</CardTitle>
            <Badge variant={optInWeek.status === "preview" ? "yellow" : "soft"}>
              {optInWeek.status === "preview" ? "Pairings previewing" : "Opt-in open"}
            </Badge>
          </CardHeader>
          <CardContent>
            <OptInToggle weekId={optInWeek.id} initialOptedIn={initialOptedIn} />
            <p className="mt-2 text-sm text-thg-slate-light">
              Opt in before pairings are generated to be included in the random draw.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Current published week */}
      {!currentWeek ? (
        <EmptyState
          icon={<Users className="mx-auto h-8 w-8" />}
          title="No pairings posted yet"
          description="Once the commissioner posts the week's groups, you'll see your matchup here."
        />
      ) : (
        <div>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-bold text-thg-slate">Week {currentWeek.weekNumber}</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {currentWeek.matchups.map((m) => {
              const mine = m.players.some((p) => p.userId === user.id);
              return (
                <MatchupCard
                  key={m.id}
                  matchup={m}
                  title={m.isBye ? "Bye" : mine ? "Your matchup" : "Matchup"}
                  highlightUserId={user.id}
                  footer={
                    mine && !m.isBye ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <Link
                          href={`/matchups/${m.id}/schedule`}
                          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                        >
                          <CalendarClock className="h-4 w-4" /> Find a time
                        </Link>
                        <Link
                          href="/scores"
                          className={cn(buttonVariants({ variant: "primary", size: "sm" }))}
                        >
                          Enter scores
                        </Link>
                      </div>
                    ) : null
                  }
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
