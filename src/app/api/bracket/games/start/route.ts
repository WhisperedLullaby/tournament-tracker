import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bracketMatches } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";

/**
 * POST /api/bracket/games/start
 * Starts the next pending bracket game
 */
export async function POST() {
  try {
    // Find the next pending game
    const pendingGames = await db
      .select()
      .from(bracketMatches)
      .where(eq(bracketMatches.status, "pending"))
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

    // Update game status to in_progress
    const updated = await db
      .update(bracketMatches)
      .set({
        status: "in_progress",
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
