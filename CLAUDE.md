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
Two top-level products: tournaments and pickup games. Tournament pages live under `/tournaments/[slug]/`; pickup pages mirror that pattern at `/pickup/[slug]/`. Legacy top-level routes (`/standings`, `/schedule`, etc.) still exist but are not the active implementation.

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
├── pickup/
│   ├── page.tsx                      # Pickup session browser
│   ├── create/page.tsx               # Create pickup session (organizer whitelist only)
│   └── [slug]/
│       ├── layout.tsx                # Fetches session + user, provides PickupProvider
│       ├── page.tsx                  # Session detail + roster
│       ├── register/page.tsx         # Position-based signup (guest or auth)
│       ├── attendance/page.tsx       # Take attendance (organizer only)
│       ├── lineups/page.tsx          # Auto-generate balanced lineups per series
│       ├── scoreboard/page.tsx       # Public live scoreboard (Supabase Realtime)
│       └── scorekeeper/page.tsx      # Tablet-optimized live scoring (organizer only)
├── api/                              # Tournament + pickup REST endpoints
└── auth/callback/route.ts            # Google OAuth callback
```

### Data Layer
- **ORM:** Drizzle ORM with schema at `src/lib/db/schema.ts`
- **Queries:** `src/lib/db/queries.ts` (tournaments) + `src/lib/db/pickup-queries.ts` (pickup)
- **13 tables:** tournaments, pods, pool_matches, pool_standings, bracket_teams, bracket_matches, tournament_roles, organizer_whitelist, pickup_sessions, pickup_registrations, pickup_series, pickup_games, pickup_player_stats
- **Migrations:** `db:push` has a known bug with check constraints — use direct SQL. The established pattern for one-off prod migrations is a `scripts/*.ts` script using the existing `db` client. Example: `npx tsx --env-file=.env.local scripts/<name>.ts`. See `scripts/apply-migration.ts` as the template.

### Auth
- **Client:** `src/lib/auth/client.ts` (browser), `src/lib/auth/server.ts` (server)
- **Middleware:** `src/middleware.ts` — refreshes session on every request
- **Callback:** `src/app/auth/callback/route.ts` — exchanges OAuth code, redirects to `/auth/complete`
- **Complete:** `src/app/auth/complete/page.tsx` — client page that reads `sessionStorage` and redirects to intended destination
- **Sign-in page:** `src/app/auth/signin/page.tsx` — for protected flows (registration, pickup games, etc.)
- **Auth context:** `src/contexts/auth-context.tsx` — `AuthProvider` wraps root layout; exposes `user`, `isLoading`, `signIn(redirectPath?)`, `signOut()` via `useAuth()` hook
- **Sign-in flow:** `signIn()` stores intended path in `sessionStorage`, sets `redirectTo` to just `/auth/callback` (no query params — avoids Supabase URL allowlist issues)
- **Navigation auth:** `src/components/navigation.tsx` uses `useAuth()` — do not manage auth state independently in this component. Sign In button renders when `!isLoading && !user`; guard with `isLoading` to avoid flash of wrong state.
- **Production auth is Google OAuth only.** Email/password is intentionally not a public sign-in path. The sign-in page does render a `<form>` for email + password, but only when `NEXT_PUBLIC_ENABLE_TEST_LOGIN === "true"` — this is for local testing against seeded users (`test1@test.com`…`test13@test.com` / `test123`). Do not add email/password to the main auth flow without an explicit product decision. Do not set `NEXT_PUBLIC_ENABLE_TEST_LOGIN` in any deployed environment.

### Tournament Context
`src/contexts/tournament-context.tsx` — provides `tournament`, `userRole`, `isOrganizer`, `isParticipant` to all tournament `[slug]` pages client-side.

### Pickup Context
`src/contexts/pickup-context.tsx` — `PickupProvider` + `usePickup()` hook. Provides `session`, `userRegistration`, `isOrganizer`, `isLoading` to all pickup `[slug]` pages.

---

## Database Schema (Key Tables)

### Tournaments
| Table | Purpose |
|---|---|
| `tournaments` | Core tournament entity. Has slug, status, scoring rules (JSON), format config |
| `pods` | Registered teams (2-3 players or captain + team) |
| `pool_matches` | Pool play games with scores, status, court assignments |
| `pool_standings` | Per-pod W/L/point differential stats |
| `bracket_teams` | Composite teams formed after pool play (2 teams for pod_3, 4 teams for pod_2, etc.) |
| `bracket_matches` | Bracket games (winners/losers/championship) |
| `tournament_roles` | User roles per tournament: organizer or participant |
| `organizer_whitelist` | Controls who can create tournaments and pickup sessions |

### Pickup Games
| Table | Purpose |
|---|---|
| `pickup_sessions` | Core pickup session entity. Slug, date, position limits (JSON), scoring rules (JSON), `payment_info` (JSON, nullable), `is_test` flag |
| `pickup_registrations` | Per-player sign-ups by position. `user_id` nullable (legacy guest rows); new sign-ups require auth. Auto-promotes waitlist on cancel |
| `pickup_series` | Generated lineups per series — `teamAPlayerIds`, `teamBPlayerIds`, `benchPlayerIds`, series win counts |
| `pickup_games` | Per-game scores within a series (best-of-3 or best-of-5) |
| `pickup_player_stats` | Per-user per-session stats by position, written when a series completes |

**Tournament Types:** `pod_2`, `pod_3`, `set_teams`
**Bracket Styles:** `single_elimination`, `double_elimination`
**Skill Levels:** C, B, A, Open
**Pickup Series Formats:** `best_of_3`, `best_of_5`
**Volleyball Positions:** setter, outside_hitter, middle_blocker, opposite, libero, defensive_specialist

---

## Access Control Matrix

| Page | Public | User (authed) | Organizer | Admin |
|---|---|---|---|---|
| Browse / Tournament Detail / Pickup Detail | ✅ | ✅ | ✅ | ✅ |
| Standings / Schedule / Bracket / Pickup Scoreboard | ✅ | ✅ | ✅ | ✅ |
| Register (tournament or pickup) | ✅ (if auth) | ✅ | ✅ | ✅ |
| Pickup Attendance | ❌ | ❌ | ✅ | ✅ |
| Pickup Lineups | ❌ | ❌ | ✅ | ✅ |
| Scorekeeper (tournament or pickup) | ❌ | ❌ | ✅ | ✅ |
| Settings (tournament or pickup) | ❌ | ❌ | ✅ | ✅ |
| Create Tournament / Create Pickup Session | ❌ | ❌ | ✅ (whitelist) | ✅ |
| See test tournaments / test sessions | ❌ | ❌ | ❌ | ✅ |

**Role definitions:**
- **Organizer** — in `organizer_whitelist` (`is_admin = false`). Can create tournaments and pickup sessions.
- **Admin** — in `organizer_whitelist` with `is_admin = true`. Superset of organizer; also sees test tournaments and test pickup sessions. Set via direct SQL update.

**Test entities:** Set `is_test = true` on either a `tournaments` row or a `pickup_sessions` row to hide it from everyone except admins. Defaults to `false`. Both create forms include an admin-only "Test" checkbox (amber-styled, only rendered when `isAdmin=true` is passed as a prop). Server-side: `POST /api/tournaments` and `POST /api/pickup` both ignore `isTest: true` from non-admins. `isAdmin` status is determined by `isAdminUser()` from `src/lib/db/queries.ts`.

> **Nav behavior:** `navigation.tsx` uses `useAuth()` — do not manage auth state independently in this component. Shows a Sign In button when `!isLoading && !user`. "Create Tournament" and "Create Pickup Session" appear in the mobile drawer only for whitelisted organizers (`isWhitelisted = true` from `/api/user/whitelist`). The create pages also enforce whitelist authorization server-side and redirect unauthorized users.

> **Schema migrations:** `db:push` has a known bug with check constraints on this schema. The established pattern is to write a one-off `scripts/*.ts` migration script that executes raw SQL via the existing Drizzle `db` client, then run it with `npx tsx --env-file=.env.local scripts/<name>.ts`. The Supabase MCP server exists but its OAuth flow is unreliable on the Windows dev setup — direct DB access via `DATABASE_URL` is the fallback and works reliably.

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

### ✅ Pickup feature 500ing on prod — RESOLVED
Pickup pages and `/api/pickup` returned 500 after the Phases 1–7 merge. Root cause: two Supabase SQL migrations (`estimated_end_time TEXT` and `is_test BOOLEAN NOT NULL DEFAULT false` on `pickup_sessions`) never ran on prod. `pickup-queries.ts:29` unconditionally filters on `isTest`, so every read threw. Applied via `scripts/apply-pickup-migration.ts` (one-shot tsx script using the existing Drizzle `db` client). Inspection-first: `scripts/inspect-pickup-schema.ts` confirmed the column gaps before any ALTER.

### ✅ Pickup scorekeeper UX — RESOLVED
Pickup scorekeeper was rendered in the default Navigation + Footer layout with small score panels and a redundant team-roster section. Rewrote `/pickup/[slug]/scorekeeper` to mirror the tournament scorekeeper: fullscreen dark (`bg-gradient-to-br from-slate-900 to-slate-800`), no chrome, large tap-to-score panels via the shared `ScoreDisplay` component. Kept `SeriesScoreSummary` for the best-of-N pips/games strip — added `variant="dark"` prop to that component. Removed roster section. "End Game" button now gates on session scoring rules (`canEndGame()` mirrors tournament logic). Orphaned `pickup-score-panel.tsx` deleted.

### ✅ Pickup payment info — RESOLVED
Pickup sessions now carry payment details. Added a nullable `payment_info` JSONB column to `pickup_sessions` (`PickupPaymentInfo` = `{ amountPerPerson: number | null, cash: boolean, venmo: string | null, zelle: string | null }`). Set on the create form (amount-per-person input + cash/venmo/zelle checkboxes; Venmo/Zelle reveal a handle input). `POST /api/pickup` sanitizes the input (`sanitizePaymentInfo`) — clamps amount to a non-negative integer, trims handles, stores null when nothing meaningful is provided. Displayed on the session detail page (`PaymentInfo` component) right after the description: amount as `$N per player` plus a badge per accepted method. Migration: `scripts/apply-payment-info-migration.ts`.

### ✅ Pickup guest sign-up removed — RESOLVED
Guest (unauthenticated) registration is no longer allowed. The register page (`/pickup/[slug]/register`) shows a Google sign-in card instead of the form when not signed in. `POST /api/pickup/[sessionId]/register` returns 401 for unauthenticated requests and always derives `email` from the authenticated account (never the request body). Legacy guest rows and the guest-cancel path in the DELETE handler are left intact.

### 🟡 Hardcoded tournament ID in `/api/registration-status`
Needs to accept a `tournamentId` parameter instead of assuming ID = 1.

### 🟡 Payment step in registration not wired
The multi-step registration form has a payment step but it's not connected to any payment processor.

### 🟡 `.gitignore` overmatches `.env.local.example`
`.env*` matches `.env.local.example` too, so the docs file requires `git add -f` every time it changes. Narrow to `.env*.local` with an explicit `!.env.local.example` exception.

### 🟡 Pickup session settings page not built
`src/app/pickup/[slug]/settings/page.tsx` is linked from session detail but not implemented. See `docs/pickup-games-progress.md` for the original spec.

---

## Animations

framer-motion v12 is used throughout. Follow the existing import pattern: `import { motion, AnimatePresence } from "framer-motion"`.

### Patterns established

- **`ease: "easeOut" as const`** — required in framer-motion variant `transition` objects to satisfy TypeScript's `Easing` type. Always use `as const` on ease strings inside variants.
- **Key-based remount** — `key={score}` on a `motion.div`/`motion.span` triggers re-animation whenever the value changes. Used for score change indicators on schedule and bracket pages.
- **`useReducedMotion()`** — imported from framer-motion; all animated components check this and set `duration: 0` when true.
- **Server/client boundary** — server components cannot use framer-motion directly. Extract animated sections into `"use client"` components that receive serialized data as props (e.g. `TournamentCardGrid`).
- **Canvas sizing** — use `ResizeObserver` on the canvas element (not `window.addEventListener("resize")`) so sizing works correctly when mounted inside `AnimatePresence`.
- **`motion.button` type conflict** — framer-motion's `onDrag` conflicts with React's `DragEventHandler<HTMLButtonElement>`. Use Tailwind `hover:scale-[1.02] active:scale-[0.97]` for button animations instead.

### Score celebration system (scoreboard)

`src/components/celebrations/` — four canvas-based particle animations randomly selected each time a team scores:

| File | Effect |
|---|---|
| `score-celebration.tsx` | Picker — `useState` initializer randomly selects one of the four on mount |
| `shooting-stars-canvas.tsx` (`src/components/`) | Diagonal shooting stars, warm gold `rgb(200,165,70)` |
| `fireworks.tsx` | 4 staggered bursts, 7-color earthy palette, dt-based physics |
| `rising-embers.tsx` | Upward-drifting ember particles with sine-wave drift |
| `sparkle-field.tsx` | 4-armed star sparkles with bloom glow, phase system (growing→peak→fading) |

**Integration** (`score-panel.tsx`): each team container is `relative overflow-hidden`. `AnimatePresence` mounts/unmounts `<ScoreCelebration>` wrapped in a fading `motion.div` (`opacity 0→1→0`, 0.35s transitions). Score change detected via `useRef` comparison in `useEffect`; celebration auto-dismisses after 2800ms via `setTimeout`.

### Divider line glow

Vertical and horizontal divider lines use a CSS `linear-gradient` background (transparent → color → transparent) with an animated `filter: drop-shadow` pulse — this produces a tapered glow that `box-shadow` cannot. Pattern:
```tsx
<motion.div
  style={{ background: "linear-gradient(to bottom, transparent, rgba(74,86,81,0.5) 20%, rgba(74,86,81,0.5) 80%, transparent)" }}
  animate={{ filter: ["drop-shadow(0 0 0px rgba(200,165,70,0))", "drop-shadow(0 0 3px rgba(200,165,70,0.45))", "drop-shadow(0 0 0px rgba(200,165,70,0))"] }}
  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
/>
```

### Other animated components

| Component | Animation |
|---|---|
| `tournament-card-grid.tsx` | Stagger entrance (0.07s), hover lift `y: -4`, tap `scale: 0.98` |
| `navigation.tsx` | Mobile drawer slides in/out with `AnimatePresence`; nav items stagger |
| `reveal-section.tsx` | `whileInView` fade+slide up, `once: true`, respects reduced motion |
| `bracket-team-cards.tsx` | Stagger entrance + hover lift |
| `bracket-display.tsx` | Clock spin (8s), score key-remount, team name `AnimatePresence` reveal |
| `current-game.tsx` | Score change: `scale 1.35→1` + red drop-shadow flash |
| `schedule-table.tsx` | Score change: `scale 1.2→1` + red drop-shadow flash (subtler) |

---

## Scripts

### `scripts/generate-pool-schedule.ts`
Generates a pool play schedule for a tournament and writes it directly to the `pool_matches` table. Used for CLI / one-off generation.

```bash
npx tsx --env-file=.env.local scripts/generate-pool-schedule.ts <slug> [--force]
```

- `<slug>` — tournament slug (e.g. `two-peas-dec-2025`)
- `--force` — delete existing pool matches before generating (required if matches already exist)
- Works for any pod count (6–15+) and all tournament types (`pod_2`, `pod_3`, `set_teams`)
- Pods must already be registered before running this script
- Algorithm: greedy variety-first selection + exhaustive partition scoring; hard "no 3 consecutive games" constraint; minimizes teammate/opponent repeats

**The same algorithm is also exposed via `POST /api/tournaments/[tournamentId]/generate-schedule`**, which the Tournament Settings page uses. Organizer-auth required. Body: `{ targetGames?, minutesPerGame?, force? }`. Returns `{ gamesCreated, podsCount, clearedExisting }` or a descriptive error. A `GET` to that endpoint returns `{ existingCount }` for the current match count.

### `scripts/delete-test-tournaments.sql`
Deletes all `is_test = true` tournaments and their cascade-linked child records.

```bash
# Run via Supabase MCP or paste into Supabase SQL editor
```

### One-off DB scripts (pattern)
When a schema migration or admin operation needs to hit prod, write a script under `scripts/` that uses the existing Drizzle `db` client (`src/lib/db/index.ts`) and execute with `npx tsx --env-file=.env.local scripts/<name>.ts`. See `scripts/apply-migration.ts` as the template.

Conventions established by past one-shot scripts (not all committed — some were deleted after running):
- Inspect first, mutate second. Read schema/columns via `information_schema.columns` before any ALTER.
- Use `IF NOT EXISTS` on additive operations so the script is idempotent.
- For Supabase auth admin tasks (creating users, deleting users), use `@supabase/supabase-js` with `SUPABASE_SERVICE_ROLE_KEY`. Example pattern in past runs: `admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata })`.

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

# Dev-only (do NOT set in prod):
SUPABASE_SERVICE_ROLE_KEY         # Admin scripts only (RLS bypass). From Dashboard → Project Settings → API.
NEXT_PUBLIC_ENABLE_TEST_LOGIN     # "true" reveals email/password form on /auth/signin. Local only.
```

### Webpack Config Note
`next.config.ts` explicitly excludes `drizzle-orm` and `postgres` from the client bundle via `serverExternalPackages`. Do not import these in client components.

---

## Code Standards

- **Components:** Prefer smaller, focused components. Break pages into sections when it makes sense.
- **Linting:** ESLint enforces `no-unused-vars`, `no-explicit-any`, `no-unescaped-entities`. `no-console` is a warning (except `warn`/`error`).
- **Styling:** shadcn/ui components first. TailwindCSS v4 utility classes. `clsx` + `tailwind-merge` for conditional class logic.
- **Theme tokens are mandatory.** Always reach for the CSS custom properties defined in `src/app/globals.css` (`primary`, `accent`, `muted`, `destructive`, `success`, `danger`, `chart-1..5`, `muted-foreground`, `card`, `border`) and the Tailwind utilities that map onto them (`bg-primary`, `text-muted-foreground`, `bg-accent/20`, `text-success`, `text-danger`, etc.). Do not write raw Tailwind palette classes in product code — `text-gray-*`, `text-green-*`, `text-red-*`, `bg-yellow-*`, `bg-blue-*`, `bg-purple-*`, `border-slate-*` are all prohibited. The one deliberate exception is the gold/silver/bronze trophy palette on `bracket-team-cards.tsx` and `bracket-standings.tsx` (`yellow-500` / `slate-400` / `amber-700`), which is preserved because the medal metaphor reads more clearly in those specific colors than in any sage alternative; the 4th-place slot, which is not on the podium, uses `muted`. If a new use case feels like it needs a palette color, the answer is either (a) introduce a new semantic token in `globals.css` with a clear meaning (and WCAG-validate its contrast against `--background` and `--card` in both light and dark mode — see the `--success` / `--danger` definitions as the reference pattern), or (b) use an existing token. Never inline a palette class.
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

- **TODO: Playwright E2E — "Run a Tournament" test** — parameterized by test tournament slug. Flow: (1) hit the Settings page → Generate Schedule → verify games appear on the Schedule page; (2) open the Scorekeeper and simulate completing every pool play game one by one; (3) after each game, verify the Standings page reflects correct W/L/point differential. Should use a dedicated `is_test = true` tournament so it can be reset between runs.
- **TODO: Pickup E2E flow test** — sister to the tournament test. Cover signup-by-position → attendance → lineup generation → scorekeeper → stats write.
- **TODO: Pickup session Settings page** — `src/app/pickup/[slug]/settings/page.tsx` is linked but not built.
- **TODO: Auto-generate pool play schedule on tournament creation** — the schedule generator is now available via `POST /api/tournaments/[tournamentId]/generate-schedule` (UI in Settings). Could trigger automatically on creation or when registration closes.
- User profiles with tournament history (pickup stats already wired in Phase 7)
- Email notifications / announcements pipeline (Resend partially wired)
- Payment integration for registration
- Automated schedule generation from CSV upload
- Admin UI for organizer/admin whitelist management (currently managed via direct SQL)
- SPR rating system (like Scoreholio)
- "Power up" tournament mode (experimental idea)
- Tournament templates (duplicate structure)
