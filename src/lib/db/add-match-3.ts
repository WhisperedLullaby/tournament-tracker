/**
 * Add third test match
 * Pods 33, 28, 35 vs 32, 27, 34 - Score: 21-25 (Team B wins)
 * Run with: npx tsx --env-file=.env.local src/lib/db/add-match-3.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { poolMatches, poolStandings } from "./schema";
import { eq } from "drizzle-orm";

async function addMatch3() {
  console.log("🏐 Adding third test match...\n");

  try {
    // Add match: Pods 33, 28, 35 vs 32, 27, 34 - Score: 21-25
    const match = await db
      .insert(poolMatches)
      .values({
        roundNumber: 3,
        teamAPods: [33, 28, 35], // Pip's penguins, Tina/Felix, Fairly Spiked
        teamBPods: [32, 27, 34], // TBD, Kelly/Donovan, Dana/Hayden
        teamAScore: 21,
        teamBScore: 25,
        status: "completed",
      })
      .returning();

    console.log("✓ Test match added:");
    console.log(`  Team A: Pods 33, 28, 35`);
    console.log(`  Team B: Pods 32, 27, 34`);
    console.log(`  Score: 21-25 (Team B wins)`);
    console.log(`  Match ID: ${match[0].id}\n`);

    // Update standings for losing team (33, 28, 35)
    console.log("Updating standings for losing team...");
    for (const podId of [33, 28, 35]) {
      const existing = await db
        .select()
        .from(poolStandings)
        .where(eq(poolStandings.podId, podId));

      if (existing.length > 0) {
        await db
          .update(poolStandings)
          .set({
            losses: existing[0].losses + 1,
            pointsFor: existing[0].pointsFor + 21,
            pointsAgainst: existing[0].pointsAgainst + 25,
          })
          .where(eq(poolStandings.podId, podId));
      } else {
        await db.insert(poolStandings).values({
          podId,
          wins: 0,
          losses: 1,
          pointsFor: 21,
          pointsAgainst: 25,
        });
      }
      console.log(`  ✓ Updated Pod ${podId}`);
    }

    // Update standings for winning team (32, 27, 34)
    console.log("\nUpdating standings for winning team...");
    for (const podId of [32, 27, 34]) {
      const existing = await db
        .select()
        .from(poolStandings)
        .where(eq(poolStandings.podId, podId));

      if (existing.length > 0) {
        await db
          .update(poolStandings)
          .set({
            wins: existing[0].wins + 1,
            pointsFor: existing[0].pointsFor + 25,
            pointsAgainst: existing[0].pointsAgainst + 21,
          })
          .where(eq(poolStandings.podId, podId));
      } else {
        await db.insert(poolStandings).values({
          podId,
          wins: 1,
          losses: 0,
          pointsFor: 25,
          pointsAgainst: 21,
        });
      }
      console.log(`  ✓ Updated Pod ${podId}`);
    }

    console.log("\n✅ Third match added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding match:", error);
    process.exit(1);
  }
}

addMatch3();
