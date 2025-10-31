/**
 * Start a game by updating its status to 'in_progress'
 * Run with: npx tsx --env-file=.env.local src/lib/db/start-game.ts [gameNumber]
 * Example: npx tsx --env-file=.env.local src/lib/db/start-game.ts 1
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { poolMatches } from "./schema";
import { eq } from "drizzle-orm";

async function startGame() {
  const gameNumber = parseInt(process.argv[2] || "1");

  console.log(`🏐 Starting Game ${gameNumber}...\n`);

  try {
    // Find the game
    const game = await db
      .select()
      .from(poolMatches)
      .where(eq(poolMatches.gameNumber, gameNumber));

    if (game.length === 0) {
      console.log(`❌ Game ${gameNumber} not found`);
      console.log("💡 Run seed-pool-schedule.ts first to populate games");
      process.exit(1);
    }

    if (game[0].status !== "pending") {
      console.log(`⚠️  Game ${gameNumber} is already ${game[0].status}`);
      process.exit(0);
    }

    // Update status to in_progress
    await db
      .update(poolMatches)
      .set({
        status: "in_progress",
        updatedAt: new Date(),
      })
      .where(eq(poolMatches.gameNumber, gameNumber));

    console.log(`✅ Game ${gameNumber} started!`);
    console.log(`  Time: ${game[0].scheduledTime || "TBD"}`);
    console.log(
      `  Team A: Pods ${(game[0].teamAPods as number[]).join(", ")}`
    );
    console.log(
      `  Team B: Pods ${(game[0].teamBPods as number[]).join(", ")}`
    );
    console.log(
      `  Sitting: Pods ${(game[0].sittingPods as number[]).join(", ")}`
    );
    console.log("\n💡 Visit /schedule to see it live!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error starting game:", error);
    process.exit(1);
  }
}

startGame();
