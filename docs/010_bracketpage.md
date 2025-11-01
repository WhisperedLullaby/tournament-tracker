# Task: Initial Project Setup

**Objective:** To create pages that will serve as companions to the schedule and standings pages for bracket play. Once all matches are complete a tab bar will appear on both pages that will say "pool" and "bracket" allowing you to switch between easily without needing to change routes or load. Tournament/bracket play is double elimination. Teams are created by automatically pairing pods based on the standings. Each team is made from 3 pods depending on where they placed at the end of pool play. The first seeded team is comprised of places 1, 5, 9. Second seed is 2, 6, 7. Third seed is 3, 4, 8. The bracket schedule can be found in the csv in the documents page. Standings page will have it's second tab being the bracket. The schedule page second tab will be a list of upcoming games. bracket will be automatically populated and maintained by the scorekeeper page.

---

## 1. Core Technologies

- **Framework:** Next.js 15.3 (App Router)
- **Language:** TypeScript (Strict Mode)
- **UI:** Tailwind CSS with shadcn/ui
- **Linting & Formatting:** ESLint & Prettier
- **Database:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM
- **Authentication:** Supabase Auth

## 2. Implementation Plan

This plan outlines the sequential steps to impliment bracket play.

### Step 1: Research

- **Action:** Look into how the app Scoreholio does things for cornhole. This serves as a great example of what I'm looking for. Their schedule/games section is excellent for cornhole
- **Notes:**
  - Scoreholio is a mobile app, but there should be screenshots, or information that exists on their, or other websites. It's a popular application.

### Step 2: Create the bracket.

- **Action:** Create a bracket.
  - should be made from html and css. and follow the feel and vibe and color scheme of the website.
  - predetermined matches filled in preemptively by pod numbers. readable. rest of games filled out automatically.
  - Team Members listed below bracket. in 3 cards arranged horizontally.
  - bracket should also have scores on them. it's a really nice visual that will be helpful when more matches exist in future tournaments.  
  - Any other good features. sorry I'm drawing a blank.

- **Action:** Connect to database. 
    - Display score and match results live

- **Action: ** Connect scoretracker
    - After pool play is complete, score keeper should now be connected to bracket play matches.
    - Will set games in motion, track score, and end the match, signaling the next game in sequence

### Step 3: Scoring Page and Schedule Page enhancements

- **Action:** Update existing pages with bracket elements
    - create the tabbed interface that only appears after pool play
    - create the tabs
    - add bracket play elements 
- **Outcome:**
  - Should have all bracket page elements and tabs

## 3. Acceptance Criteria

- No linting or style errors
- uses shadcn components
- All extra dependencies are added to `package.json`.
- The application can be started successfully with `npm run dev`.
- As many elements as possible will use shadcnui components and follow best tailwind practices.
- Test linting and build
- Keep files smaller, preferring to break into components when it makes sense.
- Employ software development design patterns where necessary/it makes sense.(eg. creational, structural, behavioral)

#Implementation Notes
- game 1 should be: team 2 vs team 3 (giving first place a bye).
- game 2: team 1 vs winner g1
- game 3: loser g1 vs loser g2
- game 4: winner g3 vs winner game 2
- game 5 : if necessary: if winner of game 2 loses, they need to play again to determine champion.
- I would love it if this could happen automatically. the goal is to have as little human interaction as possible for now. that allows the organizer to also play, and let the app do the heavy lifting.
- pool games should have an id. the end game can see if it's the last game in the pool play list. 
- For inclusivity let's just try team A, B, C. Let's go by their pod ids. I've translated it in the queries page since the ids in the database don't match pod 1, pod 2 etc. 
- 