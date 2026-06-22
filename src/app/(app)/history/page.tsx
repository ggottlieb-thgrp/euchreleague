import { History as HistoryIcon } from "lucide-react";
import { getWeeksDetailed, type League } from "@/lib/data/league";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { MatchupCard } from "@/components/matchup/matchup-card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ league?: string }>;
}) {
  const { league: leagueParam } = await searchParams;
  const league: League = leagueParam === "casual" ? "casual" : "competitive";

  const weeks = await getWeeksDetailed(league);

  return (
    <div>
      <PageHeader
        title="History"
        description="Past weeks and final results."
        action={<LeagueToggle current={league} />}
      />

      {weeks.length === 0 ? (
        <EmptyState
          icon={<HistoryIcon className="mx-auto h-8 w-8" />}
          title="No history yet"
          description="Completed weeks will show up here with full results."
        />
      ) : (
        <div className="space-y-8">
          {weeks.map((w) => (
            <section key={w.id}>
              <div className="mb-3 flex items-center gap-2">
                <h2 className="text-lg font-bold text-thg-slate">Week {w.weekNumber}</h2>
                {w.status === "completed" && <Badge variant="success">Complete</Badge>}
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                {w.matchups.map((m) => (
                  <MatchupCard key={m.id} matchup={m} title={m.isBye ? "Bye" : "Matchup"} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function LeagueToggle({ current }: { current: League }) {
  const opts: { key: League; label: string }[] = [
    { key: "competitive", label: "Competitive" },
    { key: "casual", label: "Casual" },
  ];
  return (
    <div className="inline-flex rounded-lg border border-thg-slate/20 bg-thg-surface p-0.5">
      {opts.map((o) => (
        <Link
          key={o.key}
          href={`/history?league=${o.key}`}
          className={cn(
            "rounded-md px-3 py-1.5 text-sm font-sans font-semibold",
            current === o.key ? "bg-thg-slate text-white" : "text-thg-slate hover:bg-thg-mist-light",
          )}
        >
          {o.label}
        </Link>
      ))}
    </div>
  );
}
