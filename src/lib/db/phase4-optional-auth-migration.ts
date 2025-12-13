import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "./index";
import { sql } from "drizzle-orm";

/**
 * Phase 4: Optional Authentication Migration
 *
 * This migration:
 * 1. Adds require_auth column to tournaments (default true)
 * 2. Makes pods.user_id nullable (for non-auth registrations)
 * 3. Sets December tournament to require_auth = false for manual entry
 */

async function runMigration() {
  console.log("🚀 Starting Phase 4: Optional Authentication Migration\n");

  try {
    // ====================================================================
    // STEP 1: Add require_auth column to tournaments
    // ====================================================================
    console.log("1️⃣  Adding require_auth column to tournaments...");
    await db.execute(sql`
      ALTER TABLE tournaments
      ADD COLUMN IF NOT EXISTS require_auth BOOLEAN DEFAULT true NOT NULL;
    `);
    console.log("   ✓ require_auth column added\n");

    // ====================================================================
    // STEP 2: Make pods.user_id nullable
    // ====================================================================
    console.log("2️⃣  Making pods.user_id nullable...");
    await db.execute(sql`
      ALTER TABLE pods
      ALTER COLUMN user_id DROP NOT NULL;
    `);
    console.log("   ✓ user_id is now nullable\n");

    // ====================================================================
    // STEP 3: Set December tournament to not require auth
    // ====================================================================
    console.log("3️⃣  Setting December tournament to not require auth...");
    await db.execute(sql`
      UPDATE tournaments
      SET require_auth = false
      WHERE id = 1;
    `);
    console.log("   ✓ December tournament updated (require_auth = false)\n");

    console.log("✅ Phase 4 migration completed successfully!");
    console.log("\n📝 Summary:");
    console.log("   - New tournaments default to requiring auth");
    console.log("   - December tournament allows anonymous registration");
    console.log("   - Pods can now be created without user accounts\n");

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
