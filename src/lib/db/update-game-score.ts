/**
 * Update the score of an in-progress game to test real-time updates
 * Run with: npx tsx --env-file=.env.local src/lib/db/update-game-score.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { poolMatches } from "./schema";
import { eq } from "drizzle-orm";

async function updateGameScore() {
  console.log("🏐 Updating game score...\n");

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
    console.log(`Current score: ${game.teamAScore} - ${game.teamBScore}`);

    // Increment both scores to simulate gameplay
    const newTeamAScore = game.teamAScore + 2;
    const newTeamBScore = game.teamBScore + 1;

    await db
      .update(poolMatches)
      .set({
        teamAScore: newTeamAScore,
        teamBScore: newTeamBScore,
        updatedAt: new Date(),
      })
      .where(eq(poolMatches.id, game.id));

    console.log(`✓ Updated score: ${newTeamAScore} - ${newTeamBScore}`);
    console.log("\n✅ Score updated successfully!");
    console.log(
      "💡 Check your schedule page - the score should update in real-time!"
    );
    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating score:", error);
    process.exit(1);
  }
}

updateGameScore();
