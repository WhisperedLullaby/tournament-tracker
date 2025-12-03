import { NextResponse } from "next/server";
import { isRegistrationOpen, getPodCount } from "@/lib/db/queries";

export async function GET() {
  // TODO: This will be updated in Phase 4 to accept tournamentId parameter
  const TEMP_TOURNAMENT_ID = 1;

  try {
    const open = await isRegistrationOpen(TEMP_TOURNAMENT_ID);
    const count = await getPodCount(TEMP_TOURNAMENT_ID);

    return NextResponse.json({
      isOpen: open,
      podCount: count,
      maxPods: 9,
    });
  } catch (error) {
    console.error("Error checking registration status:", error);
    return NextResponse.json(
      { error: "Failed to check registration status" },
      { status: 500 }
    );
  }
}
