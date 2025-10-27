# Task: Initial Project Setup

**Objective:** To update the homepage with design elements.

---

## 1. Core Technologies

- **UI:** Tailwind CSS with shadcn/ui

## 2. Implementation Plan

Use shadcn

### Step 1: Research

- **Action:** Look into some prebuilt free hero blocks
- **Configuration:**
  - UI: shadcn/ui
- **Notes:**
  - Mobile first
  - Must be responsive
    - mobile
    - tablet
    - desktop

### Step 2: Research 2

- **Action:** Checkout out the official shadcn background components. One is provided that I like the most.
- **Link:**
  - https://www.shadcn.io/background/shape-landing-hero

### Step 3: Implement New hero

- **Action:** Update Hero with new design elements
- **Outcome:**
  - Hero should be most of the height of the viewport on desktop, and at least the height of the device in mobile. think 100vh. But this is not necessary in desktop. we're looking for good visual clarity.
  - Hero should have a form for registering an account on the right side. I want this to actually be a multistep form like https://stepperize.vercel.app/docs/react. You can register your account, then register your team, then alternatively NAME your team, and then a success panel.

  ### Step 4: Update Backend for names

- **Action:** Team name will need to be added to the database.

## 3. Acceptance Criteria

- No linting or style errors
- uses shadcn components
- All extra dependencies are added to `package.json`.
- The application can be started successfully with `npm run dev`.
