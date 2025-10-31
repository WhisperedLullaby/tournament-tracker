/**
 * Apply migration to add game_number and scheduled_time columns
 * Run with: npx tsx --env-file=.env.local src/lib/db/apply-migration.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { sql } from "drizzle-orm";

async function applyMigration() {
  console.log("🔧 Applying migration to pool_matches table...\n");

  try {
    // Check if columns already exist
    const checkColumns = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'pool_matches'
      AND column_name IN ('game_number', 'scheduled_time')
    `);

    if (checkColumns.length > 0) {
      console.log("✓ Columns already exist, skipping migration");
      console.log("Migration is already applied!");
      process.exit(0);
    }

    console.log("Adding game_number and scheduled_time columns...");

    // First, check if there are any existing rows
    const existingRows = await db.execute(sql`
      SELECT COUNT(*) as count FROM pool_matches
    `);

    const rowCount = Number(existingRows[0].count);

    if (rowCount > 0) {
      console.log(`⚠️  Found ${rowCount} existing rows in pool_matches`);
      console.log("Adding columns with temporary default values...\n");

      // Add columns with defaults for existing rows
      await db.execute(sql`
        ALTER TABLE pool_matches
        ADD COLUMN game_number integer DEFAULT 1 NOT NULL
      `);

      await db.execute(sql`
        ALTER TABLE pool_matches
        ADD COLUMN scheduled_time varchar(20)
      `);

      // Remove the default constraint
      await db.execute(sql`
        ALTER TABLE pool_matches
        ALTER COLUMN game_number DROP DEFAULT
      `);

      console.log(
        "⚠️  Note: Existing rows have game_number set to 1. You may want to update them manually."
      );
    } else {
      // No existing rows, can add NOT NULL without default
      await db.execute(sql`
        ALTER TABLE pool_matches
        ADD COLUMN game_number integer NOT NULL
      `);

      await db.execute(sql`
        ALTER TABLE pool_matches
        ADD COLUMN scheduled_time varchar(20)
      `);
    }

    console.log("\n✅ Migration applied successfully!");
    console.log("✓ Added game_number column");
    console.log("✓ Added scheduled_time column");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error applying migration:", error);
    process.exit(1);
  }
}

applyMigration();
