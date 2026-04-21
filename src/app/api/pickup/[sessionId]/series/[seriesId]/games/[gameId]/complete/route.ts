import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { pickupSessions, pickupSeries, pickupGames } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { writeSeriesStats } from "@/lib/pickup/stats-writer";

export async function POST(
  _request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      sessionId: string;
      seriesId: string;
      gameId: string;
    }>;
  }
) {
  const { sessionId: sStr, seriesId: srStr, gameId: gStr } = await params;
  const sessionId = parseInt(sStr, 10);
  const seriesId = parseInt(srStr, 10);
  const gameId = parseInt(gStr, 10);
  if (isNaN(sessionId) || isNaN(seriesId) || isNaN(gameId))
    return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await db.query.pickupSessions.findFirst({
    where: eq(pickupSessions.id, sessionId),
  });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.createdBy !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const series = await db.query.pickupSeries.findFirst({
    where: and(eq(pickupSeries.id, seriesId), eq(pickupSeries.sessionId, sessionId)),
  });
  if (!series) return NextResponse.json({ error: "Series not found" }, { status: 404 });
  if (series.status !== "in_progress")
    return NextResponse.json({ error: "Series is not in progress" }, { status: 400 });

  const game = await db.query.pickupGames.findFirst({
    where: and(eq(pickupGames.id, gameId), eq(pickupGames.seriesId, seriesId)),
  });
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (game.status === "completed")
    return NextResponse.json({ error: "Game already completed" }, { status: 400 });

  const teamAWinsGame = game.teamAScore >= game.teamBScore;

  const [updatedGame] = await db
    .update(pickupGames)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(pickupGames.id, gameId))
    .returning();

  const newTeamAWins = series.teamASeriesWins + (teamAWinsGame ? 1 : 0);
  const newTeamBWins = series.teamBSeriesWins + (teamAWinsGame ? 0 : 1);

  const winsNeeded = session.seriesFormat === "best_of_5" ? 3 : 2;
  const seriesComplete = newTeamAWins >= winsNeeded || newTeamBWins >= winsNeeded;
  const winningSide = newTeamAWins >= winsNeeded ? "A" : newTeamBWins >= winsNeeded ? "B" : null;

  let updatedSeries;

  if (seriesComplete && winningSide) {
    const [s] = await db
      .update(pickupSeries)
      .set({
        teamASeriesWins: newTeamAWins,
        teamBSeriesWins: newTeamBWins,
        status: "completed",
        winningSide,
        updatedAt: new Date(),
      })
      .where(eq(pickupSeries.id, seriesId))
      .returning();
    updatedSeries = s;
    await writeSeriesStats(seriesId, sessionId);
  } else {
    const [s] = await db
      .update(pickupSeries)
      .set({
        teamASeriesWins: newTeamAWins,
        teamBSeriesWins: newTeamBWins,
        updatedAt: new Date(),
      })
      .where(eq(pickupSeries.id, seriesId))
      .returning();
    updatedSeries = s;

    const nextGame = await db.query.pickupGames.findFirst({
      where: and(
        eq(pickupGames.seriesId, seriesId),
        eq(pickupGames.status, "pending")
      ),
    });
    if (nextGame) {
      await db
        .update(pickupGames)
        .set({ status: "in_progress", updatedAt: new Date() })
        .where(eq(pickupGames.id, nextGame.id));
    }
  }

  return NextResponse.json({ game: updatedGame, series: updatedSeries, seriesComplete });
}
