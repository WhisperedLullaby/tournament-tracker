import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { tournaments, tournamentRoles } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function GET() {
  try {
    // Get current user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Find tournaments created by this user
    const userTournaments = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.createdBy, user.id));

    if (userTournaments.length === 0) {
      return NextResponse.json({
        message: "No tournaments found created by you",
        userId: user.id,
        email: user.email,
      });
    }

    // Check which tournaments are missing organizer roles
    const fixedRoles = [];

    for (const tournament of userTournaments) {
      // Check if organizer role exists
      const existingRole = await db.query.tournamentRoles.findFirst({
        where: and(
          eq(tournamentRoles.tournamentId, tournament.id),
          eq(tournamentRoles.userId, user.id),
          eq(tournamentRoles.role, "organizer")
        ),
      });

      if (!existingRole) {
        // Create the missing organizer role
        await db.insert(tournamentRoles).values({
          tournamentId: tournament.id,
          userId: user.id,
          role: "organizer",
        });

        fixedRoles.push({
          tournamentId: tournament.id,
          tournamentName: tournament.name,
          tournamentSlug: tournament.slug,
        });
      }
    }

    return NextResponse.json({
      message:
        fixedRoles.length > 0
          ? "Fixed missing organizer roles!"
          : "All organizer roles already exist",
      userId: user.id,
      email: user.email,
      totalTournaments: userTournaments.length,
      fixed: fixedRoles,
    });
  } catch (error) {
    console.error("Error fixing roles:", error);
    return NextResponse.json(
      { error: "Failed to fix roles" },
      { status: 500 }
    );
  }
}
