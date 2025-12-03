/**
 * Fix pod IDs in pool matches to reference the actual registered pods
 * Run with: npx tsx --env-file=.env.local src/lib/db/fix-game-pod-ids.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { pods, poolMatches } from "./schema";
import { eq } from "drizzle-orm";

async function fixGamePodIds() {
  console.log("🔧 Fixing pod IDs in pool matches...\n");

  try {
    // Get all pods sorted by ID
    const allPods = await db.select().from(pods).orderBy(pods.id);

    if (allPods.length !== 12) {
      console.error(`❌ Expected 9 pods, but found ${allPods.length}`);
      console.log("\nRegistered pods:");
      allPods.forEach((pod) => {
        console.log(`  Pod ${pod.id}: ${pod.teamName || pod.name}`);
      });
      process.exit(1);
    }

    console.log(`✓ Found ${allPods.length} registered pods:\n`);
    allPods.forEach((pod, index) => {
      console.log(
        `  ${index + 1} → Pod ${pod.id}: ${pod.teamName || pod.name}`
      );
    });

    // Create mapping from old pod IDs (1-9) to new pod IDs
    const podMapping: Record<number, number> = {};
    allPods.forEach((pod, index) => {
      podMapping[index + 1] = pod.id;
    });

    console.log("\n📋 Pod ID Mapping:");
    console.log("  Old ID → New ID");
    Object.entries(podMapping).forEach(([oldId, newId]) => {
      console.log(`  ${oldId} → ${newId}`);
    });

    // Get all games
    const allGames = await db.select().from(poolMatches);
    console.log(`\n✓ Found ${allGames.length} games to update\n`);

    // Update each game
    for (const game of allGames) {
      const teamAPods = game.teamAPods as number[];
      const teamBPods = game.teamBPods as number[];
      const sittingPods = game.sittingPods as number[];

      // Map old IDs to new IDs
      const newTeamAPods = teamAPods.map((id) => podMapping[id]);
      const newTeamBPods = teamBPods.map((id) => podMapping[id]);
      const newSittingPods = sittingPods.map((id) => podMapping[id]);

      // Update the game
      await db
        .update(poolMatches)
        .set({
          teamAPods: newTeamAPods,
          teamBPods: newTeamBPods,
          sittingPods: newSittingPods,
          updatedAt: new Date(),
        })
        .where(eq(poolMatches.id, game.id));

      console.log(`✓ Game ${game.gameNumber}: Updated pod IDs`);
      console.log(
        `  Team A: [${teamAPods.join(", ")}] → [${newTeamAPods.join(", ")}]`
      );
      console.log(
        `  Team B: [${teamBPods.join(", ")}] → [${newTeamBPods.join(", ")}]`
      );
      console.log(
        `  Sitting: [${sittingPods.join(", ")}] → [${newSittingPods.join(", ")}]\n`
      );
    }

    console.log("✅ All games updated successfully!");
    console.log("\n💡 You can now complete games without foreign key errors");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing pod IDs:", error);
    process.exit(1);
  }
}

fixGamePodIds();
