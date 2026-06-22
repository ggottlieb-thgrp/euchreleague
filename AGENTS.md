<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# THG Euchre League — agent notes

Season 2 rewrite: one Next.js 16 (App Router, TS) app on Vercel. See `README.md`
for setup/deploy. Season 1's static page is archived in `archive/season-1/`.

## Conventions
- **Reads**: async Server Components query Drizzle directly via `@/db`.
- **Writes**: server actions in `src/actions/*` (`"use server"`); each calls
  `requireUser()`/`requireAdmin()` first, then `revalidatePath`.
- **Never** expose DB or secrets to the client. Client components are only for
  interactivity and call server actions.
- THG palette/contrast rules live in component variants (`src/components/ui/*`).
  Use `bg-thg-*`/`text-thg-*` tokens; never white text on yellow/gray.
- Pure logic (`src/lib/euchre|pairings|stats|scheduling`) is unit-tested
  (`npm test`). Keep it pure and DB-free.
- Cron and admin buttons share `src/lib/league/{generate,publish}.ts` — change
  league behavior there, not in the route/action.
- neon-http has no transactions; multi-step writes are sequential + idempotent.
- Auth/scheduling/cron routes use `export const runtime = "nodejs"`.

## Gotchas
- Schedule times are stored as wall-clock-in-UTC and always formatted with
  `timeZone: "UTC"` (see `src/lib/time.ts`). Don't add per-user tz math.
- `src/proxy.ts` (Next 16's renamed middleware) only checks cookie presence;
  real authz is server-side in `auth-helpers.ts`.
