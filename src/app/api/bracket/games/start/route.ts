import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bracketMatches, tournaments } from "@/lib/db/schema";
import { eq, asc, and } from "drizzle-orm";

/**
 * POST /api/bracket/games/start
 * Starts the next pending bracket game
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

    // Fetch tournament to get scoring rules
    const tournament = await db.query.tournaments.findFirst({
      where: eq(tournaments.id, tournamentId),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Get start points from scoring rules
    const scoringRules = typeof tournament.scoringRules === 'string'
      ? JSON.parse(tournament.scoringRules)
      : tournament.scoringRules;
    const startPoints = scoringRules?.startPoints || 0;

    // Find the next pending game for this tournament
    const pendingGames = await db
      .select()
      .from(bracketMatches)
      .where(
        and(
          eq(bracketMatches.tournamentId, tournamentId),
          eq(bracketMatches.status, "pending")
        )
      )
      .orderBy(asc(bracketMatches.gameNumber))
      .limit(1);

    if (pendingGames.length === 0) {
      return NextResponse.json(
        { error: "No pending games available" },
        { status: 404 }
      );
    }

    const game = pendingGames[0];

    // Validate that both teams are assigned
    if (!game.teamAId || !game.teamBId) {
      return NextResponse.json(
        { error: "Cannot start game - teams not yet determined" },
        { status: 400 }
      );
    }

    // Update game status to in_progress and set scores to start points
    const updated = await db
      .update(bracketMatches)
      .set({
        status: "in_progress",
        teamAScore: startPoints,
        teamBScore: startPoints,
        updatedAt: new Date(),
      })
      .where(eq(bracketMatches.id, game.id))
      .returning();

    return NextResponse.json({
      success: true,
      message: "Game started successfully",
      game: updated[0],
    });
  } catch (error) {
    console.error("Error starting bracket game:", error);
    return NextResponse.json(
      {
        error: "Failed to start game",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
