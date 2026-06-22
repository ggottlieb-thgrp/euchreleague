/**
 * Seed script — run with: npm run db:seed
 * (loads .env.local via the --env-file flag in the package.json script).
 *
 * Idempotent: safe to run more than once. Players self-register on first login,
 * so this only seeds locations + an active season + the first opt-in week.
 */
import { and, eq } from "drizzle-orm";
import { db } from "./index";
import { seasons, weeks, locations } from "./schema";

// THG office spots (manage these later in Admin → Locations).
const LOCATIONS = [
  { name: "The Reactor" },
  { name: "The Catalyst" },
  { name: "The Fishbowl" },
  { name: "The Family Room" },
  { name: "The Library" },
  { name: "Four Seasons Patio" },
  { name: "The Hangar Bar" },
  { name: "The Generator" },
  { name: "Pit 1" },
  { name: "Pit 2" },
  { name: "The Track" },
  { name: "Upstairs Balcony" },
  { name: "The Green Room" },
  { name: "Pagoda" },
  { name: "Lunch Area" },
  { name: "Somewhere else" },
];

async function seedLocations() {
  const existing = await db.select({ name: locations.name }).from(locations);
  const have = new Set(existing.map((l) => l.name));
  const toAdd = LOCATIONS.filter((l) => !have.has(l.name));
  if (toAdd.length) {
    await db.insert(locations).values(toAdd);
    console.log(`✓ Added ${toAdd.length} location(s)`);
  } else {
    console.log("• Locations already seeded");
  }
}

async function seedSeason(league: "competitive" | "casual") {
  const active = await db.query.seasons.findFirst({
    where: and(eq(seasons.league, league), eq(seasons.isActive, true)),
  });
  if (active) {
    console.log(`• ${league} season already active (${active.name})`);
    return;
  }
  const [s] = await db
    .insert(seasons)
    .values({ name: "Season 2", league, numWeeks: 4, isActive: true })
    .returning({ id: seasons.id });
  await db.insert(weeks).values({ seasonId: s.id, weekNumber: 1, status: "pending" });
  console.log(`✓ Created ${league} Season 2 with Week 1 (opt-in open)`);
}

async function main() {
  console.log("Seeding THG Euchre League…");
  await seedLocations();
  await seedSeason("competitive");
  await seedSeason("casual");
  console.log("Done. Admins listed in ADMIN_EMAILS become admins on first login.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
