/**
 * Fix test data with correct pod IDs
 * Run with: npx tsx --env-file=.env.local src/lib/db/fix-test-data.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { poolMatches, poolStandings } from "./schema";
import { eq } from "drizzle-orm";

async function fixTestData() {
  console.log("🔧 Fixing test data with correct pod IDs...\n");

  try {
    // Delete the incorrect match
    console.log("Deleting incorrect match...");
    await db.delete(poolMatches).where(eq(poolMatches.id, 9));
    console.log("✓ Deleted match with wrong pod IDs\n");

    // Add correct match: Pods 27, 28, 29 vs 30, 31, 32 - Score: 25-23
    console.log("Adding correct test match...");
    const match = await db
      .insert(poolMatches)
      .values({
        roundNumber: 1,
        teamAPods: [27, 28, 29], // Kelly/Donovan, Tina/Felix, Ground Control
        teamBPods: [30, 31, 32], // Prolapsed Cornhole, Jessie/Brian, Ryan/Tiffany
        teamAScore: 25,
        teamBScore: 23,
        status: "completed",
      })
      .returning();

    console.log("✓ Test match added:");
    console.log(`  Team A: Pods 27, 28, 29`);
    console.log(`  Team B: Pods 30, 31, 32`);
    console.log(`  Score: 25-23`);
    console.log(`  Match ID: ${match[0].id}\n`);

    // Update standings for winning team (27, 28, 29)
    console.log("Updating standings for winning team...");
    for (const podId of [27, 28, 29]) {
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
            pointsAgainst: existing[0].pointsAgainst + 23,
          })
          .where(eq(poolStandings.podId, podId));
      } else {
        await db.insert(poolStandings).values({
          podId,
          wins: 1,
          losses: 0,
          pointsFor: 25,
          pointsAgainst: 23,
        });
      }
      console.log(`  ✓ Updated Pod ${podId}`);
    }

    // Update standings for losing team (30, 31, 32)
    console.log("\nUpdating standings for losing team...");
    for (const podId of [30, 31, 32]) {
      const existing = await db
        .select()
        .from(poolStandings)
        .where(eq(poolStandings.podId, podId));

      if (existing.length > 0) {
        await db
          .update(poolStandings)
          .set({
            losses: existing[0].losses + 1,
            pointsFor: existing[0].pointsFor + 23,
            pointsAgainst: existing[0].pointsAgainst + 25,
          })
          .where(eq(poolStandings.podId, podId));
      } else {
        await db.insert(poolStandings).values({
          podId,
          wins: 0,
          losses: 1,
          pointsFor: 23,
          pointsAgainst: 25,
        });
      }
      console.log(`  ✓ Updated Pod ${podId}`);
    }

    console.log("\n✅ Test data fixed successfully!");
    console.log("\n📈 Expected standings:");
    console.log("  Pods 27, 28, 29: 1-0, PF: 25, PA: 23, +/-: +2");
    console.log("  Pods 30, 31, 32: 0-1, PF: 23, PA: 25, +/-: -2");
    console.log("  Pods 33, 34, 35: 0-0, PF: 0, PA: 0, +/-: 0");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error fixing test data:", error);
    process.exit(1);
  }
}

fixTestData();
