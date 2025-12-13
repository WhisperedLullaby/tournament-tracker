import { config } from "dotenv";
import { resolve } from "path";

// Load environment variables from .env.local
config({ path: resolve(process.cwd(), ".env.local") });

import { db } from "./index";
import { tournaments } from "./schema";
import { getTemplateForType, type TournamentType } from "@/lib/tournament-templates";

/**
 * Validation Script: Tournament Content Display
 *
 * This script queries all tournaments and shows what content
 * will be displayed for each, helping verify smart fallbacks work correctly.
 */

async function validateTournamentContent() {
  console.log("🔍 Validating Tournament Content Display\n");
  console.log("=" .repeat(80));

  try {
    // Fetch all tournaments
    const allTournaments = await db.select().from(tournaments);

    if (allTournaments.length === 0) {
      console.log("\n⚠️  No tournaments found in database");
      return;
    }

    console.log(`\nFound ${allTournaments.length} tournament(s)\n`);

    // Analyze each tournament
    allTournaments.forEach((tournament, index) => {
      console.log(`\n${index + 1}. Tournament: "${tournament.name}"`);
      console.log(`   Slug: ${tournament.slug}`);
      console.log(`   Type: ${tournament.tournamentType}`);
      console.log(`   Status: ${tournament.status}`);
      console.log("-".repeat(80));

      // Get template for this tournament type
      const template = getTemplateForType(tournament.tournamentType as TournamentType);

      // Check Pool Play Description
      console.log("\n   📋 POOL PLAY:");
      if (tournament.poolPlayDescription) {
        console.log(`   ✓ Custom content (${tournament.poolPlayDescription.length} chars)`);
        console.log(`   Preview: "${tournament.poolPlayDescription.substring(0, 60)}..."`);
      } else {
        console.log(`   ⚠ Using fallback (${tournament.tournamentType} template)`);
        console.log(`   Preview: "${template.poolPlay.substring(0, 60)}..."`);
      }

      // Check Bracket Play Description
      console.log("\n   🏆 BRACKET PLAY:");
      if (tournament.bracketPlayDescription) {
        console.log(`   ✓ Custom content (${tournament.bracketPlayDescription.length} chars)`);
        console.log(`   Preview: "${tournament.bracketPlayDescription.substring(0, 60)}..."`);
      } else {
        console.log(`   ⚠ Using fallback (${tournament.tournamentType} template)`);
        console.log(`   Preview: "${template.bracketPlay.substring(0, 60)}..."`);
      }

      // Show what will actually be displayed
      const displayedPoolPlay = tournament.poolPlayDescription || template.poolPlay;
      const displayedBracketPlay = tournament.bracketPlayDescription || template.bracketPlay;

      console.log("\n   🎨 FINAL DISPLAY:");
      console.log(`   Pool Play: ${displayedPoolPlay.split('\n')[0]}...`);
      console.log(`   Bracket Play: ${displayedBracketPlay.split('\n')[0]}...`);

      console.log("\n" + "=".repeat(80));
    });

    // Summary
    console.log("\n📊 SUMMARY:");
    const customCount = allTournaments.filter(t => t.poolPlayDescription && t.bracketPlayDescription).length;
    const fallbackCount = allTournaments.length - customCount;

    console.log(`   Total Tournaments: ${allTournaments.length}`);
    console.log(`   With Custom Content: ${customCount}`);
    console.log(`   Using Fallbacks: ${fallbackCount}`);

    // Breakdown by type
    console.log("\n   By Tournament Type:");
    const byType = allTournaments.reduce((acc, t) => {
      acc[t.tournamentType] = (acc[t.tournamentType] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    Object.entries(byType).forEach(([type, count]) => {
      console.log(`   - ${type}: ${count}`);
    });

    console.log("\n✅ Validation complete!\n");

  } catch (error) {
    console.error("❌ Error validating tournament content:", error);
    throw error;
  }
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateTournamentContent()
    .then(() => {
      console.log("Done!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Validation failed:", error);
      process.exit(1);
    });
}

export { validateTournamentContent };
