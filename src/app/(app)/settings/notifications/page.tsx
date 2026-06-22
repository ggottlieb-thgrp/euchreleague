import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notificationPrefs } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NotificationPrefsForm } from "@/components/settings/notification-prefs-form";
import { LeaguePreferenceForm } from "@/components/settings/league-preference-form";
import type { League } from "@/lib/data/league";

export const dynamic = "force-dynamic";

export default async function NotificationSettingsPage() {
  const user = await requireUser();
  const row = await db.query.notificationPrefs.findFirst({
    where: eq(notificationPrefs.userId, user.id),
  });

  const initial = {
    pairings: row?.pairings ?? true,
    schedule: row?.schedule ?? true,
    scoreReminders: row?.scoreReminders ?? true,
    gameReminders: row?.gameReminders ?? true,
  };

  return (
    <div className="max-w-xl">
      <PageHeader title="Settings" description="Choose your league and email preferences." />
      <div className="space-y-5">
        <Card>
          <CardHeader>
            <CardTitle>League</CardTitle>
          </CardHeader>
          <CardContent>
            <LeaguePreferenceForm initialLeague={user.league as League} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Email preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <NotificationPrefsForm initial={initial} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
