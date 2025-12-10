# Task: Initial Project Setup

**Objective:** The two peas pod tournament will not be the only tournament offered. Many different types of tournaments will be able to be created. For tournament creation, the organizer will be able to set options. Set Teams. This is bringing a set team to compete. Maximum of 9 players per team. 2 Pod (current). 3 Pod (same as two peas but two teammates). Each Tournament will provide Level: C, B, A, Open. Each Tournament will provide an additional multi line input for description. For example, the current is a Reverse Coed Format. And it gives information on the reverse coed information. I'd like this to be able to configured or maybe just typed in by a tournament organizer. Prize information as well. that can be a separate line and data base entry. Single/Double Elimination bracket. Pod based bracket play vs "normal" set teams bracket play based on record and then score differential. Also, start points and end points are important. Some organizers want scores to start at 0 and end at 21. others like start at 4 end at 25. some like game 3s in bracket play to play to 15. others like 25. this needs to be tied into the logic. Also. For now tournament organizers will need to provide a csv to me for schedule. I will change this in the future. This is a big undertaking so feel free to edit this document to give a more specific set of instructions.

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

- **Action:** Look into how the app Scoreholio does things for cornhole. This serves as a great example of what I'm looking for. They have multiple tournament types that a tournament director can choose.
- **Notes:**
  - Scoreholio is a mobile app, but there should be screenshots, or information that exists on their, or other websites. It's a popular application.

### Step 2: Update the Schema

- **Action:** Back End work
  - multiple tournament types
  - tournament information
  - rules
  - prizes
  - additional information
  - unused theme. might as well. we aren't going to use it but might as well put it in there since this is a similar update
  - Put our current information in the database as though an organizer created it so we can display the tournament EXACTLY as it is now. this will be a great demonstration of seemlessly applying the database

### Step 3: Update Tournament Logic

### Step 4: Front End Work

- **Action:** Connect to database. 
    - Make the tournament get this information and display it.
    - Shouldn't be able to differentiate before this work and after it

- **Action:** Connect scoretracker
    - Ensure scoring logic is connected

- **Action:** Update teams page, schedule, tournament, etc.
    - Ensure that the tournament is displaying the information in the way that the organizer setup

## 3. Acceptance Criteria

- No linting or style errors
- uses shadcn components
- All extra dependencies are added to `package.json`.
- The application can be started successfully with `npm run dev`.
- As many elements as possible will use shadcnui components and follow best tailwind practices.
- Test linting and build
- Keep files smaller, preferring to break into components when it makes sense.
- Employ software development design patterns where necessary/it makes sense.(eg. creational, structural, behavioral)
- Ensure that different tournament types and setups all run smoothly

**Post-Launch Features:**
- User profiles with tournament history
- Tournament search and filters
- Custom tournament branding/themes
- Tournament analytics and stats
- Email notifications for tournament updates
- Social media sharing
- Tournament chat/announcements
- Mobile app
- Tournament templates
- Recurring tournaments
- Multiple tournament formats (4v4, 6v6, etc.)
- Advanced scheduling algorithms
- Referee/volunteer management
- Custom tournament rules per event
- A "SPR" system like scoreholio. THis could be interesting for "random" "balanced" team tournament/league

## Questions Answered:
1. For now, for non pod tournaments, let's just register the captain. We can implement adding players to our profile page enhancement journey. 3 pod is 3 player pod tournament. You found a flaw. The organizer also needs to set a max number of teams registered. For example last tournament was 9. this tournament it's 12.
2. I like option C for sure. 
3. Win by 2 should always be there. We can add a "cap" in the future. some leagues cap at say 27 for time restraints. We don't need to do that here. that can be an enhancement. Just allow the organizer to set "starting points" and ending points. 
4. No, for set team tournaments we still do pool play. that will still determine seeding for the bracket play. 
5. Right now I want them to email me. this is highly ineffecient but I want to come up with an automated strategy in the future. I just don't want to do that now. In the near future for the current website we're going to manually update the database with the schedule like we did before. 
6. This is just a display option. For future tournaments teams will sign up to the specific level. sometimes we have "one tournament" that is really 2 or 3 tournaments at once. since they are different teams and levels playing in the same building at the "same time". Right now this is not going to be functional. If they want different levels, they can create different tournaments for each. 
7. My priority is to be able to log in now, create a tournament, and have options shown. My MAIN priority is to use our current december tournament as a test to have all of it's information displayed dynamically as though it were createed through the app. 