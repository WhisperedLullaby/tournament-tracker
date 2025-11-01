import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bracketMatches } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/**
 * PATCH /api/bracket/games/[id]/score
 * Updates the score for a bracket match
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
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
      return NextResponse.json(
        { error: "Invalid score values" },
        { status: 400 }
      );
    }

    // Update the match score
    const updated = await db
      .update(bracketMatches)
      .set({
        teamAScore,
        teamBScore,
        updatedAt: new Date(),
      })
      .where(eq(bracketMatches.id, gameId))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      match: updated[0],
    });
  } catch (error) {
    console.error("Error updating bracket game score:", error);
    return NextResponse.json(
      {
        error: "Failed to update score",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
