# THG Euchre League — Season 2

The Heritage Group's internal euchre league, rebuilt as a single Next.js app on
Vercel. Pairings, score entry, standings, history, player profiles, in-office
scheduling, automated weekly pairings, and email notifications — all in one
place, on-brand.

## Stack

- **Next.js 16** (App Router, TypeScript) — frontend + backend in one app
- **Vercel Postgres (Neon)** via **Drizzle ORM**
- **Auth.js v5** — passwordless 6-digit email code (OTP) via **Resend**
- **Tailwind v4** with the THG palette baked into component variants
- **Vercel Cron** — one daily dispatcher runs the weekly cycle

## Local setup

```bash
npm install
cp .env.example .env.local      # fill in the values (see below)
npm run db:push                 # create tables in your dev database
npm run db:seed                 # seed locations + an active season + week 1
npm run dev
```

Without `RESEND_API_KEY`, emails (including the sign-in code) are printed to the
server console — so you can develop and log in locally without a mail provider.

### Environment variables

See `.env.example`. The essentials:

| Var | Purpose |
| --- | --- |
| `DATABASE_URL` | Postgres connection (Vercel injects `POSTGRES_URL` in prod) |
| `AUTH_SECRET` | Auth.js session secret (`npx auth secret`) |
| `AUTH_URL` | App base URL (auto on Vercel; set locally) |
| `RESEND_API_KEY` / `EMAIL_FROM` | Email sending (must be a verified Resend domain) |
| `ALLOWED_EMAIL_DOMAIN` | Restrict sign-in to `thgrp.com` |
| `ADMIN_EMAILS` | Comma-separated emails granted admin on first login |
| `CRON_SECRET` | Shared secret Vercel Cron sends to `/api/cron/daily` |
| `LEAGUE_TIMEZONE` | Office timezone for scheduling/cron logic |

## Database

- Schema: `src/db/schema.ts` · relations: `src/db/relations.ts`
- `npm run db:generate` — create a SQL migration from the schema
- `npm run db:migrate` — apply migrations · `npm run db:push` — push schema directly (dev)
- `npm run db:studio` — open Drizzle Studio

## How the weekly cycle works

1. A **pending** week collects opt-ins (players toggle in/out on **Pairings**).
2. **Saturday** the cron generates random foursomes → **preview**, and emails admins.
3. Admins review/edit/regenerate or **Publish now** in **Admin → Pairings**.
4. **Monday** the cron **auto-publishes** any still-preview week (fallback),
   posts an announcement, emails everyone, and opens the next week for opt-ins.
5. Players use **Schedule** to find a common time + office location; a confirmed
   time emails an `.ics` invite.
6. **Thursday** the cron reminds players with unfinished games; scores are due Friday.

Everything the cron does, an admin can also do by hand — they share one code path
(`src/lib/league/generate.ts`, `src/lib/league/publish.ts`).

## Deploying to Vercel

1. Push to a Git repo and import into Vercel.
2. Add a **Postgres** store (injects `POSTGRES_URL`).
3. Set the env vars above in the Vercel project.
4. Verify **`thgeuchre.com`** as a sending domain in **Resend** (add the SPF +
   DKIM DNS records Resend gives you to the domain's DNS). Mail is sent from
   `noreply@thgeuchre.com` with `Reply-To: ggottlieb@thgrp.com`, so you don't
   need DNS changes on `thgrp.com`. This is a hard dependency for both login
   codes and notifications. (Optional: ask THG IT to allowlist the domain so
   mail lands in inboxes rather than spam.)
5. Run `npm run db:push` against the prod database (or apply migrations), then
   `npm run db:seed`.
6. The daily cron (`vercel.json`) runs `/api/cron/daily` at 13:00 UTC (~8–9am ET).
   The Hobby plan allows one daily cron, which is why a single dispatcher handles
   generate / publish / reminders based on the office-local weekday.

## Tests

```bash
npm test        # vitest — euchre logic, pairing generation, overlap, stats
```

## Project layout

```
src/
  app/                # routes: (app)/* protected, api/auth, api/cron/daily
  auth.ts             # Auth.js v5 + OTP-via-Resend + role/domain callbacks
  db/                 # Drizzle schema, relations, client, seed
  lib/                # euchre, pairings, stats, scheduling/overlap, time,
                      # email, notifications, league/{generate,publish,cron-dispatch}
  actions/            # server actions (optin, scores, schedule, admin, …)
  components/         # UI primitives + feature components
```

Season 1 (the original static page) is preserved under `archive/season-1/`.
