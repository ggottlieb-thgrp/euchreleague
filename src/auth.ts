import NextAuth, { type DefaultSession } from "next-auth";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { randomInt } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import {
  users,
  accounts,
  sessions,
  verificationTokens,
  profiles,
  notificationPrefs,
} from "@/db/schema";
import { sendOtpEmail } from "@/lib/email/otp";

const ALLOWED_DOMAIN = process.env.ALLOWED_EMAIL_DOMAIN; // e.g. "thgrp.com"

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function generateOtp(): string {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
}

/**
 * Passwordless 6-digit OTP via Resend. Defined as a plain `type: "email"`
 * provider so we don't pull in nodemailer; Auth.js stores the code in the
 * verification_token table (hashed) and verifies it on the callback URL.
 */
const otpProvider = {
  id: "otp",
  type: "email" as const,
  name: "Email code",
  from: process.env.EMAIL_FROM,
  // Code lifetime (seconds).
  maxAge: 10 * 60,
  // Unused (we override sendVerificationRequest) but required by the type.
  server: {},
  options: {},
  generateVerificationToken: generateOtp,
  async sendVerificationRequest({ identifier, token }: { identifier: string; token: string }) {
    await sendOtpEmail(identifier, token);
  },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  providers: [otpProvider],
  pages: {
    signIn: "/login",
    verifyRequest: "/verify",
    error: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const email = user?.email?.toLowerCase();
      if (!email) return false;
      if (ALLOWED_DOMAIN && !email.endsWith(`@${ALLOWED_DOMAIN.toLowerCase()}`)) {
        return false; // outside the company domain
      }
      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        // `user` is the DB row (database session strategy), so it carries our
        // league-specific columns.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.role = (user as any).role ?? "player";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        session.user.league = (user as any).league ?? "competitive";
      }
      return session;
    },
  },
  events: {
    // First-time sign-in: grant admin role to allowlisted emails and seed the
    // player's profile + notification preference rows.
    async createUser({ user }) {
      if (!user.id) return;
      const email = user.email?.toLowerCase();
      if (email && ADMIN_EMAILS.includes(email)) {
        await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
      }
      await db.insert(profiles).values({ userId: user.id }).onConflictDoNothing();
      await db
        .insert(notificationPrefs)
        .values({ userId: user.id })
        .onConflictDoNothing();
    },
  },
});

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "player" | "admin";
      league: "competitive" | "casual";
    } & DefaultSession["user"];
  }
}
