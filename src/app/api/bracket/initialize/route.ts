import { NextRequest, NextResponse } from "next/server";
import {
  createBracketTeamsFromStandings,
  seedBracketMatches,
  isPoolPlayComplete,
} from "@/lib/db/queries";
import { requireOrganizer } from "@/lib/auth/api-auth";
import { parseBody, tournamentIdBody } from "@/lib/validation/api";

/**
 * POST /api/bracket/initialize
 * Initializes bracket play by creating teams from final standings and seeding matches
 * Should be called when pool play completes
 */
export async function POST(request: NextRequest) {
  try {
    const parsed = await parseBody(request, tournamentIdBody);
    if ("response" in parsed) return parsed.response;
    const { tournamentId } = parsed.data;

    // Destructive setup — organizer only (scorekeepers cannot seed the bracket).
    const auth = await requireOrganizer(tournamentId);
    if ("response" in auth) return auth.response;

    // Check if pool play is complete
    const poolComplete = await isPoolPlayComplete(tournamentId);
    if (!poolComplete) {
      return NextResponse.json(
        { error: "Pool play is not yet complete" },
        { status: 400 }
      );
    }

    // Create bracket teams from final standings
    const teams = await createBracketTeamsFromStandings(tournamentId);

    // Seed bracket matches
    const matches = await seedBracketMatches(tournamentId);

    return NextResponse.json({
      success: true,
      message: "Bracket initialized successfully",
      teams,
      matches,
    });
  } catch (error) {
    console.error("Error initializing bracket:", error);
    return NextResponse.json(
      {
        error: "Failed to initialize bracket",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
