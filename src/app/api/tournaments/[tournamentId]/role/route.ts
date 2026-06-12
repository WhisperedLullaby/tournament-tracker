import { NextResponse } from "next/server";
import { getUserTournamentRole, getTournamentBySlug } from "@/lib/db/queries";
import { createClient } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { pods } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;

    // Always derive identity from the session — never trust a client-supplied
    // userId. (A query param here would let any caller read another user's role.)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ role: null });
    }
    const currentUserId = user.id;

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

    // Check if user has registered a team/pod
    const userPod = await db.query.pods.findFirst({
      where: and(
        eq(pods.userId, currentUserId),
        eq(pods.tournamentId, tournamentIdNum)
      ),
    });

    return NextResponse.json({
      role,
      hasRegisteredTeam: !!userPod,
    });
  } catch (error) {
    console.error("Error fetching user tournament role:", error);
    return NextResponse.json(
      { error: "Failed to fetch user role" },
      { status: 500 }
    );
  }
}
