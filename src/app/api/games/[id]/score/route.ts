import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { poolMatches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * PATCH /api/games/[id]/score
 * Updates the score for a specific game
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const gameId = parseInt(id);

    if (isNaN(gameId)) {
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
    }

    const body = await request.json();
    const { teamAScore, teamBScore } = body;

    // Validate scores
    if (
      typeof teamAScore !== "number" ||
      typeof teamBScore !== "number" ||
      teamAScore < 0 ||
      teamBScore < 0
    ) {
      return NextResponse.json({ error: "Invalid scores" }, { status: 400 });
    }

    // Get the game
    const games = await db
      .select()
      .from(poolMatches)
      .where(eq(poolMatches.id, gameId))
      .limit(1);

    if (games.length === 0) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const game = games[0];

    // Only allow score updates for in-progress games
    if (game.status !== "in_progress") {
      return NextResponse.json(
        { error: "Can only update scores for in-progress games" },
        { status: 400 }
      );
    }

    // Update the score
    await db
      .update(poolMatches)
      .set({
        teamAScore,
        teamBScore,
        updatedAt: new Date(),
      })
      .where(eq(poolMatches.id, gameId));

    // Fetch the updated game
    const updatedGames = await db
      .select()
      .from(poolMatches)
      .where(eq(poolMatches.id, gameId))
      .limit(1);

    return NextResponse.json({
      success: true,
      game: updatedGames[0],
    });
  } catch (error) {
    console.error("Error updating score:", error);
    return NextResponse.json(
      { error: "Failed to update score" },
      { status: 500 }
    );
  }
}
