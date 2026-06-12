import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { poolMatches, tournaments } from "@/lib/db/schema";
import { eq, asc, and } from "drizzle-orm";
import { requireUser } from "@/lib/auth/api-auth";
import { parseBody, tournamentIdBody } from "@/lib/validation/api";

/**
 * POST /api/games/start
 * Starts the next pending game by updating its status to 'in_progress'
 */
export async function POST(request: NextRequest) {
  try {
    // Scorekeeping is open to any signed-in user (organizer, volunteer, player).
    const auth = await requireUser();
    if ("response" in auth) return auth.response;

    const parsed = await parseBody(request, tournamentIdBody);
    if ("response" in parsed) return parsed.response;
    const { tournamentId } = parsed.data;

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

    // Update the game status to in_progress and set scores to start points
    await db
      .update(poolMatches)
      .set({
        status: "in_progress",
        teamAScore: startPoints,
        teamBScore: startPoints,
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
