import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getScoredGames, getUserNames, type League } from "@/lib/data/league";
import { computePlayerStats } from "@/lib/stats";
import { requireUser } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { SeasonTrend, StreakBadge } from "@/components/profile/season-trend";

export const dynamic = "force-dynamic";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const player = await db.query.users.findFirst({
    where: eq(users.id, id),
    with: { profile: true },
  });
  if (!player) notFound();

  const league = player.league as League;
  const games = await getScoredGames(league);
  const stats = computePlayerStats(player.id, games);
  const partnerNames = await getUserNames(stats.partners.map((p) => p.userId));

  const name = player.profile?.displayName ?? player.name ?? player.email.split("@")[0];

  return (
    <div className="max-w-3xl">
      <PageHeader
        title={name}
        description={player.profile?.bio ?? undefined}
        action={<Badge variant="yellow">{league === "competitive" ? "Competitive" : "Casual"}</Badge>}
      />

      {/* Stat tiles */}
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Record" value={`${stats.wins}–${stats.losses}`} />
        <Stat label="Win %" value={`${stats.winPct}%`} />
        <Stat label="Points" value={stats.points.toString()} sub={`${stats.avgPoints} avg`} />
        <Stat label="Streak" value={<StreakBadge streak={stats.streak} />} />
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Season trend</CardTitle>
          </CardHeader>
          <CardContent>
            <SeasonTrend trend={stats.trend} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Partners</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.partners.length === 0 ? (
              <p className="text-sm text-thg-slate-light">No games played yet.</p>
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Partner</TH>
                    <TH className="text-right">Games</TH>
                    <TH className="text-right">Win %</TH>
                  </TR>
                </THead>
                <TBody>
                  {stats.partners.map((p) => (
                    <TR key={p.userId}>
                      <TD>
                        <Link href={`/players/${p.userId}`} className="font-semibold text-thg-slate hover:underline">
                          {partnerNames.get(p.userId) ?? "Unknown"}
                        </Link>
                      </TD>
                      <TD className="text-right text-thg-slate-light">{p.games}</TD>
                      <TD className="text-right">{Math.round((p.wins / p.games) * 100)}%</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-6">
        <Link href="/players" className="text-sm font-semibold text-thg-slate underline">
          ← All players
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) {
  return (
    <div className="rounded-card border border-thg-slate/10 border-l-4 border-l-thg-yellow bg-thg-surface p-4">
      <p className="text-xs font-sans font-semibold uppercase tracking-wide text-thg-slate-light">
        {label}
      </p>
      <p className="mt-1 text-2xl font-extrabold text-thg-slate">{value}</p>
      {sub && <p className="text-xs text-thg-slate-light">{sub}</p>}
    </div>
  );
}
