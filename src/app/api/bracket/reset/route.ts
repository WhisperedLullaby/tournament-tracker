import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { bracketMatches, bracketTeams } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import {
  createBracketTeamsFromStandings,
  seedBracketMatches,
} from "@/lib/db/queries";

/**
 * POST /api/bracket/reset
 * Resets bracket for a tournament - deletes old data and reinitializes with new 7-game structure
 * Body: { tournamentId: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tournamentId } = body;

    if (!tournamentId) {
      return NextResponse.json(
        { error: "Tournament ID is required" },
        { status: 400 }
      );
    }

    // Delete existing bracket matches
    await db
      .delete(bracketMatches)
      .where(eq(bracketMatches.tournamentId, tournamentId));

    // Delete existing bracket teams
    await db
      .delete(bracketTeams)
      .where(eq(bracketTeams.tournamentId, tournamentId));

    // Create new bracket teams from standings
    const teams = await createBracketTeamsFromStandings(tournamentId);

    // Seed new bracket matches
    const matches = await seedBracketMatches(tournamentId);

    return NextResponse.json({
      success: true,
      message: "Bracket reset successfully",
      teamsCreated: teams.length,
      matchesCreated: matches.length,
    });
  } catch (error) {
    console.error("Error resetting bracket:", error);
    return NextResponse.json(
      {
        error: "Failed to reset bracket",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
