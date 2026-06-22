"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { scheduledGames, matchups, matchupPlayers, weeks } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { slotDateTimeUTC, mondayOfWeekUTC, SLOT_MINUTES } from "@/lib/time";
import { notifyScheduleProposed, notifyScheduleConfirmed } from "@/lib/notifications";

async function assertParticipant(matchupId: number, userId: string, role: string) {
  const players = await db
    .select({ userId: matchupPlayers.userId })
    .from(matchupPlayers)
    .where(eq(matchupPlayers.matchupId, matchupId));
  return players.some((p) => p.userId === userId) || role === "admin";
}

export async function proposeSchedule(input: {
  matchupId: number;
  weekday: number;
  startSlot: number;
  slotSpan: number; // number of slots
  locationId: number | null;
}) {
  const user = await requireUser();
  const { matchupId, weekday, startSlot, slotSpan, locationId } = input;

  if (!(await assertParticipant(matchupId, user.id, user.role))) {
    return { ok: false, error: "You're not in this matchup." };
  }

  // Anchor the time to the matchup's week (fallback: this week's Monday).
  const matchup = await db.query.matchups.findFirst({
    where: eq(matchups.id, matchupId),
    with: { week: true },
  });
  if (!matchup) return { ok: false, error: "Matchup not found." };

  const week = matchup.week as typeof weeks.$inferSelect;
  const baseMonday = week.startsOn
    ? mondayOfWeekUTC(new Date(week.startsOn))
    : mondayOfWeekUTC(new Date());
  const startsAt = slotDateTimeUTC(baseMonday, weekday, startSlot);
  const durationMin = Math.max(slotSpan, 1) * SLOT_MINUTES;

  const [row] = await db
    .insert(scheduledGames)
    .values({
      matchupId,
      locationId,
      startsAt,
      durationMin,
      status: "proposed",
      proposedBy: user.id,
      confirmedAt: null,
    })
    .onConflictDoUpdate({
      target: scheduledGames.matchupId,
      set: {
        locationId,
        startsAt,
        durationMin,
        status: "proposed",
        proposedBy: user.id,
        confirmedAt: null,
      },
    })
    .returning({ id: scheduledGames.id });

  // Also assign the location to the matchup for at-a-glance display.
  if (locationId) {
    await db.update(matchups).set({ locationId }).where(eq(matchups.id, matchupId));
  }

  revalidatePath(`/matchups/${matchupId}/schedule`);
  revalidatePath("/pairings");
  revalidatePath("/dashboard");

  try {
    await notifyScheduleProposed(row.id);
  } catch (e) {
    console.error("notifyScheduleProposed failed", e);
  }
  return { ok: true };
}

export async function confirmSchedule(matchupId: number) {
  const user = await requireUser();
  if (!(await assertParticipant(matchupId, user.id, user.role))) {
    return { ok: false, error: "You're not in this matchup." };
  }
  const sched = await db.query.scheduledGames.findFirst({
    where: eq(scheduledGames.matchupId, matchupId),
  });
  if (!sched) return { ok: false, error: "Nothing has been proposed yet." };

  await db
    .update(scheduledGames)
    .set({ status: "confirmed", confirmedAt: new Date() })
    .where(eq(scheduledGames.matchupId, matchupId));

  revalidatePath(`/matchups/${matchupId}/schedule`);
  revalidatePath("/pairings");
  revalidatePath("/dashboard");

  try {
    await notifyScheduleConfirmed(sched.id);
  } catch (e) {
    console.error("notifyScheduleConfirmed failed", e);
  }
  return { ok: true };
}
