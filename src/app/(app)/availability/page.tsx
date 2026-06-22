import Link from "next/link";
import { requireUser } from "@/lib/auth-helpers";
import { getRecurringAvailability } from "@/lib/data/availability";
import { getWeeksDetailed, type League } from "@/lib/data/league";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { AvailabilityGrid } from "@/components/availability/availability-grid";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AvailabilityPage() {
  const user = await requireUser();
  const league = user.league as League;
  const [initial, weeks] = await Promise.all([
    getRecurringAvailability(user.id),
    getWeeksDetailed(league),
  ]);

  const myMatchup = weeks[0]?.matchups.find(
    (m) => !m.isBye && m.players.some((p) => p.userId === user.id),
  );

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Your availability"
        description="Mark when you're usually free so your group can find a time to play."
      />

      {myMatchup && (
        <Card className="mb-6 bg-thg-slate text-white" accent={false}>
          <CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
            <p className="text-thg-mist">
              You have a matchup this week. Find a time and place with your group.
            </p>
            <Link
              href={`/matchups/${myMatchup.id}/schedule`}
              className={cn(buttonVariants({ variant: "accent", size: "sm" }))}
            >
              Schedule it →
            </Link>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Weekly availability</CardTitle>
        </CardHeader>
        <CardContent>
          <AvailabilityGrid initial={[...initial]} />
        </CardContent>
      </Card>
    </div>
  );
}
