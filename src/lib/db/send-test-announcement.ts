/**
 * Send a TEST tournament announcement email to yourself only
 * Run with: npx tsx --env-file=.env.local src/lib/db/send-test-announcement.ts YOUR_EMAIL@example.com
 */

import { config } from "dotenv";

// Load environment variables from .env.local
config({ path: ".env.local" });

import { Resend } from "resend";
import { render } from "@react-email/render";
import { TournamentAnnouncementEmail } from "../emails/tournament-announcement";

const resend = new Resend(process.env.RESEND_API_KEY);

async function sendTestAnnouncement() {
  const testEmail = process.argv[2];

  if (!testEmail) {
    console.log("❌ Please provide your email address");
    console.log(
      "Usage: npx tsx --env-file=.env.local src/lib/db/send-test-announcement.ts your@email.com"
    );
    process.exit(1);
  }

  console.log(`🏐 Sending TEST announcement email to ${testEmail}...\n`);

  try {
    // Render the email template with test data
    const emailHtml = await render(
      TournamentAnnouncementEmail({
        player1: "[Player Name]",
        tournamentName: "Test Tournament",
        tournamentDate: new Date(),
        slug: "test-tournament",
        location: "Test Venue, City, State",
        startTime: "10:00",
        estimatedEndTime: "15:00",
        poolPlayDescription: "4 rounds of pool play",
        bracketPlayDescription: "Double elimination bracket",
        prizeInfo: "Winners get bragging rights!",
      })
    );

    const result = await resend.emails.send({
      from: "Hewwo Pwincess - Tournament <tournament@hewwopwincess.com>",
      to: [testEmail],
      subject: "🏐 TEST - Tournament Website Live",
      html: emailHtml,
    });

    console.log(
      `✅ Test email sent successfully! (${result.data?.id || "unknown"})`
    );
    console.log(`\nCheck your inbox at ${testEmail}\n`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Failed to send test email:", error);
    process.exit(1);
  }
}

sendTestAnnouncement();
