/**
 * Database seed script for testing the standings page
 * Run with: npx tsx src/lib/db/seed.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { pods, poolStandings, poolMatches } from "./schema";

async function seed() {
  console.log("🌱 Seeding database...");

  try {
    // Clear existing data
    console.log("Clearing existing data...");
    await db.delete(poolMatches);
    await db.delete(poolStandings);
    await db.delete(pods);

    // Seed 9 pods
    console.log("Creating 9 pods...");
    const podData = [
      {
        email: "spike.masters@email.com",
        name: "Mike & Sarah",
        player1: "Mike Johnson",
        player2: "Sarah Williams",
        teamName: "Spike Masters",
      },
      {
        email: "net.ninjas@email.com",
        name: "Alex & Jordan",
        player1: "Alex Chen",
        player2: "Jordan Lee",
        teamName: "Net Ninjas",
      },
      {
        email: "block.party@email.com",
        name: "Emma & Chris",
        player1: "Emma Davis",
        player2: "Chris Martinez",
        teamName: "Block Party",
      },
      {
        email: "ace.attackers@email.com",
        name: "Taylor & Morgan",
        player1: "Taylor Brown",
        player2: "Morgan Smith",
        teamName: "Ace Attackers",
      },
      {
        email: "set.point@email.com",
        name: "Riley & Casey",
        player1: "Riley Anderson",
        player2: "Casey Thompson",
        teamName: "Set Point",
      },
      {
        email: "bump.squad@email.com",
        name: "Jamie & Pat",
        player1: "Jamie Wilson",
        player2: "Pat Garcia",
        teamName: "Bump Squad",
      },
      {
        email: "dig.deep@email.com",
        name: "Sam & Dakota",
        player1: "Sam Rodriguez",
        player2: "Dakota Miller",
        teamName: "Dig Deep",
      },
      {
        email: "volley.vibes@email.com",
        name: "Avery & Quinn",
        player1: "Avery Moore",
        player2: "Quinn Jackson",
        teamName: "Volley Vibes",
      },
      {
        email: "serve.squad@email.com",
        name: "Skylar & Reese",
        player1: "Skylar White",
        player2: "Reese Martin",
        teamName: "Serve Squad",
      },
    ];

    const insertedPods = await db.insert(pods).values(podData).returning();
    console.log(`✓ Created ${insertedPods.length} pods`);

    // Create pool standings for each pod with varied stats
    console.log("Creating pool standings...");
    const standingsData = [
      // Spike Masters - 1st place
      {
        podId: insertedPods[0].id,
        wins: 4,
        losses: 0,
        pointsFor: 100,
        pointsAgainst: 72,
      },
      // Net Ninjas - 2nd place
      {
        podId: insertedPods[1].id,
        wins: 3,
        losses: 1,
        pointsFor: 95,
        pointsAgainst: 78,
      },
      // Block Party - 3rd place
      {
        podId: insertedPods[2].id,
        wins: 3,
        losses: 1,
        pointsFor: 92,
        pointsAgainst: 80,
      },
      // Ace Attackers - 4th place
      {
        podId: insertedPods[3].id,
        wins: 2,
        losses: 2,
        pointsFor: 88,
        pointsAgainst: 85,
      },
      // Set Point - 5th place
      {
        podId: insertedPods[4].id,
        wins: 2,
        losses: 2,
        pointsFor: 82,
        pointsAgainst: 82,
      },
      // Bump Squad - 6th place
      {
        podId: insertedPods[5].id,
        wins: 2,
        losses: 2,
        pointsFor: 85,
        pointsAgainst: 90,
      },
      // Dig Deep - 7th place
      {
        podId: insertedPods[6].id,
        wins: 1,
        losses: 3,
        pointsFor: 75,
        pointsAgainst: 88,
      },
      // Volley Vibes - 8th place
      {
        podId: insertedPods[7].id,
        wins: 1,
        losses: 3,
        pointsFor: 70,
        pointsAgainst: 90,
      },
      // Serve Squad - 9th place
      {
        podId: insertedPods[8].id,
        wins: 0,
        losses: 4,
        pointsFor: 65,
        pointsAgainst: 100,
      },
    ];

    await db.insert(poolStandings).values(standingsData);
    console.log(`✓ Created ${standingsData.length} pool standings`);

    // Create some completed pool matches
    console.log("Creating pool matches...");
    const matchesData = [
      // Round 1
      {
        roundNumber: 1,
        teamAPods: [insertedPods[0].id, insertedPods[1].id, insertedPods[2].id], // Spike Masters, Net Ninjas, Block Party
        teamBPods: [insertedPods[3].id, insertedPods[4].id, insertedPods[5].id], // Ace Attackers, Set Point, Bump Squad
        teamAScore: 25,
        teamBScore: 21,
        status: "completed" as const,
      },
      {
        roundNumber: 1,
        teamAPods: [insertedPods[6].id, insertedPods[7].id, insertedPods[8].id], // Dig Deep, Volley Vibes, Serve Squad
        teamBPods: [insertedPods[0].id, insertedPods[3].id, insertedPods[6].id], // Mixed teams
        teamAScore: 18,
        teamBScore: 25,
        status: "completed" as const,
      },
      // Round 2
      {
        roundNumber: 2,
        teamAPods: [insertedPods[0].id, insertedPods[2].id, insertedPods[4].id], // Spike Masters, Block Party, Set Point
        teamBPods: [insertedPods[1].id, insertedPods[3].id, insertedPods[5].id], // Net Ninjas, Ace Attackers, Bump Squad
        teamAScore: 25,
        teamBScore: 19,
        status: "completed" as const,
      },
      {
        roundNumber: 2,
        teamAPods: [insertedPods[6].id, insertedPods[7].id, insertedPods[8].id], // Dig Deep, Volley Vibes, Serve Squad
        teamBPods: [insertedPods[0].id, insertedPods[1].id, insertedPods[2].id], // Top 3 teams
        teamAScore: 16,
        teamBScore: 25,
        status: "completed" as const,
      },
      // Round 3
      {
        roundNumber: 3,
        teamAPods: [insertedPods[0].id, insertedPods[1].id, insertedPods[3].id], // Spike Masters, Net Ninjas, Ace Attackers
        teamBPods: [insertedPods[2].id, insertedPods[4].id, insertedPods[6].id], // Block Party, Set Point, Dig Deep
        teamAScore: 25,
        teamBScore: 22,
        status: "completed" as const,
      },
      {
        roundNumber: 3,
        teamAPods: [insertedPods[5].id, insertedPods[7].id, insertedPods[8].id], // Bump Squad, Volley Vibes, Serve Squad
        teamBPods: [insertedPods[0].id, insertedPods[2].id, insertedPods[3].id], // Top performers
        teamAScore: 20,
        teamBScore: 25,
        status: "completed" as const,
      },
      // Round 4
      {
        roundNumber: 4,
        teamAPods: [insertedPods[0].id, insertedPods[3].id, insertedPods[6].id], // Spike Masters, Ace Attackers, Dig Deep
        teamBPods: [insertedPods[1].id, insertedPods[4].id, insertedPods[7].id], // Net Ninjas, Set Point, Volley Vibes
        teamAScore: 25,
        teamBScore: 20,
        status: "completed" as const,
      },
      {
        roundNumber: 4,
        teamAPods: [insertedPods[2].id, insertedPods[5].id, insertedPods[8].id], // Block Party, Bump Squad, Serve Squad
        teamBPods: [insertedPods[0].id, insertedPods[1].id, insertedPods[6].id], // Mixed teams
        teamAScore: 22,
        teamBScore: 25,
        status: "completed" as const,
      },
    ];

    await db.insert(poolMatches).values(matchesData);
    console.log(`✓ Created ${matchesData.length} pool matches`);

    console.log("✅ Database seeding completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

seed();
