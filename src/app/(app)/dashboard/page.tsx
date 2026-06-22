import Link from "next/link";
import { desc } from "drizzle-orm";
import { CalendarClock, Megaphone, Trophy, ClipboardList } from "lucide-react";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import {
  getWeeksDetailed,
  getScoredGames,
  type League,
} from "@/lib/data/league";
import { computeLeaderboard } from "@/lib/stats";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { MatchupCard } from "@/components/matchup/matchup-card";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const league = user.league as League;
  const tracksScores = league === "competitive";

  const [weeks, scored, latest] = await Promise.all([
    getWeeksDetailed(league),
    tracksScores ? getScoredGames(league) : Promise.resolve([]),
    db.query.announcements.findFirst({ orderBy: [desc(announcements.createdAt)] }),
  ]);

  const currentWeek = weeks[0] ?? null;
  const myMatchup = currentWeek?.matchups.find((m) =>
    m.players.some((p) => p.userId === user.id),
  );

  const leaderboard = computeLeaderboard(scored);
  const myRank = leaderboard.findIndex((r) => r.userId === user.id);
  const myStats = myRank >= 0 ? leaderboard[myRank] : null;

  return (
    <div>
      <PageHeader
        title={`Welcome back${user.name ? `, ${user.name.split(" ")[0]}` : ""}`}
        description="Here's where things stand this week."
      />

      <div className="grid gap-5 lg:grid-cols-3">
        {/* This week's matchup */}
        <div className="lg:col-span-2 space-y-5">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-bold text-thg-slate">
                {currentWeek ? `Week ${currentWeek.weekNumber}` : "This week"}
              </h2>
              <Link href="/pairings" className="text-sm font-semibold text-thg-slate underline">
                All pairings
              </Link>
            </div>
            {myMatchup ? (
              <MatchupCard
                matchup={myMatchup}
                title="Your matchup"
                highlightUserId={user.id}
                footer={
                  !myMatchup.isBye && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {tracksScores && (
                        <Link href="/scores" className={cn(buttonVariants({ variant: "primary", size: "sm" }))}>
                          Enter scores
                        </Link>
                      )}
                      <Link
                        href={`/matchups/${myMatchup.id}/schedule`}
                        className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                      >
                        <CalendarClock className="h-4 w-4" /> Find a time
                      </Link>
                    </div>
                  )
                }
              />
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-thg-slate-light">
                  {currentWeek
                    ? "You're not in this week's pairings. Opt in on the Pairings page to play next week."
                    : "Pairings haven't been posted yet. Make sure you're opted in!"}
                  <div className="mt-3">
                    <Link href="/pairings" className={cn(buttonVariants({ variant: "accent", size: "sm" }))}>
                      Go to pairings
                    </Link>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Side column */}
        <div className="space-y-5">
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Trophy className="h-5 w-5 text-thg-yellow" />
              <CardTitle>Your standing</CardTitle>
            </CardHeader>
            <CardContent>
              {myStats ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-extrabold text-thg-slate">#{myRank + 1}</span>
                  <span className="text-sm text-thg-slate-light">
                    {myStats.wins}W · {myStats.points} pts
                  </span>
                </div>
              ) : (
                <p className="text-sm text-thg-slate-light">
                  {tracksScores ? "No games played yet." : "Casual league does not track standings."}
                </p>
              )}
              {tracksScores && (
                <Link
                  href="/leaderboard"
                  className="mt-2 inline-block text-sm font-semibold text-thg-slate underline"
                >
                  View leaderboard
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <Megaphone className="h-5 w-5 text-thg-yellow" />
              <CardTitle>Latest news</CardTitle>
            </CardHeader>
            <CardContent>
              {latest ? (
                <>
                  <p className="font-semibold text-thg-slate">{latest.title}</p>
                  <p className="mt-1 line-clamp-3 text-sm text-thg-slate-light">{latest.body}</p>
                  <Link
                    href="/announcements"
                    className="mt-2 inline-block text-sm font-semibold text-thg-slate underline"
                  >
                    All announcements
                  </Link>
                </>
              ) : (
                <p className="text-sm text-thg-slate-light">No announcements yet.</p>
              )}
            </CardContent>
          </Card>

          <Card accent={false} className="bg-thg-slate text-white">
            <CardContent className="flex items-center gap-3 py-4">
              <ClipboardList className="h-5 w-5 text-thg-yellow" />
              <div className="flex-1 text-sm">
                <Badge variant="yellow" className="mb-1">
                  {league === "competitive" ? "Competitive" : "Casual"}
                </Badge>
                <p className="text-thg-mist">
                  {tracksScores
                    ? "Scores are due Friday each week."
                    : "No scores or leaderboards for casual games."}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
