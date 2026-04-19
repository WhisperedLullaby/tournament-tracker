/**
 * Seed the pool play schedule into the database
 * Loads all 6 games from the JSON schedule data
 * Run with: npx tsx --env-file=.env.local src/lib/db/seed-pool-schedule.ts
 */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { poolMatches } from "./schema";
import * as fs from "fs";
import * as path from "path";

// Configure this to match your tournament ID
const TOURNAMENT_ID = 6;

async function seedPoolSchedule() {
  console.log("🏐 Seeding pool play schedule...\n");

  try {
    // Load the schedule from JSON
    const scheduleFilePath = path.join(
      process.cwd(),
      "src",
      "data",
      "pool-schedule.json"
    );
    const scheduleData = JSON.parse(fs.readFileSync(scheduleFilePath, "utf-8"));

    console.log(`Found ${scheduleData.poolGames.length} games in schedule\n`);

    // Clear existing pool matches (optional - comment out if you want to keep existing data)
    console.log("⚠️  Clearing existing pool matches...");
    await db.delete(poolMatches);
    console.log("✓ Cleared existing matches\n");

    // Insert each game
    for (const game of scheduleData.poolGames) {
      await db.insert(poolMatches).values({
        tournamentId: TOURNAMENT_ID,
        gameNumber: game.gameNumber,
        roundNumber: Math.ceil(game.gameNumber / 1.5), // Approximate round number
        scheduledTime: game.scheduledTime,
        courtNumber: game.courtNumber,
        teamAPods: game.teamAPods,
        teamBPods: game.teamBPods,
        sittingPods: game.sittingPods,
        teamAScore: 0,
        teamBScore: 0,
        status: "pending",
      });

      console.log(
        `✓ Game ${game.gameNumber}: ${game.scheduledTime} - Pods ${game.teamAPods.join(",")} vs ${game.teamBPods.join(",")}`
      );
    }

    console.log("\n✅ Pool play schedule seeded successfully!");
    console.log(`📅 ${scheduleData.poolGames.length} games added to database`);
    console.log("💡 All games are set to 'pending' status with 0-0 scores");
    console.log("\n🎯 To start a game, update its status to 'in_progress'");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding schedule:", error);
    process.exit(1);
  }
}

seedPoolSchedule();
