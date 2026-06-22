import "server-only";
import { and, eq, desc } from "drizzle-orm";
import { db } from "@/db";
import { seasons, weeks } from "@/db/schema";
import { generateWeekPairings } from "@/lib/league/generate";
import { publishWeek } from "@/lib/league/publish";
import { notifyScoresDue, notifyUpcomingGames } from "@/lib/notifications";
import { sendEmail } from "@/lib/email/send";

const APP_URL = process.env.AUTH_URL ?? "https://thgeuchre.com";
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim())
  .filter(Boolean);

// Office-local weekday (0=Sun..6=Sat) using the league timezone.
function officeWeekday(): number {
  const tz = process.env.LEAGUE_TIMEZONE ?? "America/Indiana/Indianapolis";
  const wd = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "short" }).format(new Date());
  return { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }[wd] ?? new Date().getUTCDay();
}

const GENERATE_DAY = 6; // Saturday: generate preview
const PUBLISH_DAY = 1; // Monday: auto-publish fallback
const SCORE_REMINDER_DAY = 4; // Thursday: nudge before Friday deadline

/**
 * The single daily Vercel Cron entry point. Decides what to do from the
 * office-local weekday. Idempotent: re-running on the same day is safe.
 */
export async function runDailyDispatch(): Promise<Record<string, unknown>> {
  const weekday = officeWeekday();
  const log: Record<string, unknown> = { weekday };

  const activeSeasons = await db.query.seasons.findMany({
    where: eq(seasons.isActive, true),
  });

  if (weekday === GENERATE_DAY) {
    const generated: number[] = [];
    for (const s of activeSeasons) {
      const pending = await db.query.weeks.findFirst({
        where: and(eq(weeks.seasonId, s.id), eq(weeks.status, "pending")),
        orderBy: [desc(weeks.weekNumber)],
      });
      if (pending) {
        try {
          await generateWeekPairings(pending.id); // -> preview
          generated.push(pending.weekNumber);
          await emailAdmins(
            `Week ${pending.weekNumber} pairings ready to review`,
            `Pairings for ${s.name} Week ${pending.weekNumber} have been generated and are in preview. Review or edit them before they auto-publish Monday: ${APP_URL}/admin/pairings`,
          );
        } catch (e) {
          log[`generate_error_${s.id}`] = e instanceof Error ? e.message : String(e);
        }
      }
    }
    log.generated = generated;
  }

  if (weekday === PUBLISH_DAY) {
    const published: number[] = [];
    for (const s of activeSeasons) {
      const preview = await db.query.weeks.findFirst({
        where: and(eq(weeks.seasonId, s.id), eq(weeks.status, "preview")),
        orderBy: [desc(weeks.weekNumber)],
      });
      if (preview) {
        await publishWeek(preview.id); // auto-publish fallback
        published.push(preview.weekNumber);
      }
    }
    log.published = published;
  }

  if (weekday === SCORE_REMINDER_DAY) {
    for (const s of activeSeasons) {
      const current = await db.query.weeks.findFirst({
        where: and(eq(weeks.seasonId, s.id), eq(weeks.status, "published")),
        orderBy: [desc(weeks.weekNumber)],
      });
      if (current) await notifyScoresDue(current.id);
    }
    log.scoreReminders = true;
  }

  // Upcoming-game reminders run every day.
  await notifyUpcomingGames(24);
  log.gameReminders = true;

  return log;
}

async function emailAdmins(subject: string, text: string) {
  for (const to of ADMIN_EMAILS) {
    await sendEmail({ to, subject, text, html: `<p>${text}</p>`, category: "auth", userId: null });
  }
}
