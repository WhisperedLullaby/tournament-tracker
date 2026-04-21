# Pickup Games Feature — Progress Document

> Use this doc to resume work in a new session. It captures what's done, what's next, and known issues.

---

## What Is This Feature?

Pickup Games is a new section of the Tournament Tracker platform (`/pickup`) that allows organizers to host informal volleyball pickup sessions. Players sign up by position (setter, outside hitter, etc.), the system auto-generates balanced lineups before each best-of-3 series (replacing the physical "count off in a circle"), and tracks per-player stats by position on their profile.

---

## Key Decisions (locked in)

| Decision | Choice |
|---|---|
| Who can create sessions | Whitelisted organizers only (same `organizer_whitelist` table) |
| Lineup rotation | Full reshuffle every series — all players reshuffled, not challenge court |
| Auth requirement | Guest sign-up allowed (name + email only); Google auth optional, no profile stats for guests |
| Scoring | Rally scoring to 25, win-by-2, point cap — configurable per session via `scoringRules` JSON |

---

## Completed Phases

### Phase 1 — Schema + Core API ✅
**DB tables added (requires SQL migration — already run):**
- `pickup_sessions` — slug, title, date, startTime, estimatedEndTime, location, positionLimits (JSON), scoringRules (JSON), seriesFormat, status, totalCapacity
- `pickup_registrations` — userId (nullable for guests), email, displayName, position, status, waitlistPosition
- `pickup_series` — teamAPlayerIds, teamBPlayerIds, benchPlayerIds, seriesWins
- `pickup_games` — per-game scores within a series
- `pickup_player_stats` — per-user per-session stats by position

**API routes created:**
- `POST/GET /api/pickup` — create (whitelist-gated) + list
- `PATCH/DELETE /api/pickup/[sessionId]` — organizer update/delete
- `POST/DELETE /api/pickup/[sessionId]/register` — sign up with waitlist logic; cancellation auto-promotes waitlist
- `GET /api/pickup/[sessionId]/registrations` — list grouped by position
- `PATCH /api/pickup/[sessionId]/registrations/[regId]` — organizer promote/mark
- `POST /api/pickup/[sessionId]/attendance` — batch mark attended/no_show, auto-promotes waitlist
- `GET /api/pickup/[sessionId]/scoreboard` — live data stub (wired fully in Phase 6)

**Query library:** `src/lib/db/pickup-queries.ts`

### Phase 5 — Scorekeeping ✅
**Files created:**
- `src/lib/pickup/stats-writer.ts` — upserts `pickup_player_stats` after series completion; accumulates wins/losses/points per player per session
- `src/app/api/pickup/[sessionId]/series/[seriesId]/games/route.ts` — GET: list all games for a series
- `src/app/api/pickup/[sessionId]/series/[seriesId]/games/[gameId]/score/route.ts` — PATCH: update game score (side + delta); auto-transitions game to `in_progress`
- `src/app/api/pickup/[sessionId]/series/[seriesId]/games/[gameId]/complete/route.ts` — POST: end game, increment series wins, advance next game or complete series + write stats
- `src/app/api/pickup/[sessionId]/series/[seriesId]/complete/route.ts` — POST: manually end series early; accepts optional `{ winningSide }` override; writes stats
- `src/components/pickup/pickup-score-panel.tsx` — Scoreholio-style tap-top/tap-bottom score panel
- `src/components/pickup/series-score-summary.tsx` — win pips + completed game scores
- `src/app/pickup/[slug]/scorekeeper/page.tsx` — organizer-only; polls 5s; shows active game panels, series summary, player lists; "End Game" and "End Series" buttons

**Queries added to `pickup-queries.ts`:** `getPickupGamesForSeries`

---

### Phase 4 — Lineup Generation ✅
**Files created:**
- `src/lib/pickup/lineup-generator.ts` — Fisher-Yates shuffle per position, alternating team assignment, bench overflow balancing. Seeded RNG (sessionId × 1000 + seriesNumber) for reproducibility.
- `src/app/api/pickup/[sessionId]/series/route.ts` — GET: list all series for a session (desc order)
- `src/app/api/pickup/[sessionId]/series/generate/route.ts` — POST: organizer-gated; gets attendees, generates lineup, inserts `pickup_series` + pre-created `pickup_games` rows, increments `currentSeriesNumber`, transitions session to `active`
- `src/app/api/pickup/[sessionId]/series/[seriesId]/start/route.ts` — POST: transitions series `pending → in_progress`, redirects caller to scorekeeper
- `src/components/pickup/series-lineup-card.tsx` — Team A / Team B player lists with position labels; bench badge list; winner highlighting for completed series
- `src/app/pickup/[slug]/lineups/page.tsx` — organizer-only page; Generate New Series button; Start Series button (when current series is pending); full history list of past series

**Queries added to `pickup-queries.ts`:** `getPickupSeriesForSession`, `getPickupSeriesById`

---

### Phase 3 — Attendance & Waitlist Management ✅
**Files created:**
- `src/app/pickup/[slug]/attendance/page.tsx` — organizer-only page; non-organizers are redirected to session detail. Fetches registrations on mount, renders checklist with loading skeleton.
- `src/components/pickup/attendance-checklist.tsx` — tap-to-toggle per player: confirmed players toggle between `attended`/`no-show`; waitlisted players shown read-only with promotion note. Submit calls `POST /api/pickup/[sessionId]/attendance` then redirects to `/lineups`.

**Session detail page updated:** "Take Attendance" button added for organizers when session status is `upcoming` or `attendance`.

The API (`POST /api/pickup/[sessionId]/attendance`) was already built in Phase 1 — this phase was UI only. Session status transitions `upcoming → attendance` on first submission.

---

### Phase 2 — Session Pages + Registration UI ✅
**New files:**
- `src/contexts/pickup-context.tsx` — `PickupProvider` + `usePickup()` hook
- `src/lib/pickup/positions.ts` — position labels, ordering, default limits
- `src/app/pickup/[slug]/layout.tsx` — server layout wrapping PickupProvider
- `src/app/pickup/page.tsx` — listing page with status tabs
- `src/app/pickup/create/page.tsx` — whitelist-gated create page
- `src/app/pickup/[slug]/page.tsx` — session detail with roster
- `src/app/pickup/[slug]/register/page.tsx` — position selector + sign-up form
- `src/components/pickup/pickup-creation-form.tsx` — full creation form
- `src/components/pickup/position-roster.tsx` — roster grouped by position
- `src/components/pickup/position-selector.tsx` — card-style position picker
- `src/components/pickup/pickup-card.tsx` — animated listing card

**Navigation updated:** "Pickup" link in base nav; pickup sub-nav (Session / Scoreboard / Lineups) when on `/pickup/[slug]/*`; "Create Pickup Session" in mobile drawer for organizers.

---

## Pending Phases

### ~~Phase 5 — Scorekeeping~~ ✅ Done
**Goal:** Per-game scoring within a series; series completion writes stats.

Files to create:
- `src/app/pickup/[slug]/scorekeeper/page.tsx` — game-by-game +/- scoring, end-game/end-series buttons
- `src/components/pickup/pickup-score-panel.tsx` — score +/- UI (mirrors `score-display.tsx`)
- `src/components/pickup/series-score-summary.tsx` — game 1/2/3 result display
- `src/lib/pickup/stats-writer.ts` — atomic stats update on series completion

**API routes needed:**
- `PATCH /api/pickup/[sessionId]/series/[seriesId]/games/[gameId]/score`
- `POST /api/pickup/[sessionId]/series/[seriesId]/games/[gameId]/complete`
- `POST /api/pickup/[sessionId]/series/[seriesId]/complete` — calls `stats-writer.ts`

**Stats write logic** (`src/lib/pickup/stats-writer.ts`):
1. Determine winner (teamASeriesWins vs teamBSeriesWins)
2. Sum all `pickup_games` scores for the series
3. Upsert `pickup_player_stats` for each player: +seriesWin/Loss, +pointsFor/Against
4. Position sourced from `pickup_registrations.position`

### ~~Phase 6 — Live Scoreboard~~ ✅ Done
**Goal:** Public real-time view during active session.

**Files created:**
- `src/app/pickup/[slug]/scoreboard/page.tsx` — server component fetches initial data via DB queries, passes to client
- `src/components/pickup/pickup-scoreboard-client.tsx` — Supabase Realtime subscription on `pickup_games` + `pickup_series`; score celebration animations; player lists; series win pips

**DB step required (run in Supabase SQL Editor):**
```sql
ALTER PUBLICATION supabase_realtime ADD TABLE pickup_games, pickup_series;
```
No `REPLICA IDENTITY FULL` needed (scoreboard uses unfiltered table subscriptions).

### Phase 7 — Stats + Profile Integration ✅
**Goal:** Pickup stats visible on player profiles.

New query: `getUserPickupStats(userId)` in `src/lib/db/queries.ts` (or `pickup-queries.ts`)
- Joins `pickup_player_stats` → `pickup_sessions`
- Returns per-session records + aggregates (sessions, W/L, win %, primary position)

`GET /api/user/pickup-stats` — endpoint for profile page

Updates to `src/app/profile/page.tsx`:
- `PickupStatsBanner` — 4-tile grid: Sessions Played, Series Wins, Series Losses, Win %
- `PickupSessionCard` — title, date, position played, W-L record
- New "Pickup Game History" section below tournament history

---

## Known Issues / Future Work

All original known issues resolved.
| DB migration: `estimated_end_time` column | Needs running | Added to schema after initial migration. Run: `ALTER TABLE pickup_sessions ADD COLUMN estimated_end_time TEXT;` |

---

## DB Migrations Needed (run in Supabase SQL Editor)

```sql
-- Phase 2 addition
ALTER TABLE pickup_sessions ADD COLUMN estimated_end_time TEXT;

-- Known issues fix: is_test flag
ALTER TABLE pickup_sessions ADD COLUMN is_test BOOLEAN DEFAULT false NOT NULL;
```

---

## File Map (all pickup-related files)

```
src/
  lib/
    db/
      schema.ts                          — pickup tables + enums (pickup_sessions, etc.)
      pickup-queries.ts                  — all pickup DB query functions
    pickup/
      positions.ts                       — position labels, ordering, defaults
      lineup-generator.ts                — ✅ Phase 4
      stats-writer.ts                    — TODO Phase 5
  contexts/
    pickup-context.tsx                   — PickupProvider + usePickup()
  components/
    pickup/
      pickup-card.tsx                    — listing card
      pickup-creation-form.tsx           — session creation form
      position-roster.tsx                — roster grouped by position
      position-selector.tsx              — registration position picker
      attendance-checklist.tsx           — ✅ Phase 3
      series-lineup-card.tsx             — ✅ Phase 4
      pickup-score-panel.tsx             — TODO Phase 5
      series-score-summary.tsx           — TODO Phase 5
      pickup-scoreboard-client.tsx       — ✅ Phase 6
  app/
    pickup/
      page.tsx                           — session listing
      create/page.tsx                    — create session (whitelist-gated)
      [slug]/
        layout.tsx                       — fetches session, wraps PickupProvider
        page.tsx                         — session detail + roster
        register/page.tsx                — sign-up form
        attendance/page.tsx              — ✅ Phase 3
        lineups/page.tsx                 — ✅ Phase 4
        scorekeeper/page.tsx             — TODO Phase 5
        scoreboard/page.tsx              — ✅ Phase 6
        settings/page.tsx                — TODO (linked but not built)
    api/
      pickup/
        route.ts                         — POST (create) + GET (list)
        [sessionId]/
          route.ts                       — PATCH + DELETE
          register/route.ts              — POST (sign up) + DELETE (cancel)
          registrations/
            route.ts                     — GET (list)
            [regId]/route.ts             — PATCH (organizer update)
          attendance/route.ts            — POST (batch mark)
          scoreboard/route.ts            — GET (live data)
          series/
            route.ts                     — ✅ Phase 4 (GET list)
            generate/route.ts            — ✅ Phase 4
            [seriesId]/
              start/route.ts             — ✅ Phase 4
              complete/route.ts          — TODO Phase 5
              games/
                [gameId]/
                  score/route.ts         — TODO Phase 5
                  complete/route.ts      — TODO Phase 5
      user/
        pickup-stats/route.ts            — ✅ Phase 7
```
