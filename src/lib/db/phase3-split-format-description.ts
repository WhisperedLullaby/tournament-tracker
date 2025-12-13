import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from ".";
import { sql } from "drizzle-orm";

/**
 * Phase 3: Split Format Description
 *
 * This migration:
 * 1. Adds pool_play_description and bracket_play_description columns
 * 2. Drops the old format_description column
 * 3. Populates December tournament with the content that was previously hardcoded
 */

async function migrateFormatDescription() {
  console.log("🔄 Starting Phase 3: Split Format Description migration...");

  try {
    // Step 1: Add new columns
    console.log("Adding pool_play_description column...");
    await db.execute(sql`
      ALTER TABLE tournaments
      ADD COLUMN IF NOT EXISTS pool_play_description TEXT;
    `);

    console.log("Adding bracket_play_description column...");
    await db.execute(sql`
      ALTER TABLE tournaments
      ADD COLUMN IF NOT EXISTS bracket_play_description TEXT;
    `);

    // Step 2: Populate December tournament (ID 1) with the hardcoded content
    // This content matches what was previously shown in the fallback
    const poolPlayContent = `9 Pods of 2 Players
18 total players divided into partnerships

6v6 Matches
3 pods per side, 3 pods rest each round

Seeding by Point Differential
Pods ranked 1-9 after pool play`;

    const bracketPlayContent = `3 Teams of 6 Players
Seeds 1+5+9, 2+6+7, 3+4+8

Balanced Team Formation
Top, middle, and bottom seeds combined

Double Elimination
Everyone must lose twice to be eliminated`;

    console.log("Populating December tournament with structured content...");
    await db.execute(sql`
      UPDATE tournaments
      SET
        pool_play_description = ${poolPlayContent},
        bracket_play_description = ${bracketPlayContent},
        updated_at = NOW()
      WHERE id = 1;
    `);

    // Step 3: Drop old format_description column
    console.log("Dropping old format_description column...");
    await db.execute(sql`
      ALTER TABLE tournaments
      DROP COLUMN IF EXISTS format_description;
    `);

    console.log("✅ Phase 3 migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateFormatDescription()
    .then(() => {
      console.log("Migration complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Migration failed:", error);
      process.exit(1);
    });
}

export { migrateFormatDescription };
