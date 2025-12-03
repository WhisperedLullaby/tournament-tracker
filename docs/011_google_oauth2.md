# Task: Google Auth for profiles

**Objective:** To create an account creation/log in pipeline that exclusively uses google account sign in. 

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

- **Action:** Look into how google oauth works and detail the preliminary steps before coding

### Step 2: Connect the db with oauth

- **Action:** Connect the db
    - not sure entirely how this will work. but follow best practices. 

- **Action:** Create interface for users to create/log in to their account in the tournament signup flow. Instead of just putting their name, they'll first sign in/create an account. Give the option to put their name in or use the name from the google account. 

### Step 3: Integrate into sign up flow

## 3. Acceptance Criteria

- No linting or style errors
- uses shadcn components
- All extra dependencies are added to `package.json`.
- The application can be started successfully with `npm run dev`.
- As many elements as possible will use shadcnui components and follow best tailwind practices.
- Test linting and build
- Keep files smaller, preferring to break into components when it makes sense.
- Employ software development design patterns where necessary/it makes sense.(eg. creational, structural, behavioral)
- Ask any necessary questions if there are any
- Ensure that the flow is still easy for the user and accessible. Aiming for zero bounce rate. we don't want people to not sign up for the tournament because the flow is annoying or complicated. 

## 4. Implementation answers: 
- Use Name if Name is not given. if the optional (name) field for their registration is blank, use the name field from google next, if that doesn't exist, use the full name. if the full name or name doesn't exist (somehow) make the name input required.
- I have deleted all of the data from the database. I know this is kind of awful, but I don't need that old data for anything and we can start at a blank slate. the 5 tables of bracket_matches, bracket_teams, pool_matches, pods, and pool_standings are empty. no migration required
- They should be able to sign out. put something small in the navigation at the top if they are signed in. we will be doing a rudimentary profile page in the near future.
- Hm. If google already does it, let's let google do it's thing.
- No. For right now this is just one tournament. I'll be putting in multiple tournaments in the future. But for now...let's make a table keeping track of the tournaments. we can hook into that later when it's needed. might as well get that started. This will be tournament 1 of the new system
- Nah, no images or anything needed for now. we will discuss profile picture and profile "stuff" in general in the future. 