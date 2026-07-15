import Link from "next/link";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { seasons, weeks } from "@/db/schema";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CreateSeasonForm,
  CreateNextWeekButton,
  WeekActions,
} from "@/components/admin/season-controls";
import { WEEK_PARAM, type League } from "@/lib/data/league";

export const dynamic = "force-dynamic";

const LEAGUES: League[] = ["competitive", "casual"];

const statusVariant = {
  pending: "soft",
  preview: "yellow",
  published: "success",
  completed: "slate",
} as const;

export default async function AdminOverviewPage() {
  const sections = await Promise.all(
    LEAGUES.map(async (league) => {
      const season = await db.query.seasons.findFirst({
        where: and(eq(seasons.league, league), eq(seasons.isActive, true)),
      });
      const wks = season
        ? await db.query.weeks.findMany({
            where: eq(weeks.seasonId, season.id),
            orderBy: [desc(weeks.weekNumber)],
            with: { matchups: { columns: { id: true, isBye: true } } },
          })
        : [];
      return { league, season, weeks: wks };
    }),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Commissioner tools"
        description="Run the weekly cycle: open a week, generate pairings, then publish."
      />

      {sections.map(({ league, season, weeks: wks }) => (
        <section key={league}>
          <div className="mb-3 flex items-center gap-2">
            <h2 className="text-lg font-bold text-thg-slate capitalize">{league} league</h2>
            {season && <Badge variant="soft">{season.name}</Badge>}
          </div>

          {!season ? (
            <Card>
              <CardHeader>
                <CardTitle>Start a season</CardTitle>
              </CardHeader>
              <CardContent>
                <CreateSeasonForm league={league} />
              </CardContent>
            </Card>
          ) : (
            <Card accent={false}>
              <CardContent className="space-y-3 pt-5">
                <div className="flex justify-end">
                  <CreateNextWeekButton seasonId={season.id} />
                </div>
                {wks.length === 0 ? (
                  <p className="text-sm text-thg-slate-light">
                    No weeks yet. Add the first week to start collecting opt-ins.
                  </p>
                ) : (
                  <div className="divide-y divide-thg-slate/10">
                    {wks.map((w) => (
                      <div
                        key={w.id}
                        className="flex flex-wrap items-center justify-between gap-3 py-3"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-thg-slate">Week {w.weekNumber}</span>
                          <Badge variant={statusVariant[w.status]}>{w.status}</Badge>
                          <span className="text-sm text-thg-slate-light">
                            {w.matchups.length} matchup{w.matchups.length === 1 ? "" : "s"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {w.matchups.length > 0 && (
                            <Link
                              href={`/admin/pairings?${WEEK_PARAM[league]}=${w.id}`}
                              className="text-sm font-semibold text-thg-slate underline"
                            >
                              View / edit
                            </Link>
                          )}
                          <WeekActions weekId={w.id} status={w.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </section>
      ))}
    </div>
  );
}
