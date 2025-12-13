/**
 * Create a complete test tournament with 12 pods and full schedule
 * Pods will have IDs starting at 6 (non-zero for testing)
 * Scoring: Start at 6, End at 13, Game 3 end at 11, Cap at 20
 * Run with: npx tsx --env-file=.env.local src/lib/db/create-test-tournament.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { tournaments, pods, poolMatches } from "./schema";
import { eq } from "drizzle-orm";

// Test data - various team naming patterns
const TEST_PODS = [
  { player1: "Alice", player2: "Bob", teamName: "The Smashers" },
  { player1: "Charlie", player2: "Diana", teamName: null }, // Just "Charlie & Diana"
  { player1: "Eve", player2: "Frank", teamName: "Net Ninjas" },
  { player1: "Grace", player2: "Henry", teamName: null }, // Just "Grace & Henry"
  { player1: "Ivy", player2: "Jack", teamName: "Ace Spikers" },
  { player1: "Kate", player2: "Leo", teamName: null }, // Just "Kate & Leo"
  { player1: "Mia", player2: "Noah", teamName: "Block Party" },
  { player1: "Olivia", player2: "Paul", teamName: null }, // Just "Olivia & Paul"
  { player1: "Quinn", player2: "Ryan", teamName: "Set It Up" },
  { player1: "Sara", player2: "Tom", teamName: null }, // Just "Sara & Tom"
  { player1: "Uma", player2: "Victor", teamName: "Dig Deep" },
  { player1: "Wendy", player2: "Xavier", teamName: null }, // Just "Wendy & Xavier"
];

// Pool schedule (same as your real tournament)
const POOL_SCHEDULE = [
  {
    gameNumber: 1,
    scheduledTime: "10:00 AM",
    teamAPods: [0, 1, 2],
    teamBPods: [3, 4, 5],
    sittingPods: [6, 7, 8, 9, 10, 11],
  },
  {
    gameNumber: 2,
    scheduledTime: "10:20 AM",
    teamAPods: [6, 7, 8],
    teamBPods: [9, 10, 11],
    sittingPods: [0, 1, 2, 3, 4, 5],
  },
  {
    gameNumber: 3,
    scheduledTime: "10:40 AM",
    teamAPods: [0, 3, 6],
    teamBPods: [1, 4, 7],
    sittingPods: [2, 5, 8, 9, 10, 11],
  },
  {
    gameNumber: 4,
    scheduledTime: "11:00 AM",
    teamAPods: [2, 5, 8],
    teamBPods: [0, 4, 9],
    sittingPods: [1, 3, 6, 7, 10, 11],
  },
  {
    gameNumber: 5,
    scheduledTime: "11:20 AM",
    teamAPods: [1, 6, 10],
    teamBPods: [3, 7, 11],
    sittingPods: [0, 2, 4, 5, 8, 9],
  },
  {
    gameNumber: 6,
    scheduledTime: "11:40 AM",
    teamAPods: [2, 4, 11],
    teamBPods: [0, 5, 10],
    sittingPods: [1, 3, 6, 7, 8, 9],
  },
  {
    gameNumber: 7,
    scheduledTime: "12:00 PM",
    teamAPods: [1, 3, 9],
    teamBPods: [2, 6, 8],
    sittingPods: [0, 4, 5, 7, 10, 11],
  },
  {
    gameNumber: 8,
    scheduledTime: "12:20 PM",
    teamAPods: [4, 7, 10],
    teamBPods: [5, 6, 9],
    sittingPods: [0, 1, 2, 3, 8, 11],
  },
];

async function createTestTournament() {
  console.log("🧪 Creating test tournament...\n");

  try {
    // Create test tournament
    console.log("📋 Creating tournament...");
    const [tournament] = await db
      .insert(tournaments)
      .values({
        name: "TEST TOURNAMENT - Mock Event",
        slug: "test-mock-tournament",
        date: new Date("2025-12-14"),
        location: "Test Gym, Test City",
        description: "This is a test tournament for development and testing purposes.",
        status: "active",
        maxPods: 12,
        registrationDeadline: new Date("2025-12-14"),
        registrationOpenDate: new Date("2025-12-01"),
        isPublic: true,
        createdBy: "test-organizer-id",
        tournamentType: "pod_2",
        bracketStyle: "double_elimination",
        level: "open",
        maxTeams: 12,
        scoringRules: {
          startPoints: 6,
          endPoints: 13,
          game3EndPoints: 11,
          cap: 20,
          winByTwo: true,
        },
        rulesDescription: "Test rules for mock tournament",
        prizeInfo: "Test prize - bragging rights!",
        poolPlayDescription: "12 Pods of 2 Players\nTest pool play format",
        bracketPlayDescription: "4 Teams of 6 Players\nSeeds 1+12+7, 2+11+8, 3+9+6, 4+10+5\nBalanced Team Formation",
        requireAuth: false,
      })
      .returning();

    console.log(`✓ Tournament created: ${tournament.name} (ID: ${tournament.id})\n`);

    // Create 12 test pods
    console.log("👥 Creating 12 test pods...");
    const createdPods: number[] = [];

    for (let i = 0; i < TEST_PODS.length; i++) {
      const podData = TEST_PODS[i];
      const [pod] = await db
        .insert(pods)
        .values({
          tournamentId: tournament.id,
          userId: null,
          email: `test${i + 6}@example.com`,
          name: `${podData.player1} & ${podData.player2}`,
          player1: podData.player1,
          player2: podData.player2,
          teamName: podData.teamName,
        })
        .returning();

      createdPods.push(pod.id);
      const displayName = podData.teamName || `${podData.player1} & ${podData.player2}`;
      console.log(`  ✓ Pod ${pod.id}: ${displayName}`);
    }

    console.log(`\n✓ Created ${createdPods.length} pods (IDs: ${createdPods[0]}-${createdPods[11]})\n`);

    // Create pool schedule
    console.log("📅 Creating pool play schedule...");

    // Clear any existing matches for this tournament
    await db.delete(poolMatches).where(eq(poolMatches.tournamentId, tournament.id));

    for (const game of POOL_SCHEDULE) {
      // Map pod indices to actual pod IDs
      const teamAPods = game.teamAPods.map(idx => createdPods[idx]);
      const teamBPods = game.teamBPods.map(idx => createdPods[idx]);
      const sittingPods = game.sittingPods.map(idx => createdPods[idx]);

      await db.insert(poolMatches).values({
        tournamentId: tournament.id,
        gameNumber: game.gameNumber,
        roundNumber: Math.ceil(game.gameNumber / 2),
        scheduledTime: game.scheduledTime,
        courtNumber: 1,
        teamAPods,
        teamBPods,
        sittingPods,
        teamAScore: 0,
        teamBScore: 0,
        status: "pending",
      });

      console.log(`  ✓ Game ${game.gameNumber}: ${game.scheduledTime}`);
    }

    console.log("\n✅ Test tournament created successfully!");
    console.log("\n📊 Summary:");
    console.log(`  Tournament ID: ${tournament.id}`);
    console.log(`  Tournament Slug: ${tournament.slug}`);
    console.log(`  Pods: ${createdPods.length} (IDs ${createdPods[0]}-${createdPods[11]})`);
    console.log(`  Pool Games: ${POOL_SCHEDULE.length}`);

    // scoringRules is already an object (Drizzle auto-parses JSON columns)
    const scoringRules = typeof tournament.scoringRules === 'string'
      ? JSON.parse(tournament.scoringRules)
      : tournament.scoringRules;
    console.log(`  Scoring:`);
    console.log(`    - Start at: ${scoringRules.startPoints}`);
    console.log(`    - End at: ${scoringRules.endPoints}`);
    console.log(`    - Game 3 ends at: ${scoringRules.game3EndPoints}`);
    console.log(`    - Cap: ${scoringRules.cap}`);
    console.log(`    - Win by 2: ${scoringRules.winByTwo}`);

    console.log("\n🎯 Access the tournament at:");
    console.log(`  http://localhost:3000/tournaments/${tournament.slug}`);
    console.log("\n💡 To make yourself an organizer, run this SQL:");
    console.log(`  INSERT INTO tournament_roles (user_id, tournament_id, role)`);
    console.log(`  VALUES ('YOUR_USER_ID', ${tournament.id}, 'organizer');`);
    console.log("\n🗑️  To delete this test tournament later (CASCADE will delete all related data):");
    console.log(`  DELETE FROM tournaments WHERE id = ${tournament.id};`);

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating test tournament:", error);
    process.exit(1);
  }
}

createTestTournament();
