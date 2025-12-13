/**
 * Reset bracket for a tournament - deletes old bracket matches/teams and reinitializes
 * Run with: npx tsx --env-file=.env.local src/lib/db/reset-bracket.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./index";
import { bracketMatches, bracketTeams } from "./schema";
import { eq } from "drizzle-orm";
import {
  createBracketTeamsFromStandings,
  seedBracketMatches,
} from "./queries";

const TOURNAMENT_ID = 7; // Test tournament

async function resetBracket() {
  console.log(`🔄 Resetting bracket for tournament ${TOURNAMENT_ID}...`);

  try {
    // Delete existing bracket matches
    console.log("🗑️  Deleting old bracket matches...");
    await db
      .delete(bracketMatches)
      .where(eq(bracketMatches.tournamentId, TOURNAMENT_ID));

    // Delete existing bracket teams
    console.log("🗑️  Deleting old bracket teams...");
    await db
      .delete(bracketTeams)
      .where(eq(bracketTeams.tournamentId, TOURNAMENT_ID));

    console.log("✅ Old bracket data deleted");

    // Create new bracket teams from standings
    console.log("\n👥 Creating bracket teams from standings...");
    const teams = await createBracketTeamsFromStandings(TOURNAMENT_ID);
    console.log(`✅ Created ${teams.length} teams`);

    // Seed new bracket matches
    console.log("\n🎯 Seeding bracket matches (7-game double elimination)...");
    const matches = await seedBracketMatches(TOURNAMENT_ID);
    console.log(`✅ Created ${matches.length} bracket matches`);

    console.log("\n✅ Bracket reset complete!");
    console.log("\nNew bracket structure:");
    console.log("  Game 1: Team A vs Team C (1st vs 3rd)");
    console.log("  Game 2: Team B vs Team D (2nd vs 4th)");
    console.log("  Game 3: G1 Winner vs G2 Winner");
    console.log("  Game 4: G1 Loser vs G2 Loser");
    console.log("  Game 5: G4 Winner vs G3 Loser");
    console.log("  Game 6: G3 Winner vs G5 Winner (Championship)");
    console.log("  Game 7: G6 rematch if needed");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error resetting bracket:", error);
    process.exit(1);
  }
}

resetBracket();
