# Tournament Structure

## Overview

This is a **Draw 2's Bonney and Clyde Volleyball Tournament** featuring 18 players organized into 9 pods of 2 players each. The tournament consists of two phases: Pool Play (4 rounds) and Bracket Play (double elimination).

---

## Tournament Participants

- **Total Players:** 18
- **Total Pods:** 9 pods of 2 players each
- **Pod Composition:** Each pod consists of 2 players who register together
- **Pod Naming:** Pod names are simply both players' names (e.g., "John & Sarah")

---

## Phase 1: Pool Play (4 Rounds)

### Match Format

- **Game Type:** 6v6 volleyball
- **Scoring:** Rally scoring to 25 points
- **Court:** Single court
- **Active Pods per Round:** 6 pods (3 vs 3)
- **Resting Pods per Round:** 3 pods

### Pod Assignments

- Each round, pods are assigned to create two sides of 6 players (3 pods each)
- 3 pods sit out each round to rest
- Assignments change each round to maximize variety and ensure:
  - Every player gets equal game time
  - No more than 1 game of rest between matches
  - Different pod combinations for variety and fun

**Note:** For the initial version, pod assignments will be done manually. Future versions may implement an algorithm to optimize pairings.

### Statistics Tracked

For each pod, track:

- **Wins (W)**
- **Losses (L)**
- **Points For (PF):** Total points scored by their side
- **Points Against (PA):** Total points scored by opposing side

### Seeding

After 4 rounds of pool play:

- Rank all 9 pods by **Point Differential** (PF - PA)
- Seeds 1-9 are assigned based on rankings

---

## Phase 2: Bracket Play (Double Elimination)

### Team Formation

After pool play, the 9 pods are split into thirds and combined into 3 balanced teams:

**Seed Groups:**

- Top Third: Seeds 1, 2, 3
- Middle Third: Seeds 4, 5, 6
- Bottom Third: Seeds 7, 8, 9

**Team Composition (6 players each):**

- **Team A:** Seed 1 + Seed 5 + Seed 9 (top + middle-middle + bottom)
- **Team B:** Seed 2 + Seed 6 + Seed 7 (second + middle-bottom + bottom-top)
- **Team C:** Seed 3 + Seed 4 + Seed 8 (third + top-middle + middle-bottom)

### Bracket Structure (3-Team Double Elimination)

**Game 1 (Initial Match):**

- Team B vs Team C

**Game 2 (Winner's Bracket):**

- Team A vs Winner of Game 1

**Game 3 (Loser's Bracket Round 1):**

- Loser of Game 1 vs Loser of Game 2

**Game 4 (Championship - First Chance):**

- Winner of Game 2 vs Winner of Game 3

**Game 5 (Championship - If Necessary):**

- Only played if the Loser's Bracket champion (Winner of Game 3) defeats the Winner's Bracket champion in Game 4
- This ensures every team must lose twice to be eliminated

### Tournament Winner

- The winner is the team with only one loss (or zero losses)
- Must beat every opponent twice to eliminate them (double elimination principle)

---

## Scorekeeping

### Access Control

- **Admin-only access** to the scorekeeper page to prevent tampering
- Public access to view live scores and standings

### Tournament Setup

- **Tablet:** Admin logs in and uses scorekeeper interface to input scores in real-time
- **TV/Laptop:** Displays live tournament standings, current match, and upcoming matches
- Updates happen in real-time via Supabase subscriptions

### Scoring Format

- Rally scoring to 25 points
- Scores update live as points are entered
- Both pool play and bracket play use the same scoring system

---

## Application Scope

This application is designed as a **single-tournament solution** (alpha/beta test):

- Built for one specific tournament
- Focus on core functionality for this weekend's deployment
- Future iterations may support:
  - Multiple tournaments
  - Multiple courts (currently 1 court)
  - User roles beyond team captain
  - Automated pod assignment algorithms
  - Additional tournament formats
