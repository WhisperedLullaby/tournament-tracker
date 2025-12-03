# Task: Multi-Tournament Platform

**Objective:** Transform the single-tournament application into a multi-tournament platform where users can browse, register for, and participate in multiple tournaments. Implement role-based access control with whitelisted organizers who can create and manage tournaments. Each tournament has its own dedicated pages (standings, schedule, bracket, scorekeeper) accessible via SEO-friendly slug-based URLs.

---

## 1. Core Technologies

- **Framework:** Next.js 15.3 (App Router)
- **Language:** TypeScript (Strict Mode)
- **UI:** Tailwind CSS with shadcn/ui
- **Linting & Formatting:** ESLint & Prettier
- **Database:** Supabase (PostgreSQL)
- **ORM:** Drizzle ORM
- **Authentication:** Supabase Auth (Google OAuth)

---

## 2. Key Requirements

### Access Control
- **Tournament Creation:** Whitelisted organizers only (admin-controlled)
- **Tournament Viewing:** Public (anyone can view tournament details)
- **Scorekeeper Access:** Tournament creator only

### URL Structure
- **SEO-friendly slugs:** `/tournaments/two-peas-dec-2025`
- **No hybrid approach:** Pure slug-based routing
- **Automatic slug generation:** From tournament name

### Branding
- **Uniform styling:** All tournaments use current branding
- **No custom themes:** Future feature, not now

---

## 3. Implementation Plan

This plan is divided into 5 phases, each building on the previous phase.

---

### **PHASE 1: Database Foundation**

**Objective:** Update database schema to support multiple tournaments with proper relationships and access control.

#### Step 1.1: Add tournament_id to existing tables

**Action:** Add foreign key relationships to link all data to tournaments

**Tables to Update:**
```sql
-- Pool matches
ALTER TABLE pool_matches
  ADD COLUMN tournament_id INTEGER NOT NULL DEFAULT 1
  REFERENCES tournaments(id);

-- Pool standings
ALTER TABLE pool_standings
  ADD COLUMN tournament_id INTEGER NOT NULL DEFAULT 1
  REFERENCES tournaments(id);

-- Bracket teams
ALTER TABLE bracket_teams
  ADD COLUMN tournament_id INTEGER NOT NULL DEFAULT 1
  REFERENCES tournaments(id);

-- Bracket matches
ALTER TABLE bracket_matches
  ADD COLUMN tournament_id INTEGER NOT NULL DEFAULT 1
  REFERENCES tournaments(id);
```

**Notes:**
- Default to tournament_id = 1 for existing data
- Remove defaults after migration completes
- Add indexes on tournament_id for query performance

#### Step 1.2: Create tournament_roles table

**Action:** Create role-based access control table

**Schema:**
```typescript
export const roleEnum = pgEnum("tournament_role", [
  "organizer",    // Can create/edit tournaments, access scorekeeper
  "participant",  // Registered player (auto-assigned on registration)
]);

export const tournamentRoles = pgTable("tournament_roles", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(), // Supabase auth user ID
  role: roleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Unique constraint: one role per user per tournament
// Composite index for fast lookups
```

**Notes:**
- Organizer role grants full access to tournament
- Participant role auto-assigned when user registers
- Future: Add "scorekeeper" role if needed

#### Step 1.3: Enhance tournaments table

**Action:** Add fields needed for multi-tournament platform

**New Fields:**
```typescript
export const tournaments = pgTable("tournaments", {
  // ... existing fields (id, name, date, location, status, etc.)

  createdBy: text("created_by").notNull(), // User ID of creator
  slug: text("slug").notNull().unique(), // URL: "two-peas-dec-2025"
  description: text("description"), // Tournament description/rules
  registrationOpenDate: timestamp("registration_open_date"),
  isPublic: boolean("is_public").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});
```

**Slug Generation Rules:**
- Lowercase, hyphenated
- Generated from: `{name}-{month}-{year}`
- Example: "Two Peas Pod" + Dec 2025 → `two-peas-pod-dec-2025`
- Ensure uniqueness

#### Step 1.4: Create organizer whitelist table

**Action:** Create table to manage who can create tournaments

**Schema:**
```typescript
export const organizerWhitelist = pgTable("organizer_whitelist", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(), // Supabase auth user ID
  email: text("email").notNull(), // For reference
  addedBy: text("added_by").notNull(), // Admin who added them
  addedAt: timestamp("added_at").defaultNow().notNull(),
  notes: text("notes"), // Why they were whitelisted
});
```

**Seed Data:**
- Add your user ID to whitelist during migration
- Check whitelist before allowing tournament creation

**Outcome:**
- All tables properly linked to tournaments
- Role-based access control in place
- Organizer whitelist ready
- Existing tournament data preserved

---

### **PHASE 2: Core Queries & Utilities**

**Objective:** Update all database queries to work with tournament context and create helper functions.

#### Step 2.1: Update queries.ts with tournament filtering

**Action:** Add `tournamentId` parameter to all existing queries

**Queries to Update:**
```typescript
// Before
export async function getPoolStandings() { ... }

// After
export async function getPoolStandings(tournamentId: number) {
  return db
    .select()
    .from(poolStandings)
    .where(eq(poolStandings.tournamentId, tournamentId))
    ...
}
```

**All queries needing updates:**
- `getPoolStandings(tournamentId)`
- `getPoolMatchesLog(tournamentId)`
- `isPoolPlayComplete(tournamentId)`
- `getBracketMatches(tournamentId)`
- `getBracketTeams(tournamentId)`
- `getCurrentGame(tournamentId)`
- `getNextGame(tournamentId)`
- `isRegistrationOpen(tournamentId)`
- `getAllPods(tournamentId)`

#### Step 2.2: Create new tournament queries

**Action:** Add queries for tournament operations

**New Queries:**
```typescript
// Get all tournaments (with filters)
export async function getAllTournaments(filter?: {
  status?: 'upcoming' | 'active' | 'completed';
  isPublic?: boolean;
}) { ... }

// Get tournament by slug
export async function getTournamentBySlug(slug: string) { ... }

// Get user's tournaments
export async function getUserTournaments(userId: string) { ... }

// Check if user can create tournaments
export async function isWhitelistedOrganizer(userId: string) { ... }

// Check if user is tournament organizer
export async function isTournamentOrganizer(
  userId: string,
  tournamentId: number
) { ... }

// Get user's role in tournament
export async function getUserTournamentRole(
  userId: string,
  tournamentId: number
) { ... }
```

#### Step 2.3: Create slug utility

**Action:** Build slug generation and validation utilities

**File:** `src/lib/utils/slug.ts`
```typescript
export function generateSlug(name: string, date: Date): string {
  const monthNames = ['jan', 'feb', 'mar', ...];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();

  const baseName = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();

  return `${baseName}-${month}-${year}`;
}

export async function ensureUniqueSlug(
  baseSlug: string,
  tournamentId?: number
): Promise<string> {
  // Check if slug exists, append number if needed
  // two-peas-dec-2025 → two-peas-dec-2025-2
}
```

**Outcome:**
- All queries tournament-aware
- Helper functions for roles and access
- Slug generation standardized

---

### **PHASE 3: Routing & Tournament Context**

**Objective:** Create new route structure with dynamic tournament slugs and context provider.

#### Step 3.1: Create tournament context provider

**Action:** Build context for tournament-specific pages

**File:** `src/contexts/tournament-context.tsx`
```typescript
interface TournamentContextType {
  tournament: Tournament;
  userRole: 'organizer' | 'participant' | null;
  isOrganizer: boolean;
  isParticipant: boolean;
}

export function TournamentProvider({
  slug,
  children
}: {
  slug: string;
  children: React.ReactNode;
}) {
  // Fetch tournament by slug
  // Check user's role
  // Provide context to children
}
```

#### Step 3.2: Create new route structure

**Action:** Set up file-based routing for tournaments

**New Routes:**
```
src/app/
├── tournaments/
│   ├── page.tsx                          // Browse all tournaments
│   ├── create/
│   │   └── page.tsx                      // Create tournament (organizers only)
│   └── [slug]/
│       ├── layout.tsx                    // Tournament layout with context
│       ├── page.tsx                      // Tournament detail/hub
│       ├── register/
│       │   └── page.tsx                  // Registration for this tournament
│       ├── standings/
│       │   └── page.tsx                  // Tournament standings
│       ├── schedule/
│       │   └── page.tsx                  // Tournament schedule
│       ├── bracket/
│       │   └── page.tsx                  // Tournament bracket (if active)
│       ├── scorekeeper/
│       │   └── page.tsx                  // Scorekeeper (organizer only)
│       └── settings/
│           └── page.tsx                  // Tournament settings (organizer only)
```

#### Step 3.3: Create tournament layout

**Action:** Build shared layout for tournament pages

**File:** `src/app/tournaments/[slug]/layout.tsx`
```typescript
export default async function TournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { slug: string };
}) {
  const { slug } = await params;
  const tournament = await getTournamentBySlug(slug);

  if (!tournament) {
    notFound();
  }

  return (
    <TournamentProvider slug={slug}>
      <div className="tournament-layout">
        <TournamentNav tournament={tournament} />
        {children}
      </div>
    </TournamentProvider>
  );
}
```

**Outcome:**
- Clean URL structure with slugs
- Tournament context available throughout
- Shared layout for consistency

---

### **PHASE 4: Tournament Pages**

**Objective:** Build all tournament-related pages and components.

#### Step 4.1: Tournament browser page

**Action:** Create main tournaments listing page

**File:** `src/app/tournaments/page.tsx`

**Features:**
- Filter tabs: Upcoming, Active, Completed
- Tournament cards showing:
  - Name, date, location
  - Registration status (X/9 spots)
  - Tournament status badge
  - Quick actions (Register, View)
- Search/filter functionality
- "Create Tournament" button (if whitelisted organizer)

**Component Structure:**
```
<TournamentBrowser>
  <FilterTabs />
  <TournamentGrid>
    <TournamentCard /> × N
  </TournamentGrid>
</TournamentBrowser>
```

#### Step 4.2: Tournament detail/hub page

**Action:** Create tournament landing page

**File:** `src/app/tournaments/[slug]/page.tsx`

**Sections:**
- Tournament header (name, date, location, status)
- Quick actions (Register, View Standings, etc.)
- Tournament description/rules
- Registration status (X/9 registered)
- Registered teams preview
- Tournament information (prize, format, etc.)

**Navigation Tabs:**
- Overview (current page)
- Register
- Standings
- Schedule
- Bracket (if in bracket phase)
- Scorekeeper (if organizer)
- Settings (if organizer)

#### Step 4.3: Update existing pages for tournament context

**Action:** Adapt current pages to work with specific tournaments

**Pages to Update:**

**Standings Page:**
```typescript
// src/app/tournaments/[slug]/standings/page.tsx
export default async function TournamentStandings({
  params,
}: {
  params: { slug: string };
}) {
  const { slug } = await params;
  const tournament = await getTournamentBySlug(slug);
  const standings = await getPoolStandings(tournament.id);
  // ... existing logic, now tournament-specific
}
```

**Similar updates for:**
- Schedule page
- Bracket page (teams page)
- Scorekeeper page (with organizer check)

#### Step 4.4: Tournament registration page

**Action:** Move registration to tournament-specific route

**File:** `src/app/tournaments/[slug]/register/page.tsx`

**Changes:**
- Accept tournament context from params
- Pass tournamentId to registration form
- Display tournament-specific info
- Check if registration is open
- Check if user already registered

**Component:**
```typescript
<TournamentRegistrationPage>
  <TournamentInfo tournament={tournament} />
  <RegistrationForm tournamentId={tournament.id} />
</TournamentRegistrationPage>
```

**Outcome:**
- All tournament pages functional
- Existing components reused with tournament context
- Clean, consistent navigation

---

### **PHASE 5: Tournament Creation & Management**

**Objective:** Build tournament creation flow and management tools for organizers.

#### Step 5.1: Create tournament form

**Action:** Build multi-step tournament creation wizard

**File:** `src/app/tournaments/create/page.tsx`

**Steps:**
1. **Basic Info**
   - Tournament name
   - Date and time
   - Location
   - Max pods (default 9)

2. **Schedule**
   - Registration open/close dates
   - Tournament format (Draw 2's)
   - Pool play rounds (default 4)

3. **Details**
   - Description/rules
   - Prize information
   - Contact information

4. **Review & Create**
   - Preview all settings
   - Auto-generate slug
   - Create tournament + assign organizer role

**Validation:**
- Check user is whitelisted organizer
- Ensure unique slug
- Validate dates (future dates only)

#### Step 5.2: Tournament settings page

**Action:** Create management interface for organizers

**File:** `src/app/tournaments/[slug]/settings/page.tsx`

**Sections:**
- **Basic Settings:** Edit name, date, location
- **Registration:** Open/close registration, set limits
- **Status Management:** Mark as active, completed
- **Danger Zone:** Delete tournament (if no registrations)

**Access Control:**
```typescript
// Check user is tournament organizer
const isOrganizer = await isTournamentOrganizer(user.id, tournament.id);
if (!isOrganizer) {
  redirect(`/tournaments/${slug}`);
}
```

#### Step 5.3: Scorekeeper access control

**Action:** Add organizer-only protection to scorekeeper

**File:** `src/app/tournaments/[slug]/scorekeeper/page.tsx`

**Protection:**
```typescript
export default async function Scorekeeper({ params }) {
  const { slug } = await params;
  const tournament = await getTournamentBySlug(slug);
  const user = await getUser(); // From session

  const isOrganizer = await isTournamentOrganizer(user.id, tournament.id);

  if (!isOrganizer) {
    return <AccessDenied message="Only tournament organizers can access the scorekeeper" />;
  }

  // ... existing scorekeeper logic
}
```

#### Step 5.4: Tournament templates (optional enhancement)

**Action:** Allow duplicating tournament structure

**Feature:**
- "Use as template" button on tournament settings
- Copies tournament structure (format, rounds, settings)
- Creates new tournament with copied settings
- Saves organizers time for recurring events

**Outcome:**
- Complete tournament creation flow
- Organizer management tools
- Scorekeeper properly protected

---

### **PHASE 6: Navigation & Home Page Updates**

**Objective:** Update global navigation and transform home page into tournament platform.

#### Step 6.1: Update navigation component

**Action:** Make navigation context-aware

**File:** `src/components/navigation.tsx`

**Updates:**
```typescript
// Global nav items
const globalNavItems = [
  { label: "Tournaments", href: "/tournaments" },
  { label: "Profile", href: "/profile" }, // Future
];

// Tournament-specific nav (shown when on /tournaments/[slug]/*)
const tournamentNavItems = [
  { label: "Overview", href: `/tournaments/${slug}` },
  { label: "Standings", href: `/tournaments/${slug}/standings` },
  { label: "Schedule", href: `/tournaments/${slug}/schedule` },
  { label: "Bracket", href: `/tournaments/${slug}/bracket`, onlyIf: inBracketPhase },
  { label: "Scorekeeper", href: `/tournaments/${slug}/scorekeeper`, onlyIf: isOrganizer },
];

// Conditional "Create Tournament" button
{isWhitelistedOrganizer && (
  <Link href="/tournaments/create">Create Tournament</Link>
)}
```

#### Step 6.2: Transform home page

**Action:** Update landing page for multi-tournament platform

**File:** `src/app/page.tsx`

**Options:**

**Option A: Tournament Browser as Home**
- Redirect `/` → `/tournaments`
- Tournament list becomes the home page

**Option B: Marketing Home + Featured Tournaments**
- Hero section with platform description
- Featured/upcoming tournaments section
- Call-to-action to browse all tournaments

**Recommendation:** Option A (simpler, more direct)

**Outcome:**
- Navigation adapts to context
- Clear path to tournaments
- Organizer tools accessible

---

### **PHASE 7: API Route Updates**

**Objective:** Update all API routes to handle tournament context and access control.

#### Step 7.1: Update registration API

**Action:** Accept tournamentId parameter

**File:** `src/app/api/register-pod/route.ts`

**Changes:**
```typescript
// Accept tournamentId from request body
const { tournamentId, email, player1, player2, teamName } = body;

// Validate tournament exists and registration open
const tournament = await getTournamentById(tournamentId);
if (!tournament) {
  return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
}

if (tournament.status !== 'active') {
  return NextResponse.json({ error: "Registration closed" }, { status: 400 });
}

// Check registration limits for this tournament
const registrationOpen = await isRegistrationOpen(tournamentId);

// Insert pod with tournamentId
await db.insert(pods).values({
  tournamentId,
  userId: user.id,
  // ... rest of fields
});

// Assign participant role
await db.insert(tournamentRoles).values({
  tournamentId,
  userId: user.id,
  role: 'participant',
});
```

#### Step 7.2: Update game/score APIs

**Action:** Add tournament validation to all game-related APIs

**Files to Update:**
- `/api/games/[id]/score` - Verify organizer for tournament
- `/api/games/[id]/complete` - Verify organizer for tournament
- `/api/games/start` - Verify organizer for tournament
- `/api/bracket/*` - Same organizer checks

**Pattern:**
```typescript
// Get game
const game = await getGameById(id);
const tournament = await getTournamentById(game.tournamentId);

// Verify user is organizer
const isOrganizer = await isTournamentOrganizer(user.id, tournament.id);
if (!isOrganizer) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
```

#### Step 7.3: Create tournament management APIs

**Action:** Build new API routes for tournament operations

**New Routes:**

```typescript
// Create tournament
POST /api/tournaments/create
- Check whitelist
- Generate slug
- Create tournament
- Assign organizer role

// Update tournament
PATCH /api/tournaments/[id]
- Check organizer
- Update settings
- Regenerate slug if name changed

// Delete tournament
DELETE /api/tournaments/[id]
- Check organizer
- Verify no registrations
- Cascade delete (roles, future games)

// Initialize pool/bracket for tournament
POST /api/tournaments/[id]/initialize-pool
POST /api/tournaments/[id]/initialize-bracket
- Check organizer
- Create pool matches or bracket based on registrations
```

**Outcome:**
- All APIs tournament-aware
- Proper access control
- Tournament management APIs

---

### **PHASE 8: Data Migration & Testing**

**Objective:** Migrate existing tournament data and test all functionality.

#### Step 8.1: Create comprehensive migration script

**Action:** Build script to migrate all existing data

**File:** `src/lib/db/migrate-to-multi-tournament.ts`

**Migration Steps:**
```typescript
async function migrateToMultiTournament() {
  // 1. Add slug to existing tournament
  await db.update(tournaments)
    .set({
      slug: 'two-peas-dec-2025',
      createdBy: ADMIN_USER_ID,
      description: 'Two Peas in a Pod - December 2025',
    })
    .where(eq(tournaments.id, 1));

  // 2. Add tournament_id to all existing data
  // (Already has default = 1 from Phase 1)

  // 3. Add admin to whitelist
  await db.insert(organizerWhitelist).values({
    userId: ADMIN_USER_ID,
    email: ADMIN_EMAIL,
    addedBy: 'system',
    notes: 'Initial admin user',
  });

  // 4. Assign organizer role for tournament 1
  await db.insert(tournamentRoles).values({
    tournamentId: 1,
    userId: ADMIN_USER_ID,
    role: 'organizer',
  });

  // 5. Create participant roles for existing pods
  const existingPods = await db.select().from(pods);
  for (const pod of existingPods) {
    await db.insert(tournamentRoles).values({
      tournamentId: pod.tournamentId,
      userId: pod.userId,
      role: 'participant',
    });
  }

  // 6. Verify all data migrated correctly
  console.log('Migration complete!');
}
```

#### Step 8.2: Testing checklist

**Action:** Test all functionality with migrated data

**Test Cases:**

**Tournament Browsing:**
- [ ] Can view all tournaments
- [ ] Filter by status works
- [ ] Tournament cards display correctly
- [ ] Links work to tournament pages

**Tournament Pages:**
- [ ] Can access tournament via slug
- [ ] All tabs work correctly
- [ ] Data shows for correct tournament only
- [ ] Standings filtered to tournament
- [ ] Schedule filtered to tournament
- [ ] Bracket filtered to tournament

**Access Control:**
- [ ] Only whitelisted users see "Create Tournament"
- [ ] Only organizer can access scorekeeper
- [ ] Only organizer can access settings
- [ ] Non-organizer gets access denied message
- [ ] Public can view all other pages

**Registration:**
- [ ] Can register for tournament
- [ ] Gets participant role automatically
- [ ] Can't register twice for same tournament
- [ ] Can register for multiple tournaments
- [ ] Registration respects tournament limits

**Tournament Creation:**
- [ ] Whitelisted user can create tournament
- [ ] Slug generates correctly
- [ ] Becomes organizer automatically
- [ ] Can access all tournament features

**Data Integrity:**
- [ ] Existing tournament still works
- [ ] All historical data preserved
- [ ] Queries return correct tournament data
- [ ] No data leakage between tournaments

#### Step 8.3: Performance optimization

**Action:** Add indexes and optimize queries

**Indexes to Add:**
```sql
CREATE INDEX idx_pods_tournament_id ON pods(tournament_id);
CREATE INDEX idx_pool_matches_tournament_id ON pool_matches(tournament_id);
CREATE INDEX idx_pool_standings_tournament_id ON pool_standings(tournament_id);
CREATE INDEX idx_bracket_teams_tournament_id ON bracket_teams(tournament_id);
CREATE INDEX idx_bracket_matches_tournament_id ON bracket_matches(tournament_id);
CREATE INDEX idx_tournament_roles_tournament_user ON tournament_roles(tournament_id, user_id);
CREATE INDEX idx_tournament_roles_user ON tournament_roles(user_id);
CREATE INDEX idx_tournaments_slug ON tournaments(slug);
CREATE INDEX idx_tournaments_status ON tournaments(status);
```

**Outcome:**
- All existing data migrated
- Full platform tested
- Performance optimized

---

### **PHASE 9: Polish & User Experience**

**Objective:** Add finishing touches and improve user experience.

#### Step 9.1: Empty states

**Action:** Create helpful empty states

**Components:**
- No tournaments yet (for new platform)
- No registered tournaments (user profile)
- No teams registered (tournament with 0 pods)
- Access denied (scorekeeper)

#### Step 9.2: Loading states

**Action:** Add proper loading indicators

**Pages:**
- Tournament browser (skeleton cards)
- Tournament detail (skeleton layout)
- Navigation (loading state)

#### Step 9.3: Error handling

**Action:** Improve error messages

**Cases:**
- Tournament not found (404)
- Access denied (403)
- Registration closed
- Already registered
- Not whitelisted

#### Step 9.4: Tournament status badges

**Action:** Create visual status indicators

**Statuses:**
- 🟢 Registration Open
- 🔴 Registration Closed
- ⚡ In Progress
- ✅ Completed
- 📅 Upcoming

**Outcome:**
- Polished user experience
- Clear feedback and messaging
- Professional appearance

---

## 4. Acceptance Criteria

**Phase 1-3 (Foundation):**
- [ ] All tables have tournament_id foreign key
- [ ] tournament_roles table created and working
- [ ] Organizer whitelist table functional
- [ ] Slug generation works correctly
- [ ] All queries accept tournamentId parameter
- [ ] Route structure in place with [slug] dynamic routes

**Phase 4-6 (Pages):**
- [ ] Tournament browser page functional
- [ ] Tournament detail page shows correct data
- [ ] All tournament pages (standings, schedule, bracket) work
- [ ] Registration works for specific tournaments
- [ ] Navigation updates based on context
- [ ] Scorekeeper restricted to organizers

**Phase 7-8 (APIs & Migration):**
- [ ] All API routes handle tournament context
- [ ] Access control working correctly
- [ ] Tournament creation API functional
- [ ] Migration script runs successfully
- [ ] All existing data preserved and working

**Phase 9 (Polish):**
- [ ] Empty states implemented
- [ ] Loading states smooth
- [ ] Error messages helpful
- [ ] Status badges display correctly

**General:**
- [ ] No linting or TypeScript errors
- [ ] Build succeeds
- [ ] All shadcn/ui components used properly
- [ ] Responsive design maintained
- [ ] Performance acceptable (sub-second page loads)

---

## 5. Migration Strategy

### Approach: Zero-Downtime Migration

**Step 1:** Add new fields with defaults
- All new columns have DEFAULT values
- Existing data continues working

**Step 2:** Populate new data
- Add slugs to tournaments
- Create roles for existing users
- Add whitelist entries

**Step 3:** Deploy new routes
- New `/tournaments/*` routes added
- Old routes still work temporarily

**Step 4:** Redirect old routes
- `/` → `/tournaments`
- `/standings` → `/tournaments/two-peas-dec-2025/standings`
- `/schedule` → `/tournaments/two-peas-dec-2025/schedule`
- etc.

**Step 5:** Remove defaults
- Once migration verified, remove DEFAULT constraints
- Clean up temporary code

### Rollback Plan

If issues arise:
1. Keep old routes active
2. Revert database defaults if needed
3. Old single-tournament logic still works
4. Can roll back deployment

---

## 6. Implementation Notes

### Current Hardcoded Tournament ID Locations

Files that reference CURRENT_TOURNAMENT_ID = 1:
- `src/app/api/register-pod/route.ts:12`
- Need to search codebase for other hardcoded references

### Slug Naming Convention

Pattern: `{sanitized-name}-{month}-{year}`

Examples:
- "Two Peas in a Pod" + Dec 2025 → `two-peas-in-a-pod-dec-2025`
- "Spring Showdown!" + Mar 2026 → `spring-showdown-mar-2026`
- "Summer Smash 4v4" + Jul 2026 → `summer-smash-4v4-jul-2026`

### Access Control Matrix

| Page | Public | Participant | Organizer |
|------|--------|-------------|-----------|
| Browse Tournaments | ✅ | ✅ | ✅ |
| Tournament Detail | ✅ | ✅ | ✅ |
| Standings | ✅ | ✅ | ✅ |
| Schedule | ✅ | ✅ | ✅ |
| Bracket | ✅ | ✅ | ✅ |
| Register | ✅ (if auth) | ✅ | ✅ |
| Scorekeeper | ❌ | ❌ | ✅ |
| Settings | ❌ | ❌ | ✅ |
| Create Tournament | ❌ | ❌ | ✅ (if whitelisted) |

### Whitelist Management

**Initial Setup:**
- Admin adds their own user ID via migration script
- Provides interface to add more organizers later

**Adding Organizers:**
1. Get user to sign in with Google (creates user account)
2. Copy their user ID from Supabase auth dashboard
3. Insert into organizer_whitelist table
4. They can now create tournaments

**Future:** Build admin UI for whitelist management

### Tournament Status Flow

```
upcoming → active → completed
    ↓         ↓
  (can edit) (can edit settings but not format)
```

- **Upcoming:** Registration not open yet
- **Active:** Registration open, tournament in progress
- **Completed:** Tournament finished, read-only

---

## 7. Future Enhancements (Out of Scope for Now)

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

---

## 8. Timeline Estimate

**Phase 1 (Database):** 2-3 hours
**Phase 2 (Queries):** 1-2 hours
**Phase 3 (Routing):** 2 hours
**Phase 4 (Pages):** 4-5 hours
**Phase 5 (Creation):** 3-4 hours
**Phase 6 (Navigation):** 1-2 hours
**Phase 7 (APIs):** 2-3 hours
**Phase 8 (Migration):** 2 hours
**Phase 9 (Polish):** 2-3 hours

**Total Estimated Time:** 20-25 hours

**Suggested Schedule:**
- **Day 1:** Phases 1-3 (Foundation)
- **Day 2:** Phases 4-5 (Pages & Creation)
- **Day 3:** Phases 6-7 (Navigation & APIs)
- **Day 4:** Phases 8-9 (Migration & Polish)

---

## 9. Questions & Decisions

### Resolved:
- ✅ Tournament creation: Whitelisted organizers only
- ✅ URL structure: Slug-based (SEO-friendly)
- ✅ Branding: Uniform across all tournaments
- ✅ Access: Public viewing, organizer-only scorekeeper

### For Later:
- How to manage organizer whitelist? (Manual SQL for now)
- Tournament archival strategy? (Keep all for now)
- Duplicate tournament names? (Slug handles with year/month)
- Tournament deletion rules? (Only if no registrations)
