import { NextResponse } from "next/server";
import { getUserTournamentRole } from "@/lib/db/queries";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ role: null });
    }

    const role = await getUserTournamentRole(userId, parseInt(tournamentId));

    return NextResponse.json({ role });
  } catch (error) {
    console.error("Error fetching user tournament role:", error);
    return NextResponse.json(
      { error: "Failed to fetch user role" },
      { status: 500 }
    );
  }
}
