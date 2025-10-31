# Task: Initial Project Setup

**Objective:** To create a page that acts as a volleyball score keeper. It'll be easy to read, and easy to update. It'll mimic what would be an analog scorekeeper. It'll always correspond to the current match being played. Since there is only one court it can just be the match that is happening. When the score changes it will send the updated score to the database for that match. There will be buttons for starting the match and ending the match which will trigger the next game in the queue to be connected. Once completed it'll also make the score keeper read 0. 

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

This plan outlines the sequential steps to impliment the scorekeeper.

### Step 1: Research

- **Action:** Look into how the app Scoreholio does things for cornhole. This serves as a great example of what I'm looking for. Their schedule/games section is excellent for cornhole
- **Notes:**
  - Scoreholio is a mobile app, but there should be screenshots, or information that exists on their, or other websites. It's a popular application.

### Step 2: Create the score keeping page.

- **Action:** Create a reusable scorekeeping component.
  - reusable as the page will have two. one for each team
  - it'll will connect with the game id, and team a or team b. 
  - tap up on the top half of the score keeper to increment the score
  - tap down on the top half of the score keeper to decrement the score
  - optimize for tablet landscape mode as this will be displayed on a tablet
  - button for start game which turns database from pending to in progress
  - button for submitting the score at the end which resets the scores and queues up the next game.
  - updates the database any time the score is changed

- **Action:** Optimize visuals
    - should look clean and detect tablet touch effects

- **Action:** Create the buttons
    - Start match only appears before the game has officially started. Pending, but next in line. 
        -note. game ids for pool play start at 14 and end at 19.
    - Start match disappears when game starts
    - End match only appears when one team reaches 21 and is winning by 2. if they are not winning by two wait until someone is or hits the score cap (25)

### Step 3: Scoring Page

- **Action:** Create a basic minimalistic layout for scoring page
- **Outcome:**
  - Should have all scoring page elements
    -no header or footer
    -only navigation would be a small non obtrusive back arrow in the top left of the screen

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

## Answer to questions
 - You make a good point. but I'm just looking in the database at what the database says. for example the first match is:
 {"idx":0,"id":14,"round_number":1,"team_a_pods":"[4,5,6]","team_b_pods":"[7,8,9]","team_a_score":0,"team_b_score":0,"status":"in_progress","created_at":"2025-10-30 13:25:18.449978","updated_at":"2025-10-30 13:44:37.197","game_number":1,"scheduled_time":"10:00 AM","court_number":1,"sitting_pods":"[1,2,3]"}

 that has an idx:0? and an id:14. But when I look at the rows, I don't even see what an idx is. so I'm not sure if that is accessible. then again. it's working in other places. so I don't know.

 - No authentication for now. this is technically a security risk that will need addressed in the future, but we know everyone that will be in this tournament. 
 - Great catch on the standings update logic
 - I love the idea of using apis. this sounds more "nextjs" like.
 - scorekeeper is way better than scoring. I should have thought of that. feel free to update the route on the navigation as well for that
 - as a last note ensure that you are looking up scoreholios cornhole scoring setup. the visuals are pretty much exactly what I'm looking for. we use this app regularly and I can assure you it works great.