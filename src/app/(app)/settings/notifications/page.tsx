import { eq } from "drizzle-orm";
import { db } from "@/db";
import { notificationPrefs } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { NotificationPrefsForm } from "@/components/settings/notification-prefs-form";

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
      <PageHeader title="Email preferences" description="Choose which emails you'd like to receive." />
      <Card>
        <CardContent className="pt-5">
          <NotificationPrefsForm initial={initial} />
        </CardContent>
      </Card>
    </div>
  );
}
