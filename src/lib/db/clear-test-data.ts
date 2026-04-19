/**
 * Clear only test standings and match data
 * KEEPS all real pod registrations
 * Run with: npx tsx --env-file=.env.local src/lib/db/clear-test-data.ts
 */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { poolStandings, poolMatches } from "./schema";

async function clearTestData() {
  console.log("🧹 Clearing test standings and match data...");
  console.log("⚠️  This will NOT delete any pod registrations");

  try {
    // Clear pool matches
    await db.delete(poolMatches);
    console.log("✓ Cleared pool matches");

    // Clear pool standings
    await db.delete(poolStandings);
    console.log("✓ Cleared pool standings");

    console.log("✅ Test data cleared successfully!");
    console.log("📝 All pod registrations have been preserved");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error clearing test data:", error);
    process.exit(1);
  }
}

clearTestData();
