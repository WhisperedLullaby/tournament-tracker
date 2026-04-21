import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { pickupSessions, pickupRegistrations, pickupSeries, pickupGames } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { generateLineup } from "@/lib/pickup/lineup-generator";
import type { PickupRegistration } from "@/lib/db/schema";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId: sessionIdStr } = await params;
  const sessionId = parseInt(sessionIdStr, 10);
  if (isNaN(sessionId)) return NextResponse.json({ error: "Invalid session" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await db.query.pickupSessions.findFirst({
    where: eq(pickupSessions.id, sessionId),
  });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.createdBy !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!["attendance", "active"].includes(session.status))
    return NextResponse.json({ error: "Session must be in attendance or active status" }, { status: 400 });

  // Get attendees only
  const attendees = await db
    .select()
    .from(pickupRegistrations)
    .where(
      and(
        eq(pickupRegistrations.sessionId, sessionId),
        eq(pickupRegistrations.status, "attended")
      )
    );

  if (attendees.length < 2)
    return NextResponse.json({ error: "Need at least 2 attendees to generate lineups" }, { status: 400 });

  const nextSeriesNumber = session.currentSeriesNumber + 1;
  const lineup = generateLineup(attendees as PickupRegistration[], sessionId, nextSeriesNumber);

  // Determine how many games to pre-create
  const maxGames = session.seriesFormat === "best_of_5" ? 5 : 3;

  const [newSeries] = await db
    .insert(pickupSeries)
    .values({
      sessionId,
      seriesNumber: nextSeriesNumber,
      status: "pending",
      teamAPlayerIds: lineup.teamA,
      teamBPlayerIds: lineup.teamB,
      benchPlayerIds: lineup.bench,
      teamASeriesWins: 0,
      teamBSeriesWins: 0,
      winningSide: null,
    })
    .returning();

  // Pre-create game rows
  const gameRows = Array.from({ length: maxGames }, (_, i) => ({
    seriesId: newSeries.id,
    sessionId,
    gameNumber: i + 1,
    teamAScore: 0,
    teamBScore: 0,
    status: "pending" as const,
  }));
  await db.insert(pickupGames).values(gameRows);

  // Increment currentSeriesNumber on session + transition to active
  await db
    .update(pickupSessions)
    .set({
      currentSeriesNumber: nextSeriesNumber,
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(pickupSessions.id, sessionId));

  return NextResponse.json({ series: newSeries, lineup });
}
