import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export const metadata = { title: "Rules · THG Euchre League" };

export default function RulesPage() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Rules" description="How the league runs, and how euchre is scored." />

      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>League Structure</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-thg-slate">
            <p className="text-thg-slate-light">We run two concurrent leagues:</p>
            <ul className="list-disc space-y-1.5 pl-5 text-thg-slate-light">
              <li>
                <span className="font-semibold text-thg-slate">Competitive:</span>
                <ul className="mt-1 list-disc space-y-1.5 pl-5">
                  <li>
                    4-week season, 4-player groups, 3 games/week, 8 hands per
                    game, rotating partners each game.
                  </li>
                  <li>
                    Groups determined Monday morning. Games must be played and
                    submitted by Friday that week.
                  </li>
                  <li>Ability to opt in or out for the next week before groups are made.</li>
                  <li>Standings ordered by points per game, with wins as a tiebreaker. This rewards the best individual player — not the one who played the most.</li>
                </ul>
              </li>
              <li>
                <span className="font-semibold text-thg-slate">Casual:</span>
                <ul className="mt-1 list-disc space-y-1.5 pl-5">
                  <li>4-week season, 4-player groups, optional rotation and scoring.</li>
                  <li>Groups determined Monday morning. Play when best fits for everyone.</li>
                  <li>Ability to opt in or out for the next week before groups are made.</li>
                  <li>No score tracking or leaderboards.</li>
                </ul>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Basic Euchre Rules</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc space-y-1.5 pl-5 text-thg-slate-light">
              <li>Deal starts with the holder of the first Black Jack and moves clockwise.</li>
              <li>After shuffle, offer cut to the player to your right, then begin dealing.</li>
              <li>
                Deal must happen clockwise in 2 rounds. Typically in a 2-3 or 3-2
                pattern so that every player gets 5 cards.
              </li>
              <li>No “Steal the Deal” rule. Deal must follow proper order.</li>
              <li>Misdeal voids the hand, and the deal passes to the next player.</li>
              <li>“Stick the Dealer” if no one orders up.</li>
              <li>No “Farmer’s Hand” rule.</li>
              <li>No “Partner&apos;s Best” rule when going alone.</li>
              <li>No “Canadian Loner” rule when ordering trump to your partner.</li>
              <li>
                Each game consists of two rotations around the table. Every person
                will deal twice for eight total deals.
              </li>
              <li>
                New rule for quicker play: whatever the score is after these 8
                hands, record that as the final score for the game. Scores can be
                below or above 10 points.
              </li>
              <li>Apply this format to all 3 matchups each week and submit your scores as usual.</li>
              <li>
                Scoring:
                <ul className="mt-1 list-disc space-y-1.5 pl-5">
                  <li>1 point for calling trump and winning majority of tricks.</li>
                  <li>2 points for calling trump and winning all 5 tricks.</li>
                  <li>2 points awarded to defenders on a Euchre.</li>
                  <li>2 points for opposing team reneging, meaning failing to follow suit when able to.</li>
                  <li>4 points for going alone and winning all 5 tricks.</li>
                </ul>
              </li>
              <li>Trump order: Jack of trump, Jack of same color, Ace, King, Queen, 10, 9.</li>
              <li>Follow suit if you can; otherwise you may trump or discard.</li>
              <li>The highest card of led suit wins, unless trumped.</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
