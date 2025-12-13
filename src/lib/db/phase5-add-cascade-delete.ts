import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "./index";
import { sql } from "drizzle-orm";

/**
 * Phase 5: Add CASCADE delete to tournament foreign keys
 *
 * This migration:
 * 1. Drops existing foreign key constraints without CASCADE
 * 2. Re-adds them with ON DELETE CASCADE
 *
 * This allows deleting tournaments without manually deleting all related records
 */

async function runMigration() {
  console.log("🚀 Starting Phase 5: Add CASCADE Delete to Foreign Keys\n");

  try {
    // ====================================================================
    // STEP 1: Drop and recreate pods foreign key with CASCADE
    // ====================================================================
    console.log("1️⃣  Updating pods.tournament_id foreign key...");
    await db.execute(sql`
      ALTER TABLE pods
      DROP CONSTRAINT IF EXISTS pods_tournament_id_fkey;
    `);
    await db.execute(sql`
      ALTER TABLE pods
      ADD CONSTRAINT pods_tournament_id_fkey
      FOREIGN KEY (tournament_id)
      REFERENCES tournaments(id)
      ON DELETE CASCADE;
    `);
    console.log("   ✓ pods foreign key updated\n");

    // ====================================================================
    // STEP 2: Drop and recreate pool_matches foreign key with CASCADE
    // ====================================================================
    console.log("2️⃣  Updating pool_matches.tournament_id foreign key...");
    await db.execute(sql`
      ALTER TABLE pool_matches
      DROP CONSTRAINT IF EXISTS pool_matches_tournament_id_fkey;
    `);
    await db.execute(sql`
      ALTER TABLE pool_matches
      ADD CONSTRAINT pool_matches_tournament_id_fkey
      FOREIGN KEY (tournament_id)
      REFERENCES tournaments(id)
      ON DELETE CASCADE;
    `);
    console.log("   ✓ pool_matches foreign key updated\n");

    // ====================================================================
    // STEP 3: Drop and recreate pool_standings foreign key with CASCADE
    // ====================================================================
    console.log("3️⃣  Updating pool_standings.tournament_id foreign key...");
    await db.execute(sql`
      ALTER TABLE pool_standings
      DROP CONSTRAINT IF EXISTS pool_standings_tournament_id_fkey;
    `);
    await db.execute(sql`
      ALTER TABLE pool_standings
      ADD CONSTRAINT pool_standings_tournament_id_fkey
      FOREIGN KEY (tournament_id)
      REFERENCES tournaments(id)
      ON DELETE CASCADE;
    `);
    console.log("   ✓ pool_standings foreign key updated\n");

    // ====================================================================
    // STEP 4: Drop and recreate bracket_teams foreign key with CASCADE
    // ====================================================================
    console.log("4️⃣  Updating bracket_teams.tournament_id foreign key...");
    await db.execute(sql`
      ALTER TABLE bracket_teams
      DROP CONSTRAINT IF EXISTS bracket_teams_tournament_id_fkey;
    `);
    await db.execute(sql`
      ALTER TABLE bracket_teams
      ADD CONSTRAINT bracket_teams_tournament_id_fkey
      FOREIGN KEY (tournament_id)
      REFERENCES tournaments(id)
      ON DELETE CASCADE;
    `);
    console.log("   ✓ bracket_teams foreign key updated\n");

    // ====================================================================
    // STEP 5: Drop and recreate bracket_matches foreign key with CASCADE
    // ====================================================================
    console.log("5️⃣  Updating bracket_matches.tournament_id foreign key...");
    await db.execute(sql`
      ALTER TABLE bracket_matches
      DROP CONSTRAINT IF EXISTS bracket_matches_tournament_id_fkey;
    `);
    await db.execute(sql`
      ALTER TABLE bracket_matches
      ADD CONSTRAINT bracket_matches_tournament_id_fkey
      FOREIGN KEY (tournament_id)
      REFERENCES tournaments(id)
      ON DELETE CASCADE;
    `);
    console.log("   ✓ bracket_matches foreign key updated\n");

    console.log("✅ Phase 5 migration completed successfully!");
    console.log("\n📝 Summary:");
    console.log("   - All tournament foreign keys now have CASCADE delete");
    console.log("   - Deleting a tournament will automatically delete:");
    console.log("     • All registered pods/teams");
    console.log("     • All pool matches");
    console.log("     • All pool standings");
    console.log("     • All bracket teams");
    console.log("     • All bracket matches");
    console.log("     • All tournament roles (already had CASCADE)\n");

  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  runMigration()
    .then(() => {
      console.log("Migration complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { runMigration };
