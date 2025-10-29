# Task: Initial Project Setup

**Objective:** To create the logic and display of the standings page that will also serve as a place to see standings, the game log (to be implemented), and determine standings by the point differential.

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

This plan outlines the sequential steps to set up the project from scratch.

### Step 1: Research

- **Action:** Look into how the app Scoreholio does things. This serves as a great example of what I'm looking for.
- **Notes:**
  - Scoreholio is a mobile app, but there should be screenshots, or information that exists on their, or other websites. It's a popular application.

### Step 2: Create a reusable, sortable table.

- **Action:** Create a table that is resusable for different sections.
  - Table should be able to handle data that is games played wins, losses, points for, points against and calculate point differential.
  - Look to make this as abstract as possible, this table could potentially be reused for thinks that aren't standings in other parts of the app.

### Step 3: Standings page

- **Action:** Create a basic layout that follows design principles from the home page.
- **Outcome:**
  - Should have all standings page elements
    -Small hero/header section announcing the page
    -sortable table with all teams in the tournament
      -games played, wins, losses, points for, points against
    -Game log which is a list of the previously played games and their scores.

### Step 4: Connect to Database

- **Action:** Ensure everything we need is in the database and can connect to our standings page
- **notes:**
  - Here's how the app will work:
   - users create their teams up to 9 teams. those teams are displayed on the standings page. the schedule page (implemented later) will show the current game and score of current game as well as the teams that are involved, and the upcoming teams to play. The scoring page will update the score for the active game and the database will collect those points/score. The schedule page will be able to display that score in real time. at the end of the match the player will select submit score and this will finalize the score for that game. the standings page will now be able to display the win, loss, points for, points against. point differential and game log. 
   - the currect database schema will determine the correct relationship for these.

## 3. Acceptance Criteria

- No linting or style errors
- uses shadcn components
- All extra dependencies are added to `package.json`.
- The application can be started successfully with `npm run dev`.
- As many elements as possible will use shadcnui components and follow best tailwind practices.