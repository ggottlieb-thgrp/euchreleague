import { asc } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireAdmin } from "@/lib/auth-helpers";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UserRowControls } from "@/components/admin/user-row";
import { getOptInWeek, getOptInMap } from "@/lib/data/optin";
import type { League } from "@/lib/data/league";

export const dynamic = "force-dynamic";

const LEAGUES: League[] = ["competitive", "casual"];

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const rows = await db.query.users.findMany({ orderBy: [asc(users.name)] });

  const openWeeks = new Map(
    await Promise.all(LEAGUES.map(async (l) => [l, await getOptInWeek(l)] as const)),
  );

  const optInMaps = new Map(
    await Promise.all(
      LEAGUES.map(async (l) => {
        const week = openWeeks.get(l);
        const ids = rows.filter((u) => u.league === l).map((u) => u.id);
        return [l, week ? await getOptInMap(week.id, ids) : new Map<string, boolean>()] as const;
      }),
    ),
  );

  return (
    <div>
      <PageHeader title="Users" description={`${rows.length} registered players.`} />
      <Card accent={false}>
        <div className="divide-y divide-thg-slate/10">
          {rows.map((u) => {
            const openWeek = openWeeks.get(u.league) ?? null;
            const optedIn = optInMaps.get(u.league)?.get(u.id) ?? true;
            return (
              <div
                key={u.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold text-thg-slate">
                    {u.name ?? u.email.split("@")[0]}
                    {u.role === "admin" && <Badge variant="slate">Admin</Badge>}
                  </p>
                  <p className="truncate text-xs text-thg-slate-light">{u.email}</p>
                </div>
                <UserRowControls
                  userId={u.id}
                  role={u.role}
                  league={u.league}
                  isSelf={u.id === admin.id}
                  openWeekId={openWeek?.id ?? null}
                  openWeekNumber={openWeek?.weekNumber ?? null}
                  optedIn={optedIn}
                />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
