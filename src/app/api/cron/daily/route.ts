import { NextResponse, type NextRequest } from "next/server";
import { runDailyDispatch } from "@/lib/league/cron-dispatch";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Single daily Vercel Cron job. Vercel sends `Authorization: Bearer $CRON_SECRET`.
 * The handler decides what to do from the office-local weekday (generate /
 * publish / remind), so one daily job covers the whole weekly cycle — which is
 * all the Hobby plan allows.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runDailyDispatch();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("cron/daily failed:", e);
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : "Cron failed" },
      { status: 500 },
    );
  }
}
