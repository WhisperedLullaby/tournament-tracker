import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { poolMatches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { updatePoolStandings } from "@/lib/db/standings";

/**
 * POST /api/games/[id]/complete
 * Completes a game and updates standings
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const gameId = parseInt(id);

    if (isNaN(gameId)) {
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
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

    // Only allow completing in-progress games
    if (game.status !== "in_progress") {
      return NextResponse.json(
        { error: "Can only complete in-progress games" },
        { status: 400 }
      );
    }

    // Validate that the game has a valid ending score
    const teamAScore = game.teamAScore;
    const teamBScore = game.teamBScore;
    const scoreDiff = Math.abs(teamAScore - teamBScore);
    const maxScore = Math.max(teamAScore, teamBScore);

    // Check win conditions: score >= 21 and win by 2, OR score cap of 25
    const validWin =
      (maxScore >= 21 && scoreDiff >= 2) || // Win by 2 at 21+
      maxScore >= 25; // Score cap

    if (!validWin) {
      return NextResponse.json(
        {
          error:
            "Invalid game completion: must reach 21 and win by 2, or reach score cap of 25",
        },
        { status: 400 }
      );
    }

    // Update game status to completed
    await db
      .update(poolMatches)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(poolMatches.id, gameId));

    // Update pool standings for all involved pods
    const teamAPods = game.teamAPods as number[];
    const teamBPods = game.teamBPods as number[];
    await updatePoolStandings(game.tournamentId, teamAPods, teamBPods, teamAScore, teamBScore);

    // Fetch the updated game
    const updatedGames = await db
      .select()
      .from(poolMatches)
      .where(eq(poolMatches.id, gameId))
      .limit(1);

    return NextResponse.json({
      success: true,
      game: updatedGames[0],
      standingsUpdated: true,
    });
  } catch (error) {
    console.error("Error completing game:", error);
    return NextResponse.json(
      { error: "Failed to complete game" },
      { status: 500 }
    );
  }
}
