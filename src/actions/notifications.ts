"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { notificationPrefs } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";

export interface PrefsInput {
  pairings: boolean;
  schedule: boolean;
  scoreReminders: boolean;
  gameReminders: boolean;
}

export async function setNotificationPrefs(prefs: PrefsInput) {
  const user = await requireUser();
  await db
    .insert(notificationPrefs)
    .values({ userId: user.id, ...prefs })
    .onConflictDoUpdate({ target: notificationPrefs.userId, set: prefs });
  revalidatePath("/settings/notifications");
  return { ok: true };
}
