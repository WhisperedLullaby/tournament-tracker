/**
 * Add a test match to verify standings and tie-breaking logic
 * Run with: npx tsx --env-file=.env.local src/lib/db/add-test-match.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { poolMatches } from "./schema";

async function addTestMatch() {
  console.log("🏐 Adding test match...");

  try {
    // Add match: Team 1,2,3 vs Team 4,5,6 - Score: 25-23
    const match = await db
      .insert(poolMatches)
      .values({
        gameNumber: 1,
        roundNumber: 1,
        scheduledTime: "10:00 AM",
        courtNumber: 1,
        teamAPods: [1, 2, 3],
        teamBPods: [4, 5, 6],
        sittingPods: [7, 8, 9],
        teamAScore: 25,
        teamBScore: 23,
        status: "completed",
      })
      .returning();

    console.log("✓ Test match added:");
    console.log(`  Pods 1, 2, 3 vs Pods 4, 5, 6`);
    console.log(`  Score: 25-23`);
    console.log(`  Match ID: ${match[0].id}`);

    console.log("\n✅ Test match added successfully!");
    console.log(
      "💡 Note: This only adds the match record. You'll need to update pool_standings separately to see the stats reflected."
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding test match:", error);
    process.exit(1);
  }
}

addTestMatch();
