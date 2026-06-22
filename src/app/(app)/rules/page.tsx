import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Rules · THG Euchre League" };

export default function RulesPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Rules" description="How the league runs, and how euchre is scored." />

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>League structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-thg-slate">
            <div className="flex flex-wrap gap-2">
              <Badge variant="yellow">Competitive</Badge>
              <Badge variant="soft">Casual</Badge>
            </div>
            <ul className="list-disc space-y-1.5 pl-5 text-thg-slate-light">
              <li>
                <span className="font-semibold text-thg-slate">Competitive</span> — scored and
                ranked. Win/loss and points feed the leaderboard each week.
              </li>
              <li>
                <span className="font-semibold text-thg-slate">Casual</span> — same format, just for
                fun. Play your games without the pressure of standings.
              </li>
              <li>Players are grouped into foursomes each week. Leftover players sit out (a “bye”).</li>
              <li>Opt in for the week before pairings are generated to be included.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Weekly cadence</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1.5 pl-5 text-thg-slate-light">
              <li>Pairings are posted at the start of each week (Monday).</li>
              <li>Each foursome plays <span className="font-semibold text-thg-slate">3 games to 10</span>.</li>
              <li>
                Use the <span className="font-semibold text-thg-slate">Schedule</span> tab to find a
                time and a spot at the office that works for your group.
              </li>
              <li>Submit your scores by <span className="font-semibold text-thg-slate">Friday</span>.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>How a matchup works</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-thg-slate-light">
              The four players rotate partners so everyone partners with everyone exactly once over
              the three games:
            </p>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-thg-slate-light">
              <li>Game 1 — A &amp; B vs C &amp; D</li>
              <li>Game 2 — A &amp; C vs B &amp; D</li>
              <li>Game 3 — A &amp; D vs B &amp; C</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Euchre scoring</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1.5 pl-5 text-thg-slate-light">
              <li>Make your bid (3–4 tricks): <span className="font-semibold text-thg-slate">1 point</span>.</li>
              <li>All 5 tricks (march): <span className="font-semibold text-thg-slate">2 points</span>.</li>
              <li>Going alone and taking all 5 (loner): <span className="font-semibold text-thg-slate">4 points</span>.</li>
              <li>Getting euchred (set): the defenders score <span className="font-semibold text-thg-slate">2 points</span>.</li>
              <li>Reneging (failing to follow suit when able) is penalized — play it straight.</li>
              <li>8 deals per game (two rotations of four dealers); first to 10 wins.</li>
              <li>If tied after 8 deals, play one extra hand to decide it.</li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Standings &amp; tiebreaks</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-thg-slate-light">
              The leaderboard ranks competitive players by <span className="font-semibold text-thg-slate">total wins</span>,
              breaking ties by <span className="font-semibold text-thg-slate">total points</span>.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
