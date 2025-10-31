/**
 * Mark the current in-progress game as completed
 * This will trigger the auto-advance feature on the schedule page
 * Run with: npx tsx --env-file=.env.local src/lib/db/complete-game.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { poolMatches } from "./schema";
import { eq } from "drizzle-orm";

async function completeGame() {
  console.log("🏐 Completing current game...\n");

  try {
    // Get the current in-progress game
    const inProgressGames = await db
      .select()
      .from(poolMatches)
      .where(eq(poolMatches.status, "in_progress"));

    if (inProgressGames.length === 0) {
      console.log("❌ No in-progress games found");
      console.log("💡 Run add-in-progress-game.ts first");
      process.exit(1);
    }

    const game = inProgressGames[0];
    console.log(`Game #${game.gameNumber}`);
    console.log(`Current score: ${game.teamAScore} - ${game.teamBScore}`);

    // Set final score and mark as completed
    await db
      .update(poolMatches)
      .set({
        teamAScore: 21,
        teamBScore: 19,
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(poolMatches.id, game.id));

    console.log(`✓ Game completed with final score: 21 - 19`);
    console.log("\n✅ Game marked as completed!");
    console.log(
      "💡 The schedule page should show the completion animation and auto-reload to show the next game"
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Error completing game:", error);
    process.exit(1);
  }
}

completeGame();
