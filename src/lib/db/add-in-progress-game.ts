/**
 * Add an in-progress test game for Game 1
 * This will populate the "Current Game" section on the schedule page
 * Run with: npx tsx --env-file=.env.local src/lib/db/add-in-progress-game.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { poolMatches } from "./schema";

async function addInProgressGame() {
  console.log("🏐 Adding in-progress test game...\n");

  try {
    // Add Game 1 from the schedule: Pods 4,5,6 vs 7,8,9 (Pods 1,2,3 sitting)
    // Status: in_progress, with some sample scores
    const match = await db
      .insert(poolMatches)
      .values({
        gameNumber: 1,
        roundNumber: 1,
        scheduledTime: "10:00 AM",
        courtNumber: 1,
        teamAPods: [4, 5, 6],
        teamBPods: [7, 8, 9],
        sittingPods: [1, 2, 3],
        teamAScore: 15,
        teamBScore: 12,
        status: "in_progress",
      })
      .returning();

    console.log("✓ In-progress game added:");
    console.log(`  Game #: 1`);
    console.log(`  Time: 10:00 AM`);
    console.log(`  Team A: Pods 4, 5, 6`);
    console.log(`  Team B: Pods 7, 8, 9`);
    console.log(`  Score: 15-12 (in progress)`);
    console.log(`  Match ID: ${match[0].id}\n`);

    console.log("✅ Test game added successfully!");
    console.log("💡 Visit /schedule to see the live game display");
    console.log("💡 To simulate score changes, you can manually update the teamAScore/teamBScore in the database");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding in-progress game:", error);
    process.exit(1);
  }
}

addInProgressGame();
