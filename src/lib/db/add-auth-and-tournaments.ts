/**
 * Apply migration to add authentication and tournaments support
 * Run with: npx tsx --env-file=.env.local src/lib/db/add-auth-and-tournaments.ts
 */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { sql } from "drizzle-orm";

async function applyMigration() {
  console.log("🔧 Applying authentication and tournaments migration...\n");

  try {
    // Step 1: Create tournament_status enum if it doesn't exist
    console.log("1️⃣  Creating tournament_status enum...");
    await db.execute(sql`
      DO $$ BEGIN
        CREATE TYPE tournament_status AS ENUM ('upcoming', 'active', 'completed');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log("✓ tournament_status enum ready\n");

    // Step 2: Create tournaments table if it doesn't exist
    console.log("2️⃣  Creating tournaments table...");
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tournaments (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        date TIMESTAMP NOT NULL,
        location TEXT,
        status tournament_status DEFAULT 'upcoming' NOT NULL,
        max_pods INTEGER DEFAULT 9 NOT NULL,
        registration_deadline TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log("✓ tournaments table ready\n");

    // Step 3: Check if tournaments table is empty and seed initial tournament
    const existingTournaments = await db.execute(sql`
      SELECT COUNT(*) as count FROM tournaments
    `);

    const tournamentCount = Number(existingTournaments[0].count);

    if (tournamentCount === 0) {
      console.log("3️⃣  Seeding initial tournament (Dec 13, 2025)...");
      await db.execute(sql`
        INSERT INTO tournaments (name, date, location, status, max_pods, registration_deadline)
        VALUES (
          'Two Peas Dec''25',
          '2025-12-13 10:00:00',
          'All American FieldHouse, Monroeville, PA',
          'active',
          9,
          '2025-12-12 23:59:59'
        );
      `);
      console.log("✓ Initial tournament created\n");
    } else {
      console.log("3️⃣  Tournament(s) already exist, skipping seed\n");
    }

    // Step 4: Check if pods table needs migration
    console.log("4️⃣  Checking pods table structure...");
    const checkColumns = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'pods'
      AND column_name IN ('user_id', 'tournament_id')
    `);

    if (checkColumns.length === 2) {
      console.log("✓ Pods table already migrated, skipping\n");
      console.log("✅ Migration completed successfully!");
      process.exit(0);
    }

    // Step 5: Check if pods table has any existing data
    const existingPods = await db.execute(sql`
      SELECT COUNT(*) as count FROM pods
    `);

    const podCount = Number(existingPods[0].count);

    if (podCount > 0) {
      console.log(
        `⚠️  Warning: Found ${podCount} existing pods. This migration requires an empty pods table.`
      );
      console.log("Please backup and clear the pods table before running this migration.");
      process.exit(1);
    }

    // Step 6: Drop the old unique constraint on email
    console.log("5️⃣  Removing old email unique constraint...");
    await db.execute(sql`
      ALTER TABLE pods DROP CONSTRAINT IF EXISTS pods_email_key;
    `);
    console.log("✓ Old constraint removed\n");

    // Step 7: Add new columns to pods table
    console.log("6️⃣  Adding user_id and tournament_id columns to pods...");
    await db.execute(sql`
      ALTER TABLE pods
      ADD COLUMN user_id TEXT NOT NULL DEFAULT '',
      ADD COLUMN tournament_id INTEGER NOT NULL DEFAULT 1
        REFERENCES tournaments(id);
    `);
    console.log("✓ New columns added\n");

    // Step 8: Remove the default constraints (they were just for the migration)
    console.log("7️⃣  Finalizing column constraints...");
    await db.execute(sql`
      ALTER TABLE pods
      ALTER COLUMN user_id DROP DEFAULT,
      ALTER COLUMN tournament_id DROP DEFAULT;
    `);
    console.log("✓ Constraints finalized\n");

    // Step 9: Add unique constraint on (user_id, tournament_id)
    console.log("8️⃣  Adding unique constraint on (user_id, tournament_id)...");
    await db.execute(sql`
      ALTER TABLE pods
      ADD CONSTRAINT unique_user_tournament UNIQUE (user_id, tournament_id);
    `);
    console.log("✓ Unique constraint added\n");

    console.log("\n✅ Migration completed successfully!");
    console.log("Summary:");
    console.log("  ✓ Created tournament_status enum");
    console.log("  ✓ Created tournaments table");
    console.log("  ✓ Seeded initial tournament (Dec 13, 2025)");
    console.log("  ✓ Updated pods table with user_id and tournament_id");
    console.log("  ✓ Added unique constraint for one pod per user per tournament");
    console.log("\nNext steps:");
    console.log("  1. Update Drizzle schema (already done)");
    console.log("  2. Push schema to database: npx drizzle-kit push");
    console.log("  3. Test the registration flow with Google OAuth");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error applying migration:", error);
    process.exit(1);
  }
}

applyMigration();
