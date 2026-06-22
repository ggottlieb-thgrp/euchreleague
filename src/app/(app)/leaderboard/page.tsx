import Link from "next/link";
import { Trophy } from "lucide-react";
import { getScoredGames, getUserNames, type League } from "@/lib/data/league";
import { computeLeaderboard } from "@/lib/stats";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const league: League = "competitive";

  const games = await getScoredGames(league);
  const rows = computeLeaderboard(games);
  const names = await getUserNames(rows.map((r) => r.userId));

  return (
    <div>
      <PageHeader
        title="Leaderboard"
        description="Competitive standings ranked by wins, then total points."
      />

      {rows.length === 0 ? (
        <EmptyState
          icon={<Trophy className="mx-auto h-8 w-8" />}
          title="No results yet"
          description="Standings appear once games have been played and scores submitted."
        />
      ) : (
        <Card accent={false} className="overflow-hidden">
          <Table>
            <THead>
              <TR>
                <TH className="w-12">#</TH>
                <TH>Player</TH>
                <TH className="text-right">W</TH>
                <TH className="text-right">L</TH>
                <TH className="text-right">Pts</TH>
                <TH className="text-right">GP</TH>
                <TH className="text-right">Avg</TH>
              </TR>
            </THead>
            <TBody>
              {rows.map((r, i) => (
                <TR key={r.userId} className={cn(i < 3 && "bg-thg-yellow-light/30")}>
                  <TD className="font-bold text-thg-slate-light">
                    {i === 0 ? "🏆" : i + 1}
                  </TD>
                  <TD>
                    <Link
                      href={`/players/${r.userId}`}
                      className="font-semibold text-thg-slate hover:underline"
                    >
                      {names.get(r.userId) ?? "Unknown"}
                    </Link>
                  </TD>
                  <TD className="text-right font-bold text-thg-slate">{r.wins}</TD>
                  <TD className="text-right text-thg-slate-light">{r.losses}</TD>
                  <TD className="text-right">{r.points}</TD>
                  <TD className="text-right text-thg-slate-light">{r.gamesPlayed}</TD>
                  <TD className="text-right text-thg-slate-light">{r.avgPoints}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
