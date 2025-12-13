import { NextResponse } from "next/server";
import { isRegistrationOpen, getPodCount } from "@/lib/db/queries";
import { db } from "@/lib/db";
import { tournaments } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  // TODO: This will be updated in Phase 4 to accept tournamentId parameter
  const TEMP_TOURNAMENT_ID = 1;

  try {
    const tournament = await db.query.tournaments.findFirst({
      where: eq(tournaments.id, TEMP_TOURNAMENT_ID),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    const open = await isRegistrationOpen(TEMP_TOURNAMENT_ID);
    const count = await getPodCount(TEMP_TOURNAMENT_ID);

    return NextResponse.json({
      isOpen: open,
      podCount: count,
      maxPods: tournament.maxPods,
    });
  } catch (error) {
    console.error("Error checking registration status:", error);
    return NextResponse.json(
      { error: "Failed to check registration status" },
      { status: 500 }
    );
  }
}
