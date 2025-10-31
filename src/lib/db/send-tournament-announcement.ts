/**
 * Send tournament announcement email to all registered participants
 * Run with: npx tsx --env-file=.env.local src/lib/db/send-tournament-announcement.ts
 */

/* eslint-disable no-console */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { db } from "./index";
import { pods } from "./schema";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { TournamentAnnouncementEmail } from "../emails/tournament-announcement";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTournamentAnnouncement() {
  console.log("🏐 Sending tournament announcement emails...\n");

  try {
    // Fetch all registered pods
    const allPods = await db.select().from(pods);

    if (allPods.length === 0) {
      console.log("❌ No registered pods found");
      process.exit(1);
    }

    console.log(`📧 Found ${allPods.length} registered pods\n`);

    let successCount = 0;
    let errorCount = 0;

    // Send email to each pod
    for (const pod of allPods) {
      const { email, player1, teamName, name } = pod;
      const finalTeamName = teamName || name;

      console.log(`Sending to: ${email} (${finalTeamName})...`);

      try {
        // Render the email template
        const emailHtml = await render(
          TournamentAnnouncementEmail({
            player1,
          })
        );

        const result = await resend.emails.send({
          from: "Hewwo Pwincess - Two Peas Pod Tournament <tournament@hewwopwincess.com>",
          to: [email],
          subject: "🏐 Tournament Website Live + Important Reminders",
          html: emailHtml,
        });

        console.log(`  ✓ Sent successfully (${result.data?.id || "unknown"})`);
        successCount++;

        // Add a small delay to avoid rate limiting
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
  } catch (error) {
    console.error("❌ Error sending announcements:", error);
    process.exit(1);
  }
}

sendTournamentAnnouncement();
