/**
 * Apply Row Level Security (RLS) policies to database tables
 * Run with: npx tsx --env-file=.env.local src/lib/db/add-rls-policies.ts
 */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { sql } from "drizzle-orm";

async function applyRLSPolicies() {
  console.log("🔒 Applying Row Level Security (RLS) policies...\n");

  try {
    // Enable RLS on pods table
    console.log("1️⃣  Enabling RLS on pods table...");
    await db.execute(sql`
      ALTER TABLE pods ENABLE ROW LEVEL SECURITY;
    `);
    console.log("✓ RLS enabled on pods\n");

    // Enable RLS on tournaments table
    console.log("2️⃣  Enabling RLS on tournaments table...");
    await db.execute(sql`
      ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
    `);
    console.log("✓ RLS enabled on tournaments\n");

    // Drop existing policies if they exist (for idempotency)
    console.log("3️⃣  Cleaning up any existing policies...");
    await db.execute(sql`
      DROP POLICY IF EXISTS "Users can insert their own pods" ON pods;
      DROP POLICY IF EXISTS "Anyone can read pods" ON pods;
      DROP POLICY IF EXISTS "Users can update their own pods" ON pods;
      DROP POLICY IF EXISTS "Anyone can read tournaments" ON tournaments;
    `);
    console.log("✓ Existing policies cleaned up\n");

    // Policy: Users can insert their own pods
    console.log("4️⃣  Creating policy: Users can insert their own pods...");
    await db.execute(sql`
      CREATE POLICY "Users can insert their own pods"
      ON pods FOR INSERT
      TO authenticated
      WITH CHECK (auth.uid()::text = user_id);
    `);
    console.log("✓ Insert policy created\n");

    // Policy: Anyone can read pods (for standings, schedule, etc.)
    console.log("5️⃣  Creating policy: Anyone can read pods...");
    await db.execute(sql`
      CREATE POLICY "Anyone can read pods"
      ON pods FOR SELECT
      TO public
      USING (true);
    `);
    console.log("✓ Read policy created\n");

    // Policy: Users can update their own pods (for future profile edits)
    console.log("6️⃣  Creating policy: Users can update their own pods...");
    await db.execute(sql`
      CREATE POLICY "Users can update their own pods"
      ON pods FOR UPDATE
      TO authenticated
      USING (auth.uid()::text = user_id)
      WITH CHECK (auth.uid()::text = user_id);
    `);
    console.log("✓ Update policy created\n");

    // Policy: Anyone can read tournaments
    console.log("7️⃣  Creating policy: Anyone can read tournaments...");
    await db.execute(sql`
      CREATE POLICY "Anyone can read tournaments"
      ON tournaments FOR SELECT
      TO public
      USING (true);
    `);
    console.log("✓ Tournament read policy created\n");

    console.log("✅ RLS policies applied successfully!");
    console.log("\nSummary:");
    console.log("  ✓ Enabled RLS on pods and tournaments tables");
    console.log("  ✓ Users can only insert/update their own pods");
    console.log("  ✓ Everyone can read pods and tournaments (public data)");
    console.log("\nSecurity notes:");
    console.log("  - User authentication is enforced at API level");
    console.log("  - RLS provides defense-in-depth protection");
    console.log("  - Direct database access is now protected by policies");

    process.exit(0);
  } catch (error) {
    console.error("\n❌ Error applying RLS policies:", error);
    process.exit(1);
  }
}

applyRLSPolicies();
