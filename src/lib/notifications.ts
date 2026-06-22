import "server-only";
import { and, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db";
import {
  weeks,
  matchups,
  scheduledGames,
  notificationPrefs,
} from "@/db/schema";
import { sendEmail } from "@/lib/email/send";
import {
  weeklyScheduleEmail,
  scheduleProposedEmail,
  scheduleConfirmedEmail,
  scoresDueEmail,
  gameReminderEmail,
} from "@/lib/email/templates";
import { buildIcs } from "@/lib/ics";
import { scheduleFormatter } from "@/lib/time";

type PrefKey = "pairings" | "schedule" | "scoreReminders" | "gameReminders";

/** Whether a user wants a given category (defaults to true if no row). */
async function wants(userId: string, key: PrefKey): Promise<boolean> {
  const row = await db.query.notificationPrefs.findFirst({
    where: eq(notificationPrefs.userId, userId),
  });
  if (!row) return true;
  return row[key];
}

const displayName = (u: { name: string | null; email: string }) =>
  u.name ?? u.email.split("@")[0];

/** Email every player in a published week their matchup + partners. */
export async function notifyPairingsPublished(weekId: number): Promise<void> {
  const week = await db.query.weeks.findFirst({
    where: eq(weeks.id, weekId),
    with: {
      matchups: {
        with: { players: { with: { user: { columns: { id: true, name: true, email: true } } } } },
      },
    },
  });
  if (!week) return;

  for (const m of week.matchups) {
    if (m.isBye) continue;
    for (const p of m.players) {
      if (!(await wants(p.userId, "pairings"))) continue;
      const partners = m.players
        .filter((x) => x.userId !== p.userId)
        .map((x) => displayName(x.user));
      const mail = weeklyScheduleEmail({ weekNumber: week.weekNumber, partners });
      await sendEmail({
        to: p.user.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        category: "pairings",
        userId: p.userId,
      });
    }
  }
}

export async function notifyScheduleProposed(scheduledGameId: number): Promise<void> {
  const sched = await loadSchedule(scheduledGameId);
  if (!sched) return;
  const when = sched.startsAt ? scheduleFormatter.format(sched.startsAt) : "a time";
  const proposerName = sched.players.find((p) => p.userId === sched.proposedBy);

  for (const p of sched.players) {
    if (p.userId === sched.proposedBy) continue;
    if (!(await wants(p.userId, "schedule"))) continue;
    const mail = scheduleProposedEmail({
      proposer: proposerName ? displayName(proposerName.user) : "A teammate",
      when,
      location: sched.locationName,
      matchupId: sched.matchupId,
    });
    await sendEmail({
      to: p.user.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      category: "schedule",
      userId: p.userId,
    });
  }
}

export async function notifyScheduleConfirmed(scheduledGameId: number): Promise<void> {
  const sched = await loadSchedule(scheduledGameId);
  if (!sched || !sched.startsAt) return;
  const when = scheduleFormatter.format(sched.startsAt);
  const ics = buildIcs({
    uid: `euchre-matchup-${sched.matchupId}@thg`,
    title: "Euchre League game",
    start: sched.startsAt,
    durationMin: sched.durationMin,
    location: sched.locationName ?? undefined,
    description: "THG Euchre League matchup",
  });

  for (const p of sched.players) {
    if (!(await wants(p.userId, "schedule"))) continue;
    const mail = scheduleConfirmedEmail({ when, location: sched.locationName });
    await sendEmail({
      to: p.user.email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      category: "schedule",
      userId: p.userId,
      ics: { filename: "euchre-game.ics", content: ics },
    });
  }
}

/** Friday-ish reminder for players with unfinished games in a week. */
export async function notifyScoresDue(weekId: number): Promise<void> {
  const week = await db.query.weeks.findFirst({
    where: eq(weeks.id, weekId),
    with: {
      matchups: {
        with: {
          players: { with: { user: { columns: { id: true, name: true, email: true } } } },
          games: { columns: { submittedAt: true } },
        },
      },
    },
  });
  if (!week) return;

  for (const m of week.matchups) {
    if (m.isBye) continue;
    const incomplete = m.games.length < 3 || m.games.some((g) => g.submittedAt === null);
    if (!incomplete) continue;
    for (const p of m.players) {
      if (!(await wants(p.userId, "scoreReminders"))) continue;
      const mail = scoresDueEmail({ weekNumber: week.weekNumber });
      await sendEmail({
        to: p.user.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        category: "score_reminders",
        userId: p.userId,
      });
    }
  }
}

/** Remind players of confirmed games starting within the next `hours`. */
export async function notifyUpcomingGames(hours = 24): Promise<void> {
  const now = new Date();
  const until = new Date(now.getTime() + hours * 3600_000);
  const rows = await db.query.scheduledGames.findMany({
    where: and(
      eq(scheduledGames.status, "confirmed"),
      gte(scheduledGames.startsAt, now),
      lte(scheduledGames.startsAt, until),
    ),
  });
  for (const sg of rows) {
    const sched = await loadSchedule(sg.id);
    if (!sched || !sched.startsAt) continue;
    const when = scheduleFormatter.format(sched.startsAt);
    for (const p of sched.players) {
      if (!(await wants(p.userId, "gameReminders"))) continue;
      const mail = gameReminderEmail({ when, location: sched.locationName });
      await sendEmail({
        to: p.user.email,
        subject: mail.subject,
        html: mail.html,
        text: mail.text,
        category: "game_reminders",
        userId: p.userId,
      });
    }
  }
}

async function loadSchedule(scheduledGameId: number) {
  const sched = await db.query.scheduledGames.findFirst({
    where: eq(scheduledGames.id, scheduledGameId),
    with: { location: { columns: { name: true } } },
  });
  if (!sched) return null;
  const matchup = await db.query.matchups.findFirst({
    where: eq(matchups.id, sched.matchupId),
    with: { players: { with: { user: { columns: { id: true, name: true, email: true } } } } },
  });
  if (!matchup) return null;
  return {
    matchupId: sched.matchupId,
    startsAt: sched.startsAt,
    durationMin: sched.durationMin,
    proposedBy: sched.proposedBy,
    locationName: sched.location?.name ?? null,
    players: matchup.players,
  };
}
