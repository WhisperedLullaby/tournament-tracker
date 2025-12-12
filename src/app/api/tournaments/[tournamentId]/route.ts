import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tournaments, tournamentRoles } from "@/lib/db/schema";
import { createClient } from "@/lib/auth/server";
import { eq, and } from "drizzle-orm";

interface UpdateTournamentData {
  name?: string;
  date?: string;
  location?: string;
  description?: string;
  maxPods?: number;
  registrationDeadline?: string;
  registrationOpenDate?: string;
  isPublic?: boolean;
  status?: "upcoming" | "active" | "completed";
  poolPlayDescription?: string;
  bracketPlayDescription?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const tournamentIdNum = parseInt(tournamentId);

    if (isNaN(tournamentIdNum)) {
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is organizer of this tournament
    const participantRole = await db.query.tournamentRoles.findFirst({
      where: and(
        eq(tournamentRoles.userId, user.id),
        eq(tournamentRoles.tournamentId, tournamentIdNum)
      ),
    });

    if (!participantRole || participantRole.role !== "organizer") {
      return NextResponse.json(
        { error: "Not authorized to edit this tournament" },
        { status: 403 }
      );
    }

    // Parse request body
    const body: UpdateTournamentData = await request.json();
    const {
      name,
      date,
      location,
      description,
      maxPods,
      registrationDeadline,
      registrationOpenDate,
      isPublic,
      status,
      poolPlayDescription,
      bracketPlayDescription,
    } = body;

    // Validate maxPods if provided
    if (maxPods !== undefined && maxPods < 2) {
      return NextResponse.json(
        { error: "Tournament must allow at least 2 teams" },
        { status: 400 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (date !== undefined) updateData.date = new Date(date);
    if (location !== undefined) updateData.location = location;
    if (description !== undefined)
      updateData.description = description || null;
    if (maxPods !== undefined) updateData.maxPods = maxPods;
    if (registrationDeadline !== undefined)
      updateData.registrationDeadline = registrationDeadline
        ? new Date(registrationDeadline)
        : null;
    if (registrationOpenDate !== undefined)
      updateData.registrationOpenDate = registrationOpenDate
        ? new Date(registrationOpenDate)
        : null;
    if (isPublic !== undefined) updateData.isPublic = isPublic;
    if (status !== undefined) updateData.status = status;
    if (poolPlayDescription !== undefined)
      updateData.poolPlayDescription = poolPlayDescription || null;
    if (bracketPlayDescription !== undefined)
      updateData.bracketPlayDescription = bracketPlayDescription || null;

    // Update tournament
    const [updatedTournament] = await db
      .update(tournaments)
      .set(updateData)
      .where(eq(tournaments.id, tournamentIdNum))
      .returning();

    if (!updatedTournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      tournament: updatedTournament,
      message: "Tournament updated successfully!",
    });
  } catch (error) {
    console.error("Tournament update error:", error);

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while updating the tournament. Please try again.",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  try {
    const { tournamentId } = await params;
    const tournamentIdNum = parseInt(tournamentId);

    if (isNaN(tournamentIdNum)) {
      return NextResponse.json(
        { error: "Invalid tournament ID" },
        { status: 400 }
      );
    }

    // Check authentication
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Check if user is organizer of this tournament
    const participantRole = await db.query.tournamentRoles.findFirst({
      where: and(
        eq(tournamentRoles.userId, user.id),
        eq(tournamentRoles.tournamentId, tournamentIdNum)
      ),
    });

    if (!participantRole || participantRole.role !== "organizer") {
      return NextResponse.json(
        { error: "Not authorized to delete this tournament" },
        { status: 403 }
      );
    }

    // Delete tournament (CASCADE will delete related records via schema definition)
    const [deletedTournament] = await db
      .delete(tournaments)
      .where(eq(tournaments.id, tournamentIdNum))
      .returning();

    if (!deletedTournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tournament deleted successfully!",
    });
  } catch (error) {
    console.error("Tournament deletion error:", error);

    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while deleting the tournament. Please try again.",
      },
      { status: 500 }
    );
  }
}
