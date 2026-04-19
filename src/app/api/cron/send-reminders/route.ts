import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tournaments, pods } from "@/lib/db/schema";
import { eq, and, gte, lt } from "drizzle-orm";
import { Resend } from "resend";
import { render } from "@react-email/render";
import { TournamentReminderEmail } from "@/lib/emails/tournament-reminder";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function GET(request: NextRequest) {
  // Verify this request is from Vercel cron
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find all non-test tournaments happening today
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

  const todaysTournaments = await db
    .select()
    .from(tournaments)
    .where(
      and(
        gte(tournaments.date, todayStart),
        lt(tournaments.date, todayEnd),
        eq(tournaments.isTest, false)
      )
    );

  if (todaysTournaments.length === 0) {
    return NextResponse.json({ message: "No tournaments today", sent: 0 });
  }

  let totalSent = 0;
  let totalErrors = 0;
  const results: { tournament: string; sent: number; errors: number }[] = [];

  for (const tournament of todaysTournaments) {
    const allPods = await db
      .select()
      .from(pods)
      .where(eq(pods.tournamentId, tournament.id));

    let sent = 0;
    let errors = 0;

    for (const pod of allPods) {
      try {
        const emailHtml = await render(
          TournamentReminderEmail({
            player1: pod.player1,
            tournamentName: tournament.name,
            tournamentDate: tournament.date,
            slug: tournament.slug,
            location: tournament.location,
            startTime: tournament.startTime,
            estimatedEndTime: tournament.estimatedEndTime,
            prizeInfo: tournament.prizeInfo,
          })
        );

        await resend.emails.send({
          from: `${tournament.name} <tournament@hewwopwincess.com>`,
          to: [pod.email],
          subject: `🏐 Today's the Day — ${tournament.name}`,
          html: emailHtml,
        });

        sent++;
      } catch {
        errors++;
      }
    }

    totalSent += sent;
    totalErrors += errors;
    results.push({ tournament: tournament.name, sent, errors });
  }

  return NextResponse.json({
    message: "Reminders sent",
    totalSent,
    totalErrors,
    results,
  });
}
