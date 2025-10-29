/**
 * Update standings based on the test match
 * Run with: npx tsx --env-file=.env.local src/lib/db/update-standings.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { poolStandings } from "./schema";
import { eq } from "drizzle-orm";

async function updateStandings() {
  console.log("📊 Updating pool standings...");

  try {
    // Team A won (pods 1, 2, 3): 25-23
    const winningPods = [1, 2, 3];
    const losingPods = [4, 5, 6];

    console.log("\nUpdating winning team (Pods 1, 2, 3)...");
    for (const podId of winningPods) {
      // Check if standing exists
      const existing = await db
        .select()
        .from(poolStandings)
        .where(eq(poolStandings.podId, podId));

      if (existing.length > 0) {
        // Update existing
        await db
          .update(poolStandings)
          .set({
            wins: existing[0].wins + 1,
            pointsFor: existing[0].pointsFor + 25,
            pointsAgainst: existing[0].pointsAgainst + 23,
          })
          .where(eq(poolStandings.podId, podId));
        console.log(`  ✓ Updated Pod ${podId}`);
      } else {
        // Create new
        await db.insert(poolStandings).values({
          podId,
          wins: 1,
          losses: 0,
          pointsFor: 25,
          pointsAgainst: 23,
        });
        console.log(`  ✓ Created standing for Pod ${podId}`);
      }
    }

    console.log("\nUpdating losing team (Pods 4, 5, 6)...");
    for (const podId of losingPods) {
      // Check if standing exists
      const existing = await db
        .select()
        .from(poolStandings)
        .where(eq(poolStandings.podId, podId));

      if (existing.length > 0) {
        // Update existing
        await db
          .update(poolStandings)
          .set({
            losses: existing[0].losses + 1,
            pointsFor: existing[0].pointsFor + 23,
            pointsAgainst: existing[0].pointsAgainst + 25,
          })
          .where(eq(poolStandings.podId, podId));
        console.log(`  ✓ Updated Pod ${podId}`);
      } else {
        // Create new
        await db.insert(poolStandings).values({
          podId,
          wins: 0,
          losses: 1,
          pointsFor: 23,
          pointsAgainst: 25,
        });
        console.log(`  ✓ Created standing for Pod ${podId}`);
      }
    }

    console.log("\n✅ Standings updated successfully!");
    console.log("\n📈 Expected standings:");
    console.log("  Pods 1, 2, 3: 1-0, PF: 25, PA: 23, +/-: +2");
    console.log("  Pods 4, 5, 6: 0-1, PF: 23, PA: 25, +/-: -2");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating standings:", error);
    process.exit(1);
  }
}

updateStandings();
