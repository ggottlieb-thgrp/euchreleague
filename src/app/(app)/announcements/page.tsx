import { desc } from "drizzle-orm";
import { Megaphone } from "lucide-react";
import { db } from "@/db";
import { announcements } from "@/db/schema";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const dateFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function AnnouncementsPage() {
  const rows = await db.query.announcements.findMany({
    orderBy: [desc(announcements.createdAt)],
    with: { author: { columns: { name: true, email: true } } },
  });

  return (
    <div>
      <PageHeader title="League News" description="Announcements and updates from the commissioners." />

      {rows.length === 0 ? (
        <EmptyState
          icon={<Megaphone className="mx-auto h-8 w-8" />}
          title="No announcements yet"
          description="Check back here for league news and weekly updates."
        />
      ) : (
        <div className="space-y-4">
          {rows.map((a) => (
            <Card key={a.id}>
              <CardHeader>
                <CardTitle>{a.title}</CardTitle>
                <p className="text-xs text-thg-slate-light">
                  {dateFmt.format(a.createdAt)}
                  {a.author?.name ? ` · ${a.author.name}` : ""}
                </p>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap text-thg-slate">{a.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
