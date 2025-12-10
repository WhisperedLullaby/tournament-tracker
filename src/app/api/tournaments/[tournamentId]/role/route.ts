import { NextResponse } from "next/server";
import { getUserTournamentRole, getTournamentBySlug } from "@/lib/db/queries";
import { createClient } from "@/lib/auth/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    // Get current user from session if userId not provided
    let currentUserId = userId;
    if (!currentUserId) {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        return NextResponse.json({ role: null });
      }
      currentUserId = user.id;
    }

    // Check if tournamentId is numeric (ID) or a slug
    let tournamentIdNum: number;
    if (isNaN(parseInt(tournamentId))) {
      // It's a slug, look up the tournament
      const tournament = await getTournamentBySlug(tournamentId);
      if (!tournament) {
        return NextResponse.json(
          { error: "Tournament not found" },
          { status: 404 }
        );
      }
      tournamentIdNum = tournament.id;
    } else {
      tournamentIdNum = parseInt(tournamentId);
    }

    const role = await getUserTournamentRole(currentUserId, tournamentIdNum);

    return NextResponse.json({ role });
  } catch (error) {
    console.error("Error fetching user tournament role:", error);
    return NextResponse.json(
      { error: "Failed to fetch user role" },
      { status: 500 }
    );
  }
}
