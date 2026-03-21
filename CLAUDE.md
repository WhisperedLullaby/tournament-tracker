# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

**Keep this file updated.** Any time a significant architectural decision is made, a major feature is added or removed, a known issue is resolved, or the project direction changes — update this file. It is the primary context source for future sessions.

---

## MCP Servers

| Server | Transport | Scope | Purpose |
|---|---|---|---|
| `supabase` | HTTP — `https://mcp.supabase.com/mcp` | user (global) | Query DB, inspect tables, check RLS policies, debug auth |
| `github` | stdio — `@modelcontextprotocol/server-github` | user (global) | PRs, issues, repo management |

> **Supabase auth:** Personal access token via `Authorization: Bearer` header. Token in Supabase Dashboard → Account → Access Tokens.
> **GitHub auth:** `GITHUB_PERSONAL_ACCESS_TOKEN` set as a Windows user environment variable (not in `.env.local`).

---

## Project Overview

**Tournament Tracker** — A fullstack web platform for managing volleyball tournaments. Organizers can create and manage tournaments; players can register, view live scores, standings, and bracket results.

- **Domain:** hewwopwincess.com
- **Deployed on:** Vercel (auto-deploys on push to `main`)
- **Database:** Supabase (PostgreSQL)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15.3 (App Router) |
| Language | TypeScript 5 (strict mode) |
| UI | TailwindCSS v4 + shadcn/ui (Radix UI) |
| Animations | framer-motion |
| ORM | Drizzle ORM |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth — Google OAuth 2.0 |
| Email | Resend |
| CAPTCHA | Cloudflare Turnstile |
| Linting | ESLint 9 + Prettier 3 |
| Analytics | @vercel/analytics |

---

## Architecture

### Routing
All primary pages live under `/tournaments/[slug]/`. Legacy top-level routes (`/standings`, `/schedule`, etc.) still exist but are not the active implementation.

```
src/app/
├── page.tsx                          # Redirects to /tournaments
├── tournaments/
│   ├── page.tsx                      # Tournament browser (upcoming/active/completed)
│   ├── create/page.tsx               # Create tournament (organizer whitelist only)
│   └── [slug]/
│       ├── layout.tsx                # Fetches tournament + user, provides context
│       ├── page.tsx                  # Tournament landing page
│       ├── register/page.tsx         # Team registration
│       ├── schedule/page.tsx         # Pool play schedule
│       ├── standings/page.tsx        # Pool + bracket standings
│       ├── scorekeeper/page.tsx      # Live scorekeeper (organizer only)
│       ├── bracket/page.tsx          # Bracket visualization
│       └── settings/page.tsx         # Tournament settings (organizer only)
├── api/                              # 17 API routes (games, bracket, registration, etc.)
└── auth/callback/route.ts            # Google OAuth callback
```

### Data Layer
- **ORM:** Drizzle ORM with schema at `src/lib/db/schema.ts`
- **Queries:** `src/lib/db/queries.ts`
- **8 tables:** tournaments, pods, pool_matches, pool_standings, bracket_teams, bracket_matches, tournament_roles, organizer_whitelist
- **Migrations:** 5 phases completed; run via `db:push` or the `/api/run-migration-5` utility endpoint

### Auth
- **Client:** `src/lib/auth/client.ts` (browser), `src/lib/auth/server.ts` (server)
- **Middleware:** `src/middleware.ts` — refreshes session on every request
- **Callback:** `src/app/auth/callback/route.ts` — exchanges OAuth code, redirects to `/auth/complete`
- **Complete:** `src/app/auth/complete/page.tsx` — client page that reads `sessionStorage` and redirects to intended destination
- **Sign-in page:** `src/app/auth/signin/page.tsx` — for protected flows (registration, pickup games, etc.)
- **Auth context:** `src/contexts/auth-context.tsx` — `AuthProvider` wraps root layout; exposes `user`, `signIn(redirectPath?)`, `signOut()` via `useAuth()` hook
- **Sign-in flow:** `signIn()` stores intended path in `sessionStorage`, sets `redirectTo` to just `/auth/callback` (no query params — avoids Supabase URL allowlist issues)

### Tournament Context
`src/contexts/tournament-context.tsx` — provides `tournament`, `userRole`, `isOrganizer`, `isParticipant` to all `[slug]` pages client-side.

---

## Database Schema (Key Tables)

| Table | Purpose |
|---|---|
| `tournaments` | Core tournament entity. Has slug, status, scoring rules (JSON), format config |
| `pods` | Registered teams (2-3 players or captain + team) |
| `pool_matches` | Pool play games with scores, status, court assignments |
| `pool_standings` | Per-pod W/L/point differential stats |
| `bracket_teams` | Composite teams formed after pool play (2 teams for pod_3, 4 teams for pod_2, etc.) |
| `bracket_matches` | Bracket games (winners/losers/championship) |
| `tournament_roles` | User roles per tournament: organizer or participant |
| `organizer_whitelist` | Controls who can create tournaments |

**Tournament Types:** `pod_2`, `pod_3`, `set_teams`
**Bracket Styles:** `single_elimination`, `double_elimination`
**Skill Levels:** C, B, A, Open

---

## Access Control Matrix

| Page | Public | Participant | Organizer |
|---|---|---|---|
| Browse / Tournament Detail | ✅ | ✅ | ✅ |
| Standings / Schedule / Bracket | ✅ | ✅ | ✅ |
| Register | ✅ (if auth) | ✅ | ✅ |
| Scorekeeper | ❌ | ❌ | ✅ |
| Settings | ❌ | ❌ | ✅ |
| Create Tournament | ❌ | ❌ | ✅ (whitelist) |

---

## Known Open Issues

### ✅ Google OAuth — RESOLVED
Root causes fixed: (1) `quick-actions-subfooter` was using the legacy `@/lib/supabase` client (implicit flow) instead of `@supabase/ssr` (PKCE); (2) callback route was setting cookies on `cookieStore` but returning a separate `NextResponse.redirect()` so cookies were dropped; (3) `redirectTo` included query params that didn't match Supabase's URL allowlist, causing fallback to Site URL. Fixed by building a centralized `AuthProvider` — `signIn()` stores destination in `sessionStorage`, `redirectTo` is just `/auth/callback` (exact allowlist match), and `/auth/complete` handles the post-auth redirect client-side.

### ✅ Schedule page pod names — RESOLVED
Pod names on the schedule were displaying raw DB IDs (e.g. "64") instead of player/team names. Fixed by building a `podNumberMap` (sorted DB ID → relative index 1–N) used as a fallback display and for filter button labels in `schedule-table.tsx`, `current-game.tsx`, and `next-up.tsx`.

### ✅ Schedule real-time updates — RESOLVED
Schedule page only polled during bracket phase. Fixed to always poll every 5s regardless of phase. Also ran `ALTER TABLE ... REPLICA IDENTITY FULL` on `pool_matches`, `bracket_matches`, `bracket_teams` and added the latter two to the `supabase_realtime` publication — required for filtered Supabase Realtime subscriptions to deliver UPDATE events.

### ✅ Bracket pod names showing raw DB IDs — RESOLVED
`bracket/page.tsx` was using `getAllPods()` which translates DB IDs to relative pod numbers, so `pods.get(team.pod1Id)` always missed. Fixed with `getPodNameMap()` — a new query that returns `Map<rawDbId, displayName>` without ID translation.

### ✅ Dynamic bracket system — RESOLVED
Bracket logic was hardcoded for 4 teams. Refactored `seedBracketMatches` and `advanceBracketTeams` in `queries.ts` to dispatch based on team count:
- **4-team DE** (pod_2 / 12 pods): 7 games — `seed4TeamDE` / `advance4TeamDE`
- **6-team DE** (pod_3 / 12 pods): 11 games — `seed6TeamDE` / `advance6TeamDE`
- Team count derived from `getBracketConfig`: `Math.floor(maxPods / podsPerTeam)`
- Teams seeded via serpentine draft (snake order) from pool standings
- `bracket_teams.pod3Id` made nullable in schema + DB migration for 2-pod teams

### ✅ Bracket game order (single court) — RESOLVED
Winners bracket games played all before losers games. Reordered to interleave: W-R1 games → L-R1 (losers can play immediately) → W-Final → L-Final → Championship. Game numbers 3 and 4 swapped for the existing tournament (direct DB update) and corrected in seeding/advancement code.

### ✅ Bracket display — RESOLVED
`bracket-display.tsx` now branches on `teamCount`:
- **4-team**: 3-column layout per bracket section, correct game labels (G3=Losers R1, G4=Winners Final)
- **6-team**: 4-column layout with W-R1 / W-SF / W-Final / Championship and matching losers columns
- `pod3Id` null guard throughout `bracket-display`, `bracket-standings`, `bracket-team-cards`

### 🟡 Hardcoded tournament ID in `/api/registration-status`
Needs to accept a `tournamentId` parameter instead of assuming ID = 1.

### 🟡 Payment step in registration not wired
The multi-step registration form has a payment step but it's not connected to any payment processor.

---

## Development Workflow

### Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # Run ESLint
npm run lint:fix     # Auto-fix lint issues
npm run format       # Prettier format all files
npm run db:generate  # Generate Drizzle migration
npm run db:push      # Push schema to database
npm run db:studio    # Open Drizzle Studio (DB GUI)
```

### Environment Variables (see `.env.local.example`)
```
DATABASE_URL                      # Supabase connection pooler string
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_TURNSTILE_SITE_KEY    # Cloudflare CAPTCHA
TURNSTILE_SECRET_KEY
RESEND_API_KEY                    # Email service
```

### Webpack Config Note
`next.config.ts` explicitly excludes `drizzle-orm` and `postgres` from the client bundle via `serverExternalPackages`. Do not import these in client components.

---

## Code Standards

- **Components:** Prefer smaller, focused components. Break pages into sections when it makes sense.
- **Linting:** ESLint enforces `no-unused-vars`, `no-explicit-any`, `no-unescaped-entities`. `no-console` is a warning (except `warn`/`error`).
- **Styling:** shadcn/ui components first. TailwindCSS v4 utility classes. `clsx` + `tailwind-merge` for conditional class logic.
- **DB queries:** Always scope queries by `tournamentId`. Never query across tournaments without intent.
- **No hardcoded tournament IDs** in API routes — pass as parameter.

---

## Docs Directory

`docs/` contains step-by-step implementation docs for every major feature built. Consult these before reworking a system to understand prior decisions:

| Doc | Topic |
|---|---|
| `011_google_oauth2.md` | Auth implementation |
| `012_multi_tournament_platform.md` | Multi-tournament migration (9 phases) |
| `014_multiple_tournament_types.md` | Tournament types, scoring rules, bracket config |
| `future_testing_strategy.md` | Testing approach (Playwright, Vitest, RTL) |

---

## Deployment

- **Platform:** Vercel — auto-deploys on push to `main`
- **Domain:** hewwopwincess.com
- **Env vars:** Set in Vercel dashboard (not committed to repo)
- **Rollback:** Via Vercel dashboard → Deployments → Promote to Production

---

## Future Features (Backlog)

- User profiles with tournament history
- Email notifications / announcements pipeline (Resend partially wired)
- Payment integration for registration
- Automated schedule generation from CSV upload
- Admin UI for organizer whitelist management
- SPR rating system (like Scoreholio)
- "Power up" tournament mode (experimental idea)
- Tournament templates (duplicate structure)
- Playwright / Vitest test suite
