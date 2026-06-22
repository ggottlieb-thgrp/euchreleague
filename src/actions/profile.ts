"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireUser } from "@/lib/auth-helpers";
import type { League } from "@/lib/data/league";

export async function setMyLeague(league: League) {
  const user = await requireUser();
  if (league !== "competitive" && league !== "casual") {
    return { ok: false, error: "Choose Competitive or Casual." };
  }

  await db.update(users).set({ league }).where(eq(users.id, user.id));

  for (const path of [
    "/settings/notifications",
    "/dashboard",
    "/pairings",
    "/scores",
    "/availability",
    "/leaderboard",
    "/history",
    "/players",
  ]) {
    revalidatePath(path);
  }

  return { ok: true, league };
}
