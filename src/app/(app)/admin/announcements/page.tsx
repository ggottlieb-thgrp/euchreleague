import { desc } from "drizzle-orm";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AnnouncementForm } from "@/components/admin/announcement-form";
import { DeleteAnnouncementButton } from "@/components/admin/delete-announcement-button";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });

export default async function AdminAnnouncementsPage() {
  const rows = await db.query.announcements.findMany({
    orderBy: [desc(announcements.createdAt)],
  });

  return (
    <div className="max-w-2xl">
      <PageHeader title="Announcements" description="Post league news for everyone." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>New announcement</CardTitle>
        </CardHeader>
        <CardContent>
          <AnnouncementForm />
        </CardContent>
      </Card>

      <div className="space-y-3">
        {rows.map((a) => (
          <div
            key={a.id}
            className="flex items-start justify-between gap-3 rounded-lg border border-thg-slate/10 bg-thg-surface p-4"
          >
            <div>
              <p className="font-semibold text-thg-slate">{a.title}</p>
              <p className="text-xs text-thg-slate-light">{dateFmt.format(a.createdAt)}</p>
              <p className="mt-1 line-clamp-2 text-sm text-thg-slate-light">{a.body}</p>
            </div>
            <DeleteAnnouncementButton id={a.id} />
          </div>
        ))}
      </div>
    </div>
  );
}
