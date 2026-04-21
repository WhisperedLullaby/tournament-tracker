import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pickupSeries, pickupGames, pickupRegistrations } from "@/lib/db/schema";
import { getPickupSessionById } from "@/lib/db/pickup-queries";
import { and, eq } from "drizzle-orm";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const id = parseInt(sessionId);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }

    const session = await getPickupSessionById(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Find the current active series
    const activeSeries = await db.query.pickupSeries.findFirst({
      where: and(
        eq(pickupSeries.sessionId, id),
        eq(pickupSeries.status, "in_progress")
      ),
    });

    if (!activeSeries) {
      return NextResponse.json({
        sessionId: id,
        sessionTitle: session.title,
        status: session.status,
        activeSeries: null,
      });
    }

    // Get current in-progress game within the series
    const activeGame = await db.query.pickupGames.findFirst({
      where: and(
        eq(pickupGames.seriesId, activeSeries.id),
        eq(pickupGames.status, "in_progress")
      ),
    });

    // Resolve player names for both teams
    const allPlayerIds = [
      ...activeSeries.teamAPlayerIds,
      ...activeSeries.teamBPlayerIds,
    ];

    const playerRegs =
      allPlayerIds.length > 0
        ? await db
            .select({
              id: pickupRegistrations.id,
              displayName: pickupRegistrations.displayName,
              position: pickupRegistrations.position,
            })
            .from(pickupRegistrations)
            .where(eq(pickupRegistrations.sessionId, id))
        : [];

    const playerMap = new Map(playerRegs.map((r) => [r.id, r]));

    const teamA = activeSeries.teamAPlayerIds.map((pid) => playerMap.get(pid)).filter(Boolean);
    const teamB = activeSeries.teamBPlayerIds.map((pid) => playerMap.get(pid)).filter(Boolean);

    return NextResponse.json({
      sessionId: id,
      sessionTitle: session.title,
      status: session.status,
      activeSeries: {
        id: activeSeries.id,
        seriesNumber: activeSeries.seriesNumber,
        teamASeriesWins: activeSeries.teamASeriesWins,
        teamBSeriesWins: activeSeries.teamBSeriesWins,
        teamA,
        teamB,
        activeGame: activeGame
          ? {
              id: activeGame.id,
              gameNumber: activeGame.gameNumber,
              teamAScore: activeGame.teamAScore,
              teamBScore: activeGame.teamBScore,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Scoreboard error:", error);
    return NextResponse.json({ error: "Failed to fetch scoreboard data." }, { status: 500 });
  }
}
