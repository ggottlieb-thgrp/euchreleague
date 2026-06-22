import { asc } from "drizzle-orm";
import { db } from "@/db";
import { locations } from "@/db/schema";
import { PageHeader, EmptyState } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LocationForm, LocationToggle } from "@/components/admin/location-manager";

export const dynamic = "force-dynamic";

export default async function AdminLocationsPage() {
  const rows = await db.query.locations.findMany({ orderBy: [asc(locations.name)] });

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Locations"
        description="Spots around the office where games can be played."
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add a location</CardTitle>
        </CardHeader>
        <CardContent>
          <LocationForm />
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <EmptyState title="No locations yet" description="Add the first one above." />
      ) : (
        <div className="space-y-2">
          {rows.map((l) => (
            <div
              key={l.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-thg-slate/10 bg-thg-surface p-4"
            >
              <div>
                <p className="font-semibold text-thg-slate">{l.name}</p>
                <p className="text-xs text-thg-slate-light">
                  {[l.building, l.floor].filter(Boolean).join(" · ") || "—"}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-thg-slate-light">{l.active ? "Active" : "Hidden"}</span>
                <LocationToggle id={l.id} active={l.active} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
