/**
 * Add second test match
 * Pods 33, 34, 31 vs 29, 30, 35 - Score: 25-13
 * Run with: npx tsx --env-file=.env.local src/lib/db/add-match-2.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { poolMatches, poolStandings } from "./schema";
import { eq } from "drizzle-orm";

// Configure this to match your tournament ID
const TOURNAMENT_ID = 1;

async function addMatch2() {
  console.log("🏐 Adding second test match...\n");

  try {
    // Add match: Pods 33, 34, 31 vs 29, 30, 35 - Score: 25-13
    const match = await db
      .insert(poolMatches)
      .values({
        tournamentId: TOURNAMENT_ID,
        gameNumber: 2,
        roundNumber: 2,
        scheduledTime: "10:20 AM",
        courtNumber: 1,
        teamAPods: [33, 34, 31], // Pip's penguins, Dana/Hayden, Jessie/Brian
        teamBPods: [29, 30, 35], // Ground Control, Prolapsed Cornhole, Fairly Spiked
        sittingPods: [27, 28, 32],
        teamAScore: 25,
        teamBScore: 13,
        status: "completed",
      })
      .returning();

    console.log("✓ Test match added:");
    console.log(`  Team A: Pods 33, 34, 31`);
    console.log(`  Team B: Pods 29, 30, 35`);
    console.log(`  Score: 25-13`);
    console.log(`  Match ID: ${match[0].id}\n`);

    // Update standings for winning team (33, 34, 31)
    console.log("Updating standings for winning team...");
    for (const podId of [33, 34, 31]) {
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
            pointsAgainst: existing[0].pointsAgainst + 13,
          })
          .where(eq(poolStandings.podId, podId));
      } else {
        await db.insert(poolStandings).values({
          tournamentId: TOURNAMENT_ID,
          podId,
          wins: 1,
          losses: 0,
          pointsFor: 25,
          pointsAgainst: 13,
        });
      }
      console.log(`  ✓ Updated Pod ${podId}`);
    }

    // Update standings for losing team (29, 30, 35)
    console.log("\nUpdating standings for losing team...");
    for (const podId of [29, 30, 35]) {
      const existing = await db
        .select()
        .from(poolStandings)
        .where(eq(poolStandings.podId, podId));

      if (existing.length > 0) {
        await db
          .update(poolStandings)
          .set({
            losses: existing[0].losses + 1,
            pointsFor: existing[0].pointsFor + 13,
            pointsAgainst: existing[0].pointsAgainst + 25,
          })
          .where(eq(poolStandings.podId, podId));
      } else {
        await db.insert(poolStandings).values({
          tournamentId: TOURNAMENT_ID,
          podId,
          wins: 0,
          losses: 1,
          pointsFor: 13,
          pointsAgainst: 25,
        });
      }
      console.log(`  ✓ Updated Pod ${podId}`);
    }

    console.log("\n✅ Second match added successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error adding match:", error);
    process.exit(1);
  }
}

addMatch2();
