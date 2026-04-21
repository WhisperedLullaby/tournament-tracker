import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pickupSessions } from "@/lib/db/schema";
import { createClient } from "@/lib/auth/server";
import { isWhitelistedOrganizer, isAdminUser } from "@/lib/db/queries";
import { getAllPickupSessions } from "@/lib/db/pickup-queries";
import { eq } from "drizzle-orm";

interface CreatePickupSessionData {
  title: string;
  slug: string;
  date: string;
  startTime?: string;
  estimatedEndTime?: string;
  location?: string;
  description?: string;
  totalCapacity: number;
  seriesFormat: "best_of_3" | "best_of_5";
  positionLimits: Record<string, number>;
  scoringRules: { endPoints: number; cap: number; winByTwo: boolean };
  isTest?: boolean;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const includeTest = user ? await isAdminUser(user.id) : false;
  const sessions = await getAllPickupSessions({ includeTest });
  return NextResponse.json({ sessions });
}

export async function POST(request: NextRequest) {
  try {
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

    const [isOrganizer, isAdmin] = await Promise.all([
      isWhitelistedOrganizer(user.id),
      isAdminUser(user.id),
    ]);
    if (!isOrganizer) {
      return NextResponse.json(
        { error: "Not authorized to create pickup sessions" },
        { status: 403 }
      );
    }

    const body: CreatePickupSessionData = await request.json();
    const {
      title,
      slug,
      date,
      startTime,
      estimatedEndTime,
      location,
      description,
      totalCapacity,
      seriesFormat,
      positionLimits,
      scoringRules,
      isTest,
    } = body;

    if (!title || !slug || !date || !totalCapacity || !positionLimits || !scoringRules) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return NextResponse.json(
        { error: "Invalid slug format. Use lowercase letters, numbers, and hyphens only." },
        { status: 400 }
      );
    }

    const existing = await db.query.pickupSessions.findFirst({
      where: eq(pickupSessions.slug, slug),
    });
    if (existing) {
      return NextResponse.json(
        { error: "This URL slug is already taken. Please choose a different one." },
        { status: 400 }
      );
    }

    const [newSession] = await db
      .insert(pickupSessions)
      .values({
        title,
        slug,
        date: new Date(date),
        startTime: startTime || null,
        estimatedEndTime: estimatedEndTime || null,
        location: location || null,
        description: description || null,
        totalCapacity,
        seriesFormat,
        positionLimits,
        scoringRules,
        isTest: isAdmin ? (isTest ?? false) : false,
        createdBy: user.id,
      })
      .returning();

    return NextResponse.json(
      { success: true, session: newSession },
      { status: 201 }
    );
  } catch (error) {
    console.error("Pickup session creation error:", error);
    if (error instanceof Error && error.message.includes("unique constraint")) {
      return NextResponse.json(
        { error: "A pickup session with this slug already exists." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}
