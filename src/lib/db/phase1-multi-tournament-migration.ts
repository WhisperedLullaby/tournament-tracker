/**
 * Phase 1: Multi-Tournament Platform Migration
 * Run with: npx tsx --env-file=.env.local src/lib/db/phase1-multi-tournament-migration.ts
 *
 * This script:
 * - Creates tournament_role enum
 * - Enhances tournaments table
 * - Adds tournament_id to all related tables
 * - Creates tournament_roles and organizer_whitelist tables
 * - Migrates existing tournament data
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { sql } from "drizzle-orm";

// IMPORTANT: Update these with your actual values
const ADMIN_USER_ID: string = "a5ae2062-ce59-4b42-9a5a-ebc0040dd35d"; // Get from Supabase Auth dashboard
const ADMIN_EMAIL: string = "agnone.anthony@gmail.com"; // Your Google account email

async function runMigration() {
  console.log("🚀 Starting Phase 1: Multi-Tournament Platform Migration\n");

  try {
    // ====================================================================
    // STEP 1: Create tournament_role enum
    // ====================================================================
    console.log("1️⃣  Creating tournament_role enum...");
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE tournament_role AS ENUM ('organizer', 'participant');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("✓ tournament_role enum ready\n");

    // ====================================================================
    // STEP 1b: Create tournament_status enum
    // ====================================================================
    console.log("1️⃣b Creating tournament_status enum...");
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE tournament_status AS ENUM ('upcoming', 'active', 'completed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("✓ tournament_status enum ready\n");

    // ====================================================================
    // STEP 2: Create tournaments table if it doesn't exist
    // ====================================================================
    console.log("2️⃣  Creating tournaments table...");

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tournaments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        date TIMESTAMP NOT NULL,
        location TEXT,
        description TEXT,
        status tournament_status DEFAULT 'upcoming' NOT NULL,
        max_pods INTEGER DEFAULT 9 NOT NULL,
        registration_deadline TIMESTAMP,
        registration_open_date TIMESTAMP,
        is_public BOOLEAN DEFAULT TRUE NOT NULL,
        created_by TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✓ Tournaments table ready\n");

    // ====================================================================
    // STEP 3: Add tournament_id and user_id to existing tables
    // ====================================================================
    console.log("3️⃣  Adding tournament_id and user_id to existing tables...");

    // Check pods table for user_id
    const checkPodsUserId = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'pods'
      AND column_name = 'user_id'
    `);

    if (checkPodsUserId.length === 0) {
      console.log("Adding user_id to pods...");
      await db.execute(sql`
        ALTER TABLE pods
        ADD COLUMN user_id TEXT NOT NULL DEFAULT 'system';
      `);
    }

    // Check pods table for tournament_id
    const checkPodsTournamentId = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'pods'
      AND column_name = 'tournament_id'
    `);

    if (checkPodsTournamentId.length === 0) {
      console.log("Adding tournament_id to pods...");
      await db.execute(sql`
        ALTER TABLE pods
        ADD COLUMN tournament_id INTEGER NOT NULL DEFAULT 1
        REFERENCES tournaments(id);
      `);
    }

    // Check pool_matches
    const checkPoolMatches = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'pool_matches'
      AND column_name = 'tournament_id'
    `);

    if (checkPoolMatches.length === 0) {
      console.log("Adding tournament_id to pool_matches...");
      await db.execute(sql`
        ALTER TABLE pool_matches
        ADD COLUMN tournament_id INTEGER NOT NULL DEFAULT 1
        REFERENCES tournaments(id);
      `);
    }

    // Check pool_standings
    const checkPoolStandings = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'pool_standings'
      AND column_name = 'tournament_id'
    `);

    if (checkPoolStandings.length === 0) {
      console.log("Adding tournament_id to pool_standings...");
      await db.execute(sql`
        ALTER TABLE pool_standings
        ADD COLUMN tournament_id INTEGER NOT NULL DEFAULT 1
        REFERENCES tournaments(id);
      `);
    }

    // Check bracket_teams
    const checkBracketTeams = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'bracket_teams'
      AND column_name = 'tournament_id'
    `);

    if (checkBracketTeams.length === 0) {
      console.log("Adding tournament_id to bracket_teams...");
      await db.execute(sql`
        ALTER TABLE bracket_teams
        ADD COLUMN tournament_id INTEGER NOT NULL DEFAULT 1
        REFERENCES tournaments(id);
      `);
    }

    // Check bracket_matches
    const checkBracketMatches = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'bracket_matches'
      AND column_name = 'tournament_id'
    `);

    if (checkBracketMatches.length === 0) {
      console.log("Adding tournament_id to bracket_matches...");
      await db.execute(sql`
        ALTER TABLE bracket_matches
        ADD COLUMN tournament_id INTEGER NOT NULL DEFAULT 1
        REFERENCES tournaments(id);
      `);
    }

    console.log("✓ tournament_id added to all tables\n");

    // ====================================================================
    // STEP 4: Create tournament_roles table
    // ====================================================================
    console.log("4️⃣  Creating tournament_roles table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tournament_roles (
        id SERIAL PRIMARY KEY,
        tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
        user_id TEXT NOT NULL,
        role tournament_role NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✓ tournament_roles table created\n");

    // ====================================================================
    // STEP 5: Create organizer_whitelist table
    // ====================================================================
    console.log("5️⃣  Creating organizer_whitelist table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS organizer_whitelist (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL,
        added_by TEXT NOT NULL,
        added_at TIMESTAMP DEFAULT NOW() NOT NULL,
        notes TEXT
      );
    `);
    console.log("✓ organizer_whitelist table created\n");

    // ====================================================================
    // STEP 6: Populate slug for existing tournament
    // ====================================================================
    console.log("6️⃣  Populating slug for existing tournament...");

    // Check if tournament 1 exists
    const tournament = await db.execute(sql`
      SELECT id FROM tournaments WHERE id = 1 LIMIT 1
    `);

    if (tournament.length > 0) {
      await db.execute(sql`
        UPDATE tournaments
        SET
          slug = 'two-peas-dec-2025',
          description = 'Draw 2''s Bonney and Clyde Volleyball Tournament - Two Peas in a Pod',
          created_by = ${ADMIN_USER_ID},
          updated_at = NOW()
        WHERE id = 1 AND slug IS NULL;
      `);
      console.log("✓ Tournament slug and metadata populated\n");
    } else {
      console.log(
        "⚠️  No tournament with ID 1 found - skipping slug population\n"
      );
    }

    // ====================================================================
    // STEP 7: Add admin to organizer whitelist
    // ====================================================================
    console.log("7️⃣  Adding admin to organizer whitelist...");

    if (ADMIN_USER_ID === "YOUR_SUPABASE_USER_ID") {
      console.log("⚠️  WARNING: ADMIN_USER_ID not configured!");
      console.log(
        "⚠️  Please update the ADMIN_USER_ID constant at the top of this file"
      );
      console.log(
        "⚠️  Get your user ID from: Supabase Dashboard → Authentication → Users\n"
      );
    } else {
      // Check if already whitelisted
      const existing = await db.execute(sql`
        SELECT id FROM organizer_whitelist WHERE user_id = ${ADMIN_USER_ID} LIMIT 1
      `);

      if (existing.length === 0) {
        await db.execute(sql`
          INSERT INTO organizer_whitelist (user_id, email, added_by, notes)
          VALUES (${ADMIN_USER_ID}, ${ADMIN_EMAIL}, 'system', 'Initial admin user - migration');
        `);
        console.log("✓ Admin added to whitelist\n");
      } else {
        console.log("✓ Admin already in whitelist\n");
      }
    }

    // ====================================================================
    // STEP 8: Assign organizer role for tournament 1
    // ====================================================================
    console.log("8️⃣  Assigning organizer role for tournament 1...");

    if (
      ADMIN_USER_ID !== "YOUR_SUPABASE_USER_ID" &&
      tournament.length > 0
    ) {
      // Check if role already exists
      const existingRole = await db.execute(sql`
        SELECT id FROM tournament_roles
        WHERE tournament_id = 1
        AND user_id = ${ADMIN_USER_ID}
        AND role = 'organizer'
        LIMIT 1
      `);

      if (existingRole.length === 0) {
        await db.execute(sql`
          INSERT INTO tournament_roles (tournament_id, user_id, role)
          VALUES (1, ${ADMIN_USER_ID}, 'organizer');
        `);
        console.log("✓ Organizer role assigned\n");
      } else {
        console.log("✓ Organizer role already exists\n");
      }
    }

    // ====================================================================
    // STEP 9: Create participant roles for existing pods
    // ====================================================================
    console.log("9️⃣  Creating participant roles for existing pods...");

    const existingPods = await db.execute(sql`
      SELECT DISTINCT user_id, tournament_id
      FROM pods
      WHERE user_id IS NOT NULL
    `);

    let rolesCreated = 0;
    for (const pod of existingPods) {
      const userId = pod.user_id as string;
      const tournamentId = pod.tournament_id as number;

      // Check if role already exists
      const existingRole = await db.execute(sql`
        SELECT id FROM tournament_roles
        WHERE tournament_id = ${tournamentId}
        AND user_id = ${userId}
        AND role = 'participant'
        LIMIT 1
      `);

      if (existingRole.length === 0) {
        await db.execute(sql`
          INSERT INTO tournament_roles (tournament_id, user_id, role)
          VALUES (${tournamentId}, ${userId}, 'participant');
        `);
        rolesCreated++;
      }
    }

    console.log(`✓ Created ${rolesCreated} participant roles\n`);

    // ====================================================================
    // STEP 10: Remove default constraints
    // ====================================================================
    console.log("🔟  Removing temporary default constraints...");

    await db.execute(sql`
      ALTER TABLE pods ALTER COLUMN user_id DROP DEFAULT;
      ALTER TABLE pods ALTER COLUMN tournament_id DROP DEFAULT;
      ALTER TABLE pool_matches ALTER COLUMN tournament_id DROP DEFAULT;
      ALTER TABLE pool_standings ALTER COLUMN tournament_id DROP DEFAULT;
      ALTER TABLE bracket_teams ALTER COLUMN tournament_id DROP DEFAULT;
      ALTER TABLE bracket_matches ALTER COLUMN tournament_id DROP DEFAULT;
      ALTER TABLE tournaments ALTER COLUMN created_by DROP DEFAULT;
    `);

    console.log("✓ Default constraints removed\n");

    // ====================================================================
    // STEP 11: Add unique constraint to pods
    // ====================================================================
    console.log("1️⃣1️⃣  Adding unique constraint to pods...");

    // Check if constraint already exists
    const constraintCheck = await db.execute(sql`
      SELECT constraint_name
      FROM information_schema.table_constraints
      WHERE table_name = 'pods'
      AND constraint_name = 'unique_user_tournament'
    `);

    if (constraintCheck.length === 0) {
      await db.execute(sql`
        ALTER TABLE pods
        ADD CONSTRAINT unique_user_tournament UNIQUE (user_id, tournament_id);
      `);
      console.log("✓ Unique constraint added\n");
    } else {
      console.log("✓ Unique constraint already exists\n");
    }

    // ====================================================================
    // STEP 12: Create indexes for performance
    // ====================================================================
    console.log("1️⃣2️⃣  Creating indexes for performance...");

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS idx_pods_tournament_id ON pods(tournament_id);
      CREATE INDEX IF NOT EXISTS idx_pool_matches_tournament_id ON pool_matches(tournament_id);
      CREATE INDEX IF NOT EXISTS idx_pool_standings_tournament_id ON pool_standings(tournament_id);
      CREATE INDEX IF NOT EXISTS idx_bracket_teams_tournament_id ON bracket_teams(tournament_id);
      CREATE INDEX IF NOT EXISTS idx_bracket_matches_tournament_id ON bracket_matches(tournament_id);
      CREATE INDEX IF NOT EXISTS idx_tournament_roles_tournament_user ON tournament_roles(tournament_id, user_id);
      CREATE INDEX IF NOT EXISTS idx_tournament_roles_user ON tournament_roles(user_id);
      CREATE INDEX IF NOT EXISTS idx_tournaments_slug ON tournaments(slug);
      CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
      CREATE INDEX IF NOT EXISTS idx_tournaments_created_by ON tournaments(created_by);
    `);

    console.log("✓ Indexes created\n");

    // ====================================================================
    // VERIFICATION
    // ====================================================================
    console.log("✅ Phase 1 Migration Complete!\n");
    console.log("=====================================");
    console.log("Summary:");
    console.log("  ✓ Created tournament_role enum");
    console.log("  ✓ Enhanced tournaments table");
    console.log("  ✓ Added tournament_id to all related tables");
    console.log("  ✓ Created tournament_roles table");
    console.log("  ✓ Created organizer_whitelist table");
    console.log("  ✓ Populated existing tournament data");
    console.log("  ✓ Created participant roles for existing pods");
    console.log("  ✓ Added performance indexes");
    console.log("=====================================\n");

    if (ADMIN_USER_ID === "YOUR_SUPABASE_USER_ID") {
      console.log("⚠️  NEXT STEPS:");
      console.log("1. Update ADMIN_USER_ID in this script");
      console.log(
        "2. Get your user ID: Supabase Dashboard → Authentication → Users"
      );
      console.log("3. Re-run this migration to complete admin setup\n");
    } else {
      console.log("🎉 Migration successful! You can now:");
      console.log("1. Start working on Phase 2 (queries)");
      console.log("2. Create new tournaments");
      console.log("3. Test the multi-tournament functionality\n");
    }

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    console.error(
      "\nYou may need to manually rollback changes if the migration failed partway through."
    );
    process.exit(1);
  }
}

runMigration();
