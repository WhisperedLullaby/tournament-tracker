/**
 * Send tournament announcement email to all registered participants
 * Run with: npx tsx --env-file=.env.local src/lib/db/send-tournament-announcement.ts <tournament-slug>
 * Example:  npx tsx --env-file=.env.local src/lib/db/send-tournament-announcement.ts two-peas-dec-2025
 */

import { config } from "dotenv";
config({ path: ".env.local" });

import { db } from "./index";
import { pods, tournaments } from "./schema";
import { eq } from "drizzle-orm";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { TournamentAnnouncementEmail } from "../emails/tournament-announcement";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTournamentAnnouncement() {
  const slug = process.argv[2];

  if (!slug) {
    console.error("❌ Tournament slug is required.");
    console.error(
      "Usage: npx tsx --env-file=.env.local src/lib/db/send-tournament-announcement.ts <slug>"
    );
    process.exit(1);
  }

  console.log(`🏐 Sending announcement for tournament: ${slug}\n`);

  // Fetch tournament
  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.slug, slug),
  });

  if (!tournament) {
    console.error(`❌ Tournament not found: ${slug}`);
    process.exit(1);
  }

  console.log(`✓ Tournament: ${tournament.name}`);
  console.log(`  Date: ${new Date(tournament.date).toLocaleDateString()}`);
  console.log(`  Location: ${tournament.location ?? "TBD"}`);
  console.log(`  Start time: ${tournament.startTime ?? "not set"}\n`);

  // Fetch all pods for this tournament
  const allPods = await db
    .select()
    .from(pods)
    .where(eq(pods.tournamentId, tournament.id));

  if (allPods.length === 0) {
    console.log("❌ No registered pods found for this tournament");
    process.exit(1);
  }

  console.log(`📧 Found ${allPods.length} registered pods\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const pod of allPods) {
    const { email, player1, teamName, name } = pod;
    const finalTeamName = teamName || name;

    console.log(`Sending to: ${email} (${finalTeamName})...`);

    try {
      const emailHtml = await render(
        TournamentAnnouncementEmail({
          player1,
          tournamentName: tournament.name,
          tournamentDate: tournament.date,
          slug: tournament.slug,
          location: tournament.location,
          startTime: tournament.startTime,
          estimatedEndTime: tournament.estimatedEndTime,
          poolPlayDescription: tournament.poolPlayDescription,
          bracketPlayDescription: tournament.bracketPlayDescription,
          prizeInfo: tournament.prizeInfo,
        })
      );

      const result = await resend.emails.send({
        from: `${tournament.name} <tournament@hewwopwincess.com>`,
        to: [email],
        subject: `🏐 Tournament Website Live — ${tournament.name}`,
        html: emailHtml,
      });

      console.log(`  ✓ Sent successfully (${result.data?.id ?? "unknown"})`);
      successCount++;

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`  ❌ Failed to send:`, error);
      errorCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log(`✅ Success: ${successCount} emails sent`);
  console.log(`❌ Errors: ${errorCount} emails failed`);
  console.log("=".repeat(50) + "\n");

  process.exit(errorCount > 0 ? 1 : 0);
}

sendTournamentAnnouncement();
