"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import { optIns } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";

export async function setOptIn(weekId: number, optedIn: boolean) {
  const user = await requireUser();
  await db
    .insert(optIns)
    .values({ userId: user.id, weekId, optedIn, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [optIns.userId, optIns.weekId],
      set: { optedIn, updatedAt: new Date() },
    });
  revalidatePath("/pairings");
  revalidatePath("/dashboard");
  return { ok: true, optedIn };
}
