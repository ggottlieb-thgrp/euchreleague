import Link from "next/link";
import { asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getScoredGames } from "@/lib/data/league";
import { computeLeaderboard } from "@/lib/stats";
import { requireUser } from "@/lib/auth-helpers";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  await requireUser();

  const [allUsers, compGames, casualGames] = await Promise.all([
    db.query.users.findMany({ orderBy: [asc(users.name)] }),
    getScoredGames("competitive"),
    getScoredGames("casual"),
  ]);

  const records = new Map<string, { wins: number; points: number }>();
  for (const r of [...computeLeaderboard(compGames), ...computeLeaderboard(casualGames)]) {
    records.set(r.userId, { wins: r.wins, points: r.points });
  }

  return (
    <div>
      <PageHeader title="Players" description="Everyone in the league. Tap a name for full stats." />

      {allUsers.length === 0 ? (
        <EmptyState title="No players yet" description="Players appear here after they sign in for the first time." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {allUsers.map((u) => {
            const rec = records.get(u.id);
            const name = u.name ?? u.email.split("@")[0];
            return (
              <Link key={u.id} href={`/players/${u.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <div className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="truncate font-sans font-bold text-thg-slate">{name}</p>
                      <p className="text-xs text-thg-slate-light">
                        {rec ? `${rec.wins}W · ${rec.points} pts` : "No games yet"}
                      </p>
                    </div>
                    <Badge variant={u.league === "competitive" ? "yellow" : "soft"}>
                      {u.league === "competitive" ? "Comp" : "Casual"}
                    </Badge>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
