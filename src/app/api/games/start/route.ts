import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { poolMatches } from "@/lib/db/schema";
import { eq, asc, and } from "drizzle-orm";

/**
 * POST /api/games/start
 * Starts the next pending game by updating its status to 'in_progress'
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body to get tournament ID
    const body = await request.json();
    const { tournamentId } = body;

    if (!tournamentId) {
      return NextResponse.json(
        { error: "Tournament ID is required" },
        { status: 400 }
      );
    }

    // Check if there's already a game in progress for this tournament
    const inProgressGames = await db
      .select()
      .from(poolMatches)
      .where(
        and(
          eq(poolMatches.tournamentId, tournamentId),
          eq(poolMatches.status, "in_progress")
        )
      );

    if (inProgressGames.length > 0) {
      return NextResponse.json(
        { error: "A game is already in progress" },
        { status: 400 }
      );
    }

    // Get the next pending game (lowest game number) for this tournament
    const pendingGames = await db
      .select()
      .from(poolMatches)
      .where(
        and(
          eq(poolMatches.tournamentId, tournamentId),
          eq(poolMatches.status, "pending")
        )
      )
      .orderBy(asc(poolMatches.gameNumber))
      .limit(1);

    if (pendingGames.length === 0) {
      return NextResponse.json(
        { error: "No pending games available" },
        { status: 404 }
      );
    }

    const gameToStart = pendingGames[0];

    // Update the game status to in_progress and reset scores to 0
    await db
      .update(poolMatches)
      .set({
        status: "in_progress",
        teamAScore: 0,
        teamBScore: 0,
        updatedAt: new Date(),
      })
      .where(eq(poolMatches.id, gameToStart.id));

    // Fetch the updated game
    const updatedGame = await db
      .select()
      .from(poolMatches)
      .where(eq(poolMatches.id, gameToStart.id))
      .limit(1);

    return NextResponse.json({
      success: true,
      game: updatedGame[0],
    });
  } catch (error) {
    console.error("Error starting game:", error);
    return NextResponse.json(
      { error: "Failed to start game" },
      { status: 500 }
    );
  }
}
