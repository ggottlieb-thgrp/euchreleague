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

## How the weekly cycle works

1. A **pending** week collects opt-ins (players toggle in/out on **Pairings**).
2. **Saturday** the cron generates random foursomes → **preview**, and emails admins.
3. Admins review/edit/regenerate or **Publish now** in **Admin → Pairings**.
4. **Monday** the cron **auto-publishes** any still-preview week (fallback),
   posts an announcement, emails everyone, and opens the next week for opt-ins.
5. Players use **Schedule** to find a common time + office location; a confirmed
   time emails an `.ics` invite.
6. **Thursday** the cron reminds players with unfinished games; scores are due Friday.

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
