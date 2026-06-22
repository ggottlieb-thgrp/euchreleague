import { Resend } from "resend";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import type { ReactElement } from "react";

type Category = "pairings" | "schedule" | "score_reminders" | "game_reminders" | "auth";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM ?? "THG Euchre League <onboarding@resend.dev>";
const replyTo = process.env.EMAIL_REPLY_TO || undefined;
const resend = apiKey ? new Resend(apiKey) : null;

export interface SendEmailArgs {
  to: string;
  subject: string;
  react?: ReactElement;
  html?: string;
  text?: string;
  category: Category;
  /** Owner of the message, for the audit log. Null for pre-signup auth codes. */
  userId?: string | null;
  /** Optional .ics calendar attachment. */
  ics?: { filename: string; content: string };
}

/**
 * Single email entry point. In dev (no RESEND_API_KEY) it logs to the console
 * so local flows — including the sign-in OTP — work without a mail provider.
 * Every attempt is recorded in the `notifications` table for audit/idempotency.
 */
export async function sendEmail(args: SendEmailArgs): Promise<{ ok: boolean }> {
  const { to, subject, react, html, text, category, userId = null, ics } = args;

  if (!resend) {
    console.info(
      `\n📧 [dev email] to=${to} category=${category}\n   subject: ${subject}` +
        (text ? `\n   text: ${text}` : ""),
    );
    return { ok: true };
  }

  try {
    const attachments = ics
      ? [{ filename: ics.filename, content: Buffer.from(ics.content).toString("base64") }]
      : undefined;

    const { error } = await resend.emails.send({
      from,
      to,
      subject,
      ...(replyTo ? { replyTo } : {}),
      ...(react ? { react } : {}),
      ...(html ? { html } : {}),
      ...(text ? { text } : {}),
      ...(attachments ? { attachments } : {}),
    } as Parameters<typeof resend.emails.send>[0]);

    if (error) throw new Error(error.message);

    await logNotification(userId, category, subject, "sent");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`Email send failed (${category} -> ${to}): ${message}`);
    await logNotification(userId, category, subject, "failed", message);
    return { ok: false };
  }
}

async function logNotification(
  userId: string | null,
  category: Category,
  subject: string,
  status: "sent" | "failed",
  error?: string,
) {
  try {
    await db.insert(notifications).values({ userId, category, subject, status, error });
  } catch {
    // Never let audit logging break the actual send path.
  }
}
