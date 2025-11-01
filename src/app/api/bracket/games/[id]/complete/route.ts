import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bracketMatches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { advanceBracketTeams } from "@/lib/db/queries";

/**
 * POST /api/bracket/games/[id]/complete
 * Marks a bracket game as complete and advances teams to next round
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const gameId = parseInt(id);

    if (isNaN(gameId)) {
      return NextResponse.json({ error: "Invalid game ID" }, { status: 400 });
    }

    // Get the current game
    const games = await db
      .select()
      .from(bracketMatches)
      .where(eq(bracketMatches.id, gameId))
      .limit(1);

    if (games.length === 0) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const game = games[0];

    // Validate that the game is in progress
    if (game.status !== "in_progress") {
      return NextResponse.json(
        { error: "Game is not in progress" },
        { status: 400 }
      );
    }

    // Validate that teams are set
    if (!game.teamAId || !game.teamBId) {
      return NextResponse.json(
        { error: "Game does not have both teams assigned" },
        { status: 400 }
      );
    }

    // Validate that a winner exists
    const { teamAScore, teamBScore } = game;
    const maxScore = Math.max(teamAScore, teamBScore);
    const scoreDiff = Math.abs(teamAScore - teamBScore);

    if (!(maxScore >= 21 && scoreDiff >= 2) && maxScore < 25) {
      return NextResponse.json(
        { error: "Game does not meet completion criteria (21+ with 2 point lead or 25)" },
        { status: 400 }
      );
    }

    // Determine winner and loser
    const winnerId = teamAScore > teamBScore ? game.teamAId : game.teamBId;
    const loserId = teamAScore > teamBScore ? game.teamBId : game.teamAId;

    // Mark game as complete
    await db
      .update(bracketMatches)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(bracketMatches.id, gameId));

    // Advance teams to next round
    await advanceBracketTeams(game.gameNumber, winnerId, loserId);

    return NextResponse.json({
      success: true,
      message: "Game completed successfully",
      winnerId,
      loserId,
    });
  } catch (error) {
    console.error("Error completing bracket game:", error);
    return NextResponse.json(
      {
        error: "Failed to complete game",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
