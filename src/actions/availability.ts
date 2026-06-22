"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { availabilityRecurring } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import { SLOTS_PER_DAY, WEEKDAYS } from "@/lib/time";

export async function saveRecurringAvailability(
  slots: { weekday: number; slotIndex: number }[],
) {
  const user = await requireUser();

  // Validate slot bounds.
  const clean = slots.filter(
    (s) =>
      WEEKDAYS.includes(s.weekday as (typeof WEEKDAYS)[number]) &&
      s.slotIndex >= 0 &&
      s.slotIndex < SLOTS_PER_DAY,
  );

  // Replace the whole baseline for this user.
  await db.delete(availabilityRecurring).where(eq(availabilityRecurring.userId, user.id));
  if (clean.length > 0) {
    await db.insert(availabilityRecurring).values(
      clean.map((s) => ({ userId: user.id, weekday: s.weekday, slotIndex: s.slotIndex })),
    );
  }

  revalidatePath("/availability");
  return { ok: true, count: clean.length };
}
