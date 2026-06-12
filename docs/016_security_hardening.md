# 016 — Security Hardening & Correctness

**Objective:** A fresh-eyes review surfaced one critical, verified security hole plus a cluster of related auth and correctness issues. This document records what was found and how it was fixed. Delivered as four commits on one PR.

---

## Background — what was wrong

A read-only inspection of the production database found:

- **RLS disabled on 12 of 13 tables** (only `pool_matches` had it).
- **The `anon` role held full `INSERT/UPDATE/DELETE/TRUNCATE/SELECT` on every table.**

The browser ships the public `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and several client components query Supabase's PostgREST API directly. With RLS off and full grants, anyone could take that key from the page source and, with a single request:

- Insert themselves into `organizer_whitelist` with `is_admin = true` (full privilege escalation).
- Read every captain's email from `pods` / `pickup_registrations` (PII leak — the scorekeeper page already shipped `select("*")` on `pods`).
- Edit or delete any tournament, score, or registration; truncate tables.

Separately, the older tournament scoring/bracket API had **no authentication**, the pickup cancel endpoint let a stranger cancel any player's spot by email, and there were correctness bugs (a name-splitter, a stale module cache, missing transactions).

The fix is safe because server-side Drizzle uses the `postgres` role over `DATABASE_URL`, which **bypasses RLS** — so constraining the anon/PostgREST path breaks no server route or page.

---

## 1. Database lockdown (RLS + grants)

Migration: `scripts/apply-rls-lockdown.ts` (idempotent, inspect-first). **Applied to prod.**

- Enabled RLS on all 13 tables.
- Added public `SELECT` policies **only** on the tables the browser reads or subscribes to: `pool_matches`, `bracket_matches`, `bracket_teams`, `pods` (PostgREST reads) and `pickup_games`, `pickup_series` (Realtime subscriptions). Every other table is deny-all through the API.
- Revoked all `anon`/`authenticated` write grants.
- Exposed `pods` via a **column-level** `SELECT` grant that excludes `email` and `user_id`. The scorekeeper's `pods` query was narrowed to `id, name, team_name`.

**Verification:** anon-key probes against prod — reads return 200; `SELECT email FROM pods`, `SELECT * FROM organizer_whitelist`, an admin `INSERT`, and a score `UPDATE` all return 401.

**Invariant going forward:** never add a browser-side Supabase write, and never `select("*")` from `pods` in client code.

## 2. Authenticate the scoring/bracket API

Reusable guards in `src/lib/auth/api-auth.ts`:

- `requireUser()` — any signed-in user. Applied to the six scoring routes (`games/start`, `games/[id]/score`, `games/[id]/complete`, and the `bracket/games/*` equivalents). **Scorekeeping is intentionally open to volunteers/players, not just organizers** — this supports a planned mode where larger tournaments are scored by participants.
- `requireOrganizer(tournamentId)` — organizer role. Applied to the destructive `bracket/initialize` and `bracket/reset`.

The tournament Scorekeeper page now gates on a signed-in user (a sign-in prompt for anonymous visitors), not on `isOrganizer`. Request bodies are validated with zod (`src/lib/validation/api.ts`, `parseBody`).

## 3. Correctness fixes

- **Name splitter** (`src/lib/utils/name-adapter.ts`): the combined-name regex `/\s*(?:&|and)\s*/i` split on the internal letters of any name containing "and" ("Brandon" → "Br & on"). Fixed to `/\s+and\s+|\s*&\s*/i`; the singleton class collapsed into plain functions.
- **Stale pod-number cache:** removed the module-level `PodIdAdapter`, which never invalidated and served stale pod numbering on warm serverless instances. `getAllPods` already sorts by id, so the array index is the pod number.
- **Atomic game completion:** completion flips `in_progress → completed` with a conditional `UPDATE ... WHERE status = 'in_progress' RETURNING`, and only the request that wins advances standings / the bracket. Prevents double-tap double-counting.
- **Transactions:** `updatePoolStandings` (now an upsert), `advanceBracketTeams`, and pickup registration / waitlist promotion run inside `db.transaction(...)`. Registration also takes a session-row lock so the "last spot" check can't race.
- **Pickup cancel auth hole:** the DELETE handler required no auth and matched any registration by email. Now requires authentication and only cancels the caller's own row.
- **Role endpoint:** stopped trusting a client-supplied `?userId`; identity is always derived from the session.

## 4. Schema, robustness & docs

Migration: `scripts/apply-schema-constraints.ts` (inspect-first, idempotent). **Applied to prod.**

- Unique constraints: `pool_standings (tournament_id, pod_id)` (required by the standings upsert), `bracket_matches (tournament_id, game_number)` (advancement addresses matches by this — a duplicate would corrupt the bracket), `tournament_roles (tournament_id, user_id, role)`.
- Indexes on FK / filter columns across pods, pool_matches, tournament_roles, and the pickup tables.
- Capped the postgres connection pool (`max: 1`, `idle_timeout: 20`) in `src/lib/db/index.ts`.
- zod request-body validation; mutation-path errors now propagate (and roll back) instead of being swallowed.
- Doc/comment cleanup, plus the CLAUDE.md updates that accompany this work.

---

## Verification summary

- `npm run build`, typecheck, and lint all pass (only pre-existing warnings remain).
- DB inspection + live anon-key probes confirm the lockdown posture.
- The standings `ON CONFLICT` upsert was exercised against the live constraint inside a rolled-back transaction.
- **Not** runtime-tested: the API 401/403 responses (need a deploy or running server). The guards follow the existing `generate-schedule` / pickup auth pattern.

## Notes / follow-ups

- Both DB migrations were applied to production ahead of the code merge; the lockdown is backward-compatible with the previously-deployed code, so there is no window where deployed code outruns the schema.
- Out of scope (separate effort): the Playwright E2E specs listed in CLAUDE.md's backlog.
- Still open: the `.gitignore` `.env*` over-match papercut (narrow to `.env*.local` with a `!.env.local.example` exception).
