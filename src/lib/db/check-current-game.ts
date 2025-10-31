/**
 * Check which game is currently active
 * Run with: npx tsx --env-file=.env.local src/lib/db/check-current-game.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { poolMatches, pods } from "./schema";
import { eq } from "drizzle-orm";

async function checkCurrentGame() {
  console.log("🔍 Checking current game status...\n");

  try {
    // Get all pods for reference
    const allPods = await db.select().from(pods);
    const podMap = new Map(allPods.map((p) => [p.id, p.teamName || p.name]));

    // Check for in-progress game
    const inProgressGames = await db
      .select()
      .from(poolMatches)
      .where(eq(poolMatches.status, "in_progress"));

    if (inProgressGames.length > 0) {
      const game = inProgressGames[0];
      console.log("🏐 CURRENT GAME IN PROGRESS:");
      console.log(`  Game ${game.gameNumber} - ${game.scheduledTime}`);
      console.log(`  Status: ${game.status}`);
      console.log(`  Score: ${game.teamAScore} - ${game.teamBScore}\n`);

      const teamAPods = game.teamAPods as number[];
      const teamBPods = game.teamBPods as number[];

      console.log("  Team A:");
      teamAPods.forEach((podId) => {
        console.log(`    - ${podMap.get(podId)} (Pod ${podId})`);
      });

      console.log("\n  Team B:");
      teamBPods.forEach((podId) => {
        console.log(`    - ${podMap.get(podId)} (Pod ${podId})`);
      });

      console.log("\n💡 You can test completion by:");
      console.log("   1. Setting the score to meet win conditions (21+ and win by 2, or 25)");
      console.log("   2. Clicking the 'End Match' button in the scorekeeper");
    } else {
      console.log("✓ No game currently in progress\n");

      // Check for pending games
      const pendingGames = await db
        .select()
        .from(poolMatches)
        .where(eq(poolMatches.status, "pending"));

      if (pendingGames.length > 0) {
        console.log(`📋 ${pendingGames.length} pending games:\n`);
        pendingGames.forEach((game) => {
          console.log(`  Game ${game.gameNumber} - ${game.scheduledTime}`);
        });
        console.log("\n💡 Start a game from the scorekeeper page to test");
      }

      // Check for completed games
      const completedGames = await db
        .select()
        .from(poolMatches)
        .where(eq(poolMatches.status, "completed"));

      if (completedGames.length > 0) {
        console.log(`\n✅ ${completedGames.length} completed games:\n`);
        completedGames.forEach((game) => {
          console.log(
            `  Game ${game.gameNumber}: ${game.teamAScore} - ${game.teamBScore}`
          );
        });
      }
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking current game:", error);
    process.exit(1);
  }
}

checkCurrentGame();
