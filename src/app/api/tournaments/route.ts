import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tournaments, tournamentRoles } from "@/lib/db/schema";
import { createClient } from "@/lib/auth/server";
import { isWhitelistedOrganizer } from "@/lib/db/queries";

interface TournamentData {
  name: string;
  slug: string;
  date: string;
  location: string;
  description: string;

  // Tournament Configuration
  tournamentType: "pod_2" | "pod_3" | "set_teams";
  bracketStyle: "single_elimination" | "double_elimination";
  level: "c" | "b" | "a" | "open";
  maxPods: number;
  maxTeams: number;

  // Scoring Rules
  startPoints: number;
  endPoints: number;
  winByTwo: boolean;
  cap: number | null;
  game3EndPoints: number | null;

  // Dynamic Content
  poolPlayDescription: string;
  bracketPlayDescription: string;
  rulesDescription: string;
  prizeInfo: string;

  // Registration & Visibility
  registrationDeadline: string;
  registrationOpenDate: string;
  isPublic: boolean;
  status: "upcoming" | "active" | "completed";
}

export async function POST(request: NextRequest) {
  try {
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

    // Check if user is whitelisted organizer
    const isOrganizer = await isWhitelistedOrganizer(user.id);
    if (!isOrganizer) {
      return NextResponse.json(
        { error: "Not authorized to create tournaments" },
        { status: 403 }
      );
    }

    // Parse request body
    const body: TournamentData = await request.json();
    const {
      name,
      slug,
      date,
      location,
      description,
      tournamentType,
      bracketStyle,
      level,
      maxPods,
      maxTeams,
      startPoints,
      endPoints,
      winByTwo,
      cap,
      game3EndPoints,
      poolPlayDescription,
      bracketPlayDescription,
      rulesDescription,
      prizeInfo,
      registrationDeadline,
      registrationOpenDate,
      isPublic,
      status,
    } = body;

    // Validate required fields
    if (!name || !slug || !date || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Invalid slug format. Use lowercase letters, numbers, and hyphens only." },
        { status: 400 }
      );
    }

    // Check if slug is already taken
    const existingTournament = await db.query.tournaments.findFirst({
      where: (tournaments, { eq }) => eq(tournaments.slug, slug),
    });

    if (existingTournament) {
      return NextResponse.json(
        { error: "This URL slug is already taken. Please choose a different one." },
        { status: 400 }
      );
    }

    // Validate maxPods
    if (maxPods < 2) {
      return NextResponse.json(
        { error: "Tournament must allow at least 2 teams" },
        { status: 400 }
      );
    }

    // Create tournament
    const [newTournament] = await db
      .insert(tournaments)
      .values({
        name,
        slug,
        date: new Date(date),
        location,
        description: description || null,

        // Tournament Configuration
        tournamentType,
        bracketStyle,
        level,
        maxPods,
        maxTeams,

        // Scoring Rules as JSON
        scoringRules: {
          startPoints,
          endPoints,
          winByTwo,
          ...(cap !== null && { cap }),
          ...(game3EndPoints !== null && { game3EndPoints }),
        },

        // Dynamic Content
        poolPlayDescription: poolPlayDescription || null,
        bracketPlayDescription: bracketPlayDescription || null,
        rulesDescription: rulesDescription || null,
        prizeInfo: prizeInfo || null,

        // Registration & Visibility
        registrationDeadline: registrationDeadline
          ? new Date(registrationDeadline)
          : null,
        registrationOpenDate: registrationOpenDate
          ? new Date(registrationOpenDate)
          : null,
        isPublic,
        status,
        createdBy: user.id,
      })
      .returning();

    // Add creator as organizer
    await db.insert(tournamentRoles).values({
      userId: user.id,
      tournamentId: newTournament.id,
      role: "organizer",
    });

    return NextResponse.json(
      {
        success: true,
        tournament: newTournament,
        message: "Tournament created successfully!",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Tournament creation error:", error);

    // Check if it's a unique constraint violation
    if (error instanceof Error && error.message.includes("unique constraint")) {
      return NextResponse.json(
        { error: "A tournament with this slug already exists." },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred while creating the tournament. Please try again.",
      },
      { status: 500 }
    );
  }
}
