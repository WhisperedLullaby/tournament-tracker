# Task: Initial Project Setup

**Objective:** To create a simple modern landing page using shadcn components.

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

- **Action:** Find a potential shadcn command for a homepage
- **Configuration:**
  - UI: shadcn/ui
- **Notes:**
  - Mobile first
  - Must be responsive
    - mobile
    - tablet
    - desktop

### Step 2: Navigation

- **Action:** Create Navigation Links for pages
- **Navigation Links:**
  - Home
  - Standings
  - Schedule
  - Scoring
  - Teams
  - Log in / Log out

### Step 3: Page Layout

- **Action:** Use basic page layout and styling
- **Outcome:**
  - should have some kind of landing page setup
    - hero
    - tournament info
    - footer
    - modal for log in / log out button with link to the registration page

## 3. Acceptance Criteria

- No linting or style errors
- uses shadcn components
- All extra dependencies are added to `package.json`.
- The application can be started successfully with `npm run dev`.
