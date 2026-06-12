# Tournament Tracker

A fullstack web platform for running volleyball tournaments and pickup games. Organizers create and manage events; players register, view live scores, standings, and bracket results in real time.

- **Live:** [hewwopwincess.com](https://hewwopwincess.com)
- **Hosting:** Vercel (auto-deploys on push to `main`)
- **Database:** Supabase (PostgreSQL)

## Features

- **Tournaments** — registration, auto-generated pool play schedules, live scorekeeping, pool standings, and single/double-elimination brackets (4- and 6-team double elimination).
- **Pickup games** — position-based signup with waitlists, attendance, auto-balanced lineups, tablet-optimized live scoring, and per-player stats.
- **Live updates** — Supabase Realtime drives the public scoreboards and schedule.
- **Roles** — Google sign-in; organizers (whitelisted) create events; admins see test entities. Scorekeeping is open to any signed-in user.

## Tech Stack

Next.js 15 (App Router) · TypeScript · TailwindCSS v4 + shadcn/ui · framer-motion · Drizzle ORM · zod · Supabase (Postgres + Auth) · Resend · Cloudflare Turnstile · Vercel.

## Getting Started

```bash
npm install
cp .env.local.example .env.local   # then fill in the values
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Required environment variables are documented in [`.env.local.example`](.env.local.example): `DATABASE_URL`, the `NEXT_PUBLIC_SUPABASE_*` keys, Turnstile keys, `RESEND_API_KEY`, and `CRON_SECRET`. `SUPABASE_SERVICE_ROLE_KEY` and `NEXT_PUBLIC_ENABLE_TEST_LOGIN` are dev-only — never set them in a deployed environment.

## Commands

```bash
npm run dev          # Start the dev server
npm run build        # Production build
npm run lint         # ESLint
npm run format       # Prettier
npm run db:studio    # Drizzle Studio (DB GUI)
npm run test:e2e     # Playwright E2E
```

## Database & migrations

The schema lives in `src/lib/db/schema.ts` (Drizzle ORM). RLS is enabled on every table and the browser only reads via constrained anon access — all writes go through server code. Because `db:push` has a known bug with this schema's check constraints, one-off production migrations are written as `scripts/*.ts` files run with:

```bash
npx tsx --env-file=.env.local scripts/<name>.ts
```

See `scripts/apply-migration.ts` for the template, and the **Security model** and **Scripts** sections of [`CLAUDE.md`](CLAUDE.md) for details.

## Documentation

- [`CLAUDE.md`](CLAUDE.md) — architecture, data layer, access-control matrix, conventions, and the security model. The primary reference.
- [`docs/`](docs/) — step-by-step implementation notes for each major feature. Notably `016_security_hardening.md` (RLS lockdown, API auth, transactions) and `012_multi_tournament_platform.md`.

## Deployment

Vercel auto-deploys `main`. Environment variables are set in the Vercel dashboard. Rollback via **Deployments → Promote to Production**.
