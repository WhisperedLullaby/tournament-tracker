/**
 * Check pool standings for any issues
 * Run with: npx tsx --env-file=.env.local src/lib/db/check-standings.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { poolStandings, pods } from "./schema";

async function checkStandings() {
  console.log("🔍 Checking pool standings...\n");

  try {
    // Get all standings
    const allStandings = await db.select().from(poolStandings);
    console.log(`✓ Found ${allStandings.length} standings records\n`);

    if (allStandings.length === 0) {
      console.log("✅ No standings records exist yet. Ready for first game completion!");
      process.exit(0);
    }

    // Get all valid pod IDs
    const allPods = await db.select().from(pods);
    const validPodIds = new Set(allPods.map((p) => p.id));

    // Check for invalid standings
    const invalidStandings = allStandings.filter(
      (standing) => !validPodIds.has(standing.podId)
    );

    if (invalidStandings.length > 0) {
      console.log("⚠️  WARNING: Found standings referencing non-existent pods:");
      invalidStandings.forEach((standing) => {
        console.log(`  Standing ID ${standing.id}: References pod ${standing.podId} which doesn't exist`);
      });
      console.log("\n💡 These records should be deleted");
    } else {
      console.log("✅ All standings reference valid pods!");
      console.log("\nCurrent standings:");
      allStandings.forEach((standing) => {
        const pod = allPods.find((p) => p.id === standing.podId);
        console.log(
          `  Pod ${standing.podId} (${pod?.teamName || pod?.name}): ${standing.wins}-${standing.losses}, ${standing.pointsFor}-${standing.pointsAgainst}`
        );
      });
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking standings:", error);
    process.exit(1);
  }
}

checkStandings();
