/**
 * Convert CSV schedule to JSON format for seeding
 * Run with: npx tsx src/lib/db/convert-csv-to-schedule.ts
 */

/* eslint-disable no-console */

import * as fs from "fs";
import * as path from "path";

interface PoolGame {
  gameNumber: number;
  scheduledTime: string;
  teamAPods: number[];
  teamBPods: number[];
  sittingPods: number[];
  courtNumber: number;
}

function parseCSVSchedule() {
  console.log("📋 Converting CSV schedule to JSON...\n");

  try {
    // Read the CSV file
    const csvPath = path.join(
      process.cwd(),
      "docs",
      "Two Peas Dec'25 Tournament Schedule - Dec'25 (4 teams).csv"
    );
    const csvContent = fs.readFileSync(csvPath, "utf-8");
    const lines = csvContent.split("\n");

    const poolGames: PoolGame[] = [];

    // Parse pool play games (lines 6-13 in the CSV, which are lines 5-12 in 0-indexed array)
    // Start from line 5 (0-indexed), which is game 1
    for (let i = 5; i <= 12; i++) {
      const line = lines[i];
      if (!line || line.trim() === "") continue;

      const columns = line.split(",");

      // Extract game number and time
      const gameNumber = parseInt(columns[0]);
      const scheduledTime = columns[1];

      // Skip if not a valid game row
      if (isNaN(gameNumber) || !scheduledTime) continue;

      // Extract Team A pods (columns 2-4)
      const teamAPods: number[] = [];
      for (let j = 2; j <= 4; j++) {
        const pod = parseInt(columns[j]);
        if (!isNaN(pod)) teamAPods.push(pod);
      }

      // Extract Team B pods (columns 6-8)
      const teamBPods: number[] = [];
      for (let j = 6; j <= 8; j++) {
        const pod = parseInt(columns[j]);
        if (!isNaN(pod)) teamBPods.push(pod);
      }

      // Extract Sitting pods (remaining columns after Team B)
      const sittingPods: number[] = [];
      for (let j = 9; j < columns.length; j++) {
        const pod = parseInt(columns[j]);
        if (!isNaN(pod) && !teamAPods.includes(pod) && !teamBPods.includes(pod)) {
          if (!sittingPods.includes(pod)) {
            sittingPods.push(pod);
          }
        }
      }

      poolGames.push({
        gameNumber,
        scheduledTime,
        teamAPods,
        teamBPods,
        sittingPods,
        courtNumber: 1,
      });

      console.log(
        `✓ Game ${gameNumber}: ${scheduledTime} - Team A: [${teamAPods.join(",")}] vs Team B: [${teamBPods.join(",")}] | Sitting: [${sittingPods.join(",")}]`
      );
    }

    // Create the JSON structure
    const scheduleData = {
      notes: [
        "NOTE: Play times are estimates. If we are ahead of schedule, the next game is allowed to start earlier than its scheduled time!",
        "Check-in & warm-up begins at 9:30AM",
        "Pool play - Random teams, games to 21, win by 2. Each pod plays 4 sets.",
      ],
      poolGames,
    };

    // Write to JSON file
    const jsonPath = path.join(process.cwd(), "src", "data", "pool-schedule.json");
    fs.writeFileSync(jsonPath, JSON.stringify(scheduleData, null, 2), "utf-8");

    console.log("\n✅ Successfully converted CSV to JSON!");
    console.log(`📁 Output file: ${jsonPath}`);
    console.log(`🎯 ${poolGames.length} pool play games converted`);
    console.log(
      "\n💡 Next step: Run the seed script with:\n   npx tsx --env-file=.env.local src/lib/db/seed-pool-schedule.ts"
    );
  } catch (error) {
    console.error("❌ Error converting CSV:", error);
    process.exit(1);
  }
}

parseCSVSchedule();
