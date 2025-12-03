/**
 * Create a test tournament for testing the multi-tournament platform
 * Run with: npx tsx --env-file=.env.local src/lib/db/create-test-tournament.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./index";
import { tournaments } from "./schema";

const ADMIN_USER_ID = "a5ae2062-ce59-4b42-9a5a-ebc0040dd35d";

async function createTestTournament() {
  console.log("🎾 Creating test tournament...\n");

  try {
    const testTournament = await db
      .insert(tournaments)
      .values({
        name: "Two Peas in a Pod - December 2025",
        slug: "two-peas-dec-2025",
        date: new Date("2025-12-13T10:00:00"),
        location: "All American FieldHouse, Monroeville, PA",
        description:
          "Draw 2's Bonney and Clyde Volleyball Tournament - Two Peas in a Pod. Double elimination bracket tournament with pool play.",
        status: "upcoming",
        maxPods: 9,
        registrationDeadline: new Date("2025-12-12T23:59:59"),
        registrationOpenDate: new Date("2025-11-01T00:00:00"),
        isPublic: true,
        createdBy: ADMIN_USER_ID,
      })
      .returning();

    console.log("✅ Test tournament created!");
    console.log("   ID:", testTournament[0].id);
    console.log("   Slug:", testTournament[0].slug);
    console.log(
      "   URL: http://localhost:3000/tournaments/" + testTournament[0].slug
    );
    console.log(
      "\n📋 Browse all tournaments: http://localhost:3000/tournaments\n"
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Error creating test tournament:", error);
    process.exit(1);
  }
}

createTestTournament();
