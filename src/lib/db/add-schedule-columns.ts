/**
 * Add courtNumber and sittingPods columns to pool_matches
 * Run with: npx tsx --env-file=.env.local src/lib/db/add-schedule-columns.ts
 */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { sql } from "drizzle-orm";

async function addScheduleColumns() {
  console.log("🔧 Adding courtNumber and sittingPods columns...\n");

  try {
    // Check if columns already exist
    const checkColumns = await db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'pool_matches'
      AND column_name IN ('court_number', 'sitting_pods')
    `);

    if (checkColumns.length === 2) {
      console.log("✓ Columns already exist, skipping migration");
      process.exit(0);
    }

    console.log("Adding new columns...");

    // Add courtNumber with default value of 1
    if (!checkColumns.some((col) => col.column_name === "court_number")) {
      await db.execute(sql`
        ALTER TABLE pool_matches
        ADD COLUMN court_number integer DEFAULT 1 NOT NULL
      `);
      console.log("✓ Added court_number column");
    }

    // Add sittingPods with empty array as default for existing rows
    if (!checkColumns.some((col) => col.column_name === "sitting_pods")) {
      await db.execute(sql`
        ALTER TABLE pool_matches
        ADD COLUMN sitting_pods json DEFAULT '[]' NOT NULL
      `);

      // Remove default after adding (so future inserts must specify it)
      await db.execute(sql`
        ALTER TABLE pool_matches
        ALTER COLUMN sitting_pods DROP DEFAULT
      `);
      console.log("✓ Added sitting_pods column");
    }

    console.log("\n✅ Migration completed successfully!");
    console.log("💡 Note: Existing rows have empty sitting_pods arrays");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding columns:", error);
    process.exit(1);
  }
}

addScheduleColumns();
