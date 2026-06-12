import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { poolMatches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { requireUser } from "@/lib/auth/api-auth";
import { parseBody, scoreBody } from "@/lib/validation/api";

/**
 * PATCH /api/games/[id]/score
 * Updates the score for a specific game
 */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Scorekeeping is open to any signed-in user (organizer, volunteer, player).
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const { id } = await context.params;
    const gameId = parseInt(id);

    if (isNaN(gameId)) {
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
    }

    const parsed = await parseBody(request, scoreBody);
    if ("response" in parsed) return parsed.response;
    const { teamAScore, teamBScore } = parsed.data;

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
