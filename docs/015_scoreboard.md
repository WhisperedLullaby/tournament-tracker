# Task: Design Scoreboard page

**Objective:** I have purchased a mini projector that will display a 4k 1080 screen onto a wall. I want to use this to display the score onto a wall whenever we go to a venue. I'd like this display to be clean and attractive with the ability to go full screen. It shouldn't clutter the display with any UI or UX as it will be display only. It can display things like the tournament/pickup name, the teams playing and an auto updating score. These tournaments are going to be ran by people participating, there should be minimal to no interaction during the actual play required by a person (other than someone updating the score with the scorekeeper page).

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

This plan outlines the sequential steps to the scoreboard

### Step 1: Research

- **Action:** Look into some attractive UI / UX elements for a digital scoreboard. I don't need this to look like what you'd see on a high school wall. But I feel like the jumbotron for sports events may be good inspiration here.

### Step 2: Connect to the Database

- **Action:** Back End work
  - this will need to subscribe to the active games score and update automatically

### Step 3: Front End Work

- **Action:** Make it pretty?

## 3. Acceptance Criteria

- No linting or style errors
- uses shadcn components - maybe even blocks provided by websites if this is a good option
- All extra dependencies are added to `package.json`.
- The application can be started successfully with `npm run dev`.
- As many elements as possible will use shadcnui components and follow best tailwind practices.
- Test linting and build
- Keep files smaller, preferring to break into components when it makes sense.
- Employ software development design patterns where necessary/it makes sense.(eg. creational, structural, behavioral)
- Ensure the display is clean, readable and attractive
- Ask any necessary questions before implementation if required.

## Answered questions:

1. It should show the active game. In the event we add multiple court integration, this will need changed. For now, the active game is the currect call.
2. It should handle any game type.
3. It should only display one court
4. that's a good url structure. This should be a public route.
5. That's a great question...I think we put the header and footer on every page. but I don't want that on here. I think that it should have a button that "goes full screen" that not only uses the full screen api, but also hides the footer and header.
