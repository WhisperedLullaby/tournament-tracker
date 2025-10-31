/**
 * Check which pods exist and which games reference non-existent pods
 * Run with: npx tsx --env-file=.env.local src/lib/db/check-game-data.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { pods, poolMatches } from "./schema";

async function checkGameData() {
  console.log("🔍 Checking pod and game data...\n");

  try {
    // Get all pods
    const allPods = await db.select().from(pods);
    console.log(`✓ Found ${allPods.length} registered pods:`);
    allPods.forEach((pod) => {
      console.log(`  Pod ${pod.id}: ${pod.teamName || pod.name}`);
    });

    // Get all games
    const allGames = await db.select().from(poolMatches);
    console.log(`\n✓ Found ${allGames.length} games in schedule\n`);

    // Check for invalid pod references
    const podIds = new Set(allPods.map((p) => p.id));
    const invalidGames: Array<{
      gameNumber: number;
      invalidPods: number[];
    }> = [];

    allGames.forEach((game) => {
      const teamAPods = game.teamAPods as number[];
      const teamBPods = game.teamBPods as number[];
      const sittingPods = game.sittingPods as number[];
      const allGamePods = [...teamAPods, ...teamBPods, ...sittingPods];

      const invalid = allGamePods.filter((podId) => !podIds.has(podId));

      if (invalid.length > 0) {
        invalidGames.push({
          gameNumber: game.gameNumber,
          invalidPods: invalid,
        });
      }
    });

    if (invalidGames.length > 0) {
      console.log("⚠️  WARNING: Found games referencing non-existent pods:\n");
      invalidGames.forEach((game) => {
        console.log(`  Game ${game.gameNumber}: References pod IDs ${game.invalidPods.join(", ")} which don't exist`);
      });
      console.log(
        "\n💡 Solution: You need to either:\n" +
          "   1. Register pods with these IDs, or\n" +
          "   2. Update the game schedule to use valid pod IDs\n"
      );
    } else {
      console.log("✅ All games reference valid pod IDs!");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Error checking data:", error);
    process.exit(1);
  }
}

checkGameData();
