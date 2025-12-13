// Load environment variables FIRST before any other imports
import { config } from "dotenv";
import { resolve } from "path";
config({ path: resolve(process.cwd(), ".env.local") });

// Now import after env is loaded
import { db } from "./index";
import { tournaments, tournamentRoles } from "./schema";

async function checkTournamentRoles() {
  console.log("🔍 Checking tournaments and roles...\n");

  try {
    // Get all tournaments
    const allTournaments = await db.select().from(tournaments);
    console.log("=== TOURNAMENTS ===");
    allTournaments.forEach((t) => {
      console.log(`ID: ${t.id}`);
      console.log(`  Name: ${t.name}`);
      console.log(`  Slug: ${t.slug}`);
      console.log(`  CreatedBy: ${t.createdBy}`);
      console.log("");
    });

    // Get all roles
    const allRoles = await db.select().from(tournamentRoles);
    console.log("\n=== TOURNAMENT ROLES ===");
    if (allRoles.length === 0) {
      console.log("⚠️  No roles found in database!");
    } else {
      allRoles.forEach((r) => {
        console.log(`Tournament ID: ${r.tournamentId}`);
        console.log(`  User ID: ${r.userId}`);
        console.log(`  Role: ${r.role}`);
        console.log("");
      });
    }

    console.log("\n=== ANALYSIS ===");
    allTournaments.forEach((t) => {
      const hasRole = allRoles.some((r) => r.tournamentId === t.id && r.userId === t.createdBy);
      if (!hasRole) {
        console.log(`⚠️  Tournament "${t.name}" (ID: ${t.id}) has no organizer role for creator ${t.createdBy}`);
      }
    });

  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  checkTournamentRoles()
    .then(() => {
      console.log("\n✅ Check complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Failed:", error);
      process.exit(1);
    });
}

export { checkTournamentRoles };
