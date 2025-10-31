# Task: Initial Project Setup

**Objective:** To create the logic and display of the schedule page. This will have a notes section below the schedule. There should be features for full screen display. it should include just pool play. it will be current game. upcoming pods, and full schedule. schedule will include game number, time, team A pods, team B pods. and sitting pods. The Current game section will have the teams playing on each court, the accurate current updating score (with a subscription). Upcoming pods will NOT be sorted into teams. it will only be the list of the pods playing next one what court. 

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

- **Action:** Look into how the app Scoreholio does things for cornhole. This serves as a great example of what I'm looking for. Their schedule/games section is excellent for cornhole
- **Notes:**
  - Scoreholio is a mobile app, but there should be screenshots, or information that exists on their, or other websites. It's a popular application.

### Step 2: Create a schedule components.

- **Action:** Create a reusable game component
  - This game is a current game that is subscribed to the database for it's game id and displays the current score without needing to refresh. 
  - It should take in a game id and a court. In our tournament there will only be one court, but this can be expanded upon later.

- **Action:** Create a filterable schedule component
    - A table that can be filtered by team name or court. this allows players to easily know when they play or sit and where
    - takes some sort of data from a json maybe for now. I have included @Two Peas Nov'25 Tournament Schedule - Sheet1 as our current schedule

- **Action:** Create a filterable schedule component
    - A table that can be filtered by team name or court. this allows players to easily know when they play or sit and where
    - takes some sort of data from a json maybe for now. I have included @Two Peas Nov'25 Tournament Schedule - Sheet1 as our current schedule

- **Action:** Create a next up component
    - A list of upcoming teams from the schedules next game id for ALL courts. randomize these teams so you can't guess who you're playing with. 
    - For as many teams are playing on as many courts show those teams in the list.

### Step 3: Schedule page

- **Action:** Create a basic layout that follows design principles from the home page.
- **Outcome:**
  - Should have all schedule page elements
    -Small hero/header section announcing the page
    -current game, full schedule, next up
    -has navigation and footer

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
- Test linting and build

## Answer to what's missing or needs clarification
-game limits will be configurable in the future. for now it's just 21 since I'm not building a dashboard or admin rights for this yet. 
-poolmatches table will need to be updated. I don't think the database needs the schedule for now. in the future when there is a dashboard, we can either set a manual schedule or create an algorithm to make one our selves. but for now, that's an unnecessary feature since we created the schedule in the spreadsheet. 
-ah, full screen mode we can do later. once I have tweaked our overall look.
-good point on the notes section. that should be added to the schedule page and won't need it's own component for now
-I'd like you to do that scoreholio research now, before finishing the implementation plan. or use it to modify after reading this.
-we're not doing bracket play yet. That'll be it's own page and feature. we just documwented it in the csv for future reference
-I leave the realtime implementation details to you. I'm not familiar enough to make an accurate choice. For the schedule let's see what we can do with team names. if we need to adjust later that's fine.