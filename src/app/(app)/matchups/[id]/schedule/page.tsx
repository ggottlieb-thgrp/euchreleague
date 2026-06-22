import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { matchups, locations as locationsTable } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { getMatchupAvailability } from "@/lib/data/availability";
import { getUserNames } from "@/lib/data/league";
import { suggestWindows } from "@/lib/scheduling/overlap";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scheduler, type WindowDTO } from "@/components/schedule/scheduler";

export const dynamic = "force-dynamic";

const MAX_WINDOWS = 8;

export default async function MatchupSchedulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const matchupId = parseInt(id, 10);
  if (Number.isNaN(matchupId)) notFound();

  const matchup = await db.query.matchups.findFirst({
    where: eq(matchups.id, matchupId),
    with: {
      players: { with: { user: { columns: { id: true, name: true, email: true } } } },
      scheduledGame: { with: { location: { columns: { name: true } } } },
    },
  });
  if (!matchup || matchup.isBye) notFound();

  const isParticipant = matchup.players.some((p) => p.userId === user.id);
  if (!isParticipant && user.role !== "admin") redirect("/pairings");

  const [free, locs] = await Promise.all([
    getMatchupAvailability(matchupId),
    db.query.locations.findMany({
      where: eq(locationsTable.active, true),
      orderBy: [asc(locationsTable.name)],
    }),
  ]);

  const { windows, degraded } = suggestWindows(free, 3);
  const missingIds = [...new Set(windows.flatMap((w) => w.missingUserIds))];
  const names = await getUserNames(missingIds);

  const windowDTOs: WindowDTO[] = windows.slice(0, MAX_WINDOWS).map((w) => ({
    weekday: w.weekday,
    startSlot: w.startSlot,
    endSlot: w.endSlot,
    allFree: w.allFree,
    missingNames: w.missingUserIds.map((uid) => names.get(uid) ?? "Someone"),
  }));

  const playerNames = matchup.players
    .sort((a, b) => a.seat - b.seat)
    .map((p) => p.user.name ?? p.user.email.split("@")[0]);

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Find a time to play"
        description={playerNames.join(", ")}
        action={
          <Link href="/pairings" className="text-sm font-semibold text-thg-slate underline">
            ← Pairings
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Schedule your matchup</CardTitle>
        </CardHeader>
        <CardContent>
          <Scheduler
            matchupId={matchupId}
            windows={windowDTOs}
            degraded={degraded}
            locations={locs.map((l) => ({ id: l.id, name: l.name }))}
            current={{
              status: matchup.scheduledGame?.status ?? "unscheduled",
              startsAt: matchup.scheduledGame?.startsAt
                ? matchup.scheduledGame.startsAt.toISOString()
                : null,
              locationName: matchup.scheduledGame?.location?.name ?? null,
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
