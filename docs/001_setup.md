# Task: Initial Project Setup

**Objective:** To create a modern, full-stack TypeScript application foundation using Next.js 15.3. This setup will provide the baseline for a simple tournament tracking application, incorporating best practices for development workflows.

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

### Step 1: Initialize Next.js Project

- **Action:** Use `create-next-app` to scaffold the project.
- **Configuration:**
  - Next.js version: `15.3`
  - Language: TypeScript
  - Features: ESLint, Tailwind CSS, App Router

### Step 2: Configure Code Formatting

- **Action:** Install and configure Prettier.
- **Dependencies:**
  - `prettier`
  - `prettier-plugin-tailwindcss` (for automatic class sorting)
- **Configuration Files:**
  - Create `.prettierrc` for rules.
  - Create `.prettierignore` to exclude specific files/directories.

### Step 3: Set Up UI Component Library

- **Action:** Initialize `shadcn/ui`.
- **Outcome:**
  - Configure global styles (`globals.css`).
  - Create `components.json` for managing UI components.
  - Set up necessary utility files for `cn` (class name merging).

### Step 4: Add Core Data Layer Dependencies

- **Action:** Install libraries for database interaction and authentication.
- **Dependencies:**
  - `drizzle-orm`
  - `drizzle-kit` (for migrations)
  - `@supabase/supabase-js`
  - `postgres` (for Drizzle client)

### Step 5: Configure Drizzle ORM and Schema

- **Action:** Define the Drizzle configuration and database schema.
- **Configuration Files:**
  - Create `drizzle.config.ts`.
  - Define schema in `src/lib/db/schema.ts`.

### Step 6: Set Up Drizzle Client

- **Action:** Initialize the Drizzle ORM client.
- **File:**
  - Create `src/lib/db/index.ts`.

### Step 7: Apply Database Schema

- **Action:** Generate and apply database migrations.
- **Commands:**
  - `npx drizzle-kit generate:pg` (to generate migration files)
  - `npx drizzle-kit push:pg` (to apply schema directly to the database)

### Step 8: Set Up Supabase Client

- **Action:** Initialize the Supabase client.
- **File:**
  - Create `src/lib/supabase.ts`.

### Step 9: Streamline Development Workflow

- **Action:** Add utility scripts to `package.json`.
- **Scripts:**
  - `format`: To run Prettier across the codebase.
  - `lint:fix`: To run ESLint and automatically fix issues.

### Step 10: Establish Directory Structure

- **Action:** Create foundational directories for organizing code.
- **Structure:**
  - `src/lib/`: For shared utilities, database clients, etc.
  - `src/components/`: For UI components managed by shadcn/ui.

## 3. Acceptance Criteria

- The project is successfully created with `create-next-app`.
- ESLint and Prettier are configured and can be run via npm scripts.
- `shadcn/ui` is initialized.
- All specified dependencies are added to `package.json`.
- Drizzle ORM is configured, and the database schema is defined.
- Drizzle client is set up.
- Supabase client is set up.
- The database schema is successfully applied to the database.
- The initial directory structure is in place.
- The application can be started successfully with `npm run dev`.
