import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pickupRegistrations } from "@/lib/db/schema";
import { createClient } from "@/lib/auth/server";
import {
  getPickupSessionById,
  getRegisteredCountByPosition,
  getNextWaitlistPosition,
  getUserPickupRegistration,
  getGuestPickupRegistration,
} from "@/lib/db/pickup-queries";
import { and, eq, gt, sql } from "drizzle-orm";

interface RegisterData {
  email: string;
  displayName: string;
  position:
    | "setter"
    | "outside_hitter"
    | "middle_blocker"
    | "opposite"
    | "libero"
    | "defensive_specialist";
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const id = parseInt(sessionId);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }

    const session = await getPickupSessionById(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (session.status === "completed") {
      return NextResponse.json(
        { error: "This pickup session has already ended." },
        { status: 400 }
      );
    }

    if (session.status === "active") {
      return NextResponse.json(
        { error: "This pickup session is already in progress." },
        { status: 400 }
      );
    }

    const body: RegisterData = await request.json();
    const { email, displayName, position } = body;

    if (!email || !displayName || !position) {
      return NextResponse.json(
        { error: "Missing required fields: email, displayName, position" },
        { status: 400 }
      );
    }

    // Check position is valid for this session
    const positionLimit = session.positionLimits[position];
    if (positionLimit === undefined) {
      return NextResponse.json(
        { error: `Position "${position}" is not available for this session.` },
        { status: 400 }
      );
    }

    // Check for optional auth
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Duplicate check: authenticated users by userId, guests by email
    if (user) {
      const existing = await getUserPickupRegistration(user.id, id);
      if (existing) {
        return NextResponse.json(
          { error: "You are already registered for this session." },
          { status: 400 }
        );
      }
    } else {
      const existing = await getGuestPickupRegistration(email, id);
      if (existing) {
        return NextResponse.json(
          { error: "This email is already registered for this session." },
          { status: 400 }
        );
      }
    }

    // Check position availability
    const registeredCount = await getRegisteredCountByPosition(id, position);
    const positionFull = registeredCount >= positionLimit;

    let status: "registered" | "waitlisted" = "registered";
    let waitlistPosition: number | null = null;

    if (positionFull) {
      status = "waitlisted";
      waitlistPosition = await getNextWaitlistPosition(id, position);
    }

    const [registration] = await db
      .insert(pickupRegistrations)
      .values({
        sessionId: id,
        userId: user?.id ?? null,
        email,
        displayName,
        position,
        status,
        waitlistPosition,
      })
      .returning();

    return NextResponse.json(
      {
        success: true,
        registration,
        waitlisted: status === "waitlisted",
        waitlistPosition,
        message:
          status === "waitlisted"
            ? `You've been added to the waitlist for ${position.replace(/_/g, " ")} (position #${waitlistPosition}).`
            : `Successfully registered as ${position.replace(/_/g, " ")}!`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Pickup registration error:", error);
    if (error instanceof Error && error.message.includes("unique constraint")) {
      return NextResponse.json(
        { error: "You are already registered for this session." },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "An unexpected error occurred. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { sessionId } = await params;
    const id = parseInt(sessionId);
    if (isNaN(id)) {
      return NextResponse.json({ error: "Invalid session ID" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const body = await request.json().catch(() => ({}));
    const email: string | undefined = body.email;

    if (!user && !email) {
      return NextResponse.json(
        { error: "Provide your email to cancel guest registration." },
        { status: 400 }
      );
    }

    let existing;
    if (user) {
      existing = await getUserPickupRegistration(user.id, id);
    } else {
      existing = await getGuestPickupRegistration(email!, id);
    }

    if (!existing) {
      return NextResponse.json(
        { error: "Registration not found." },
        { status: 404 }
      );
    }

    const session = await getPickupSessionById(id);
    if (session?.status === "active" || session?.status === "completed") {
      return NextResponse.json(
        { error: "Cannot withdraw after the session has started." },
        { status: 400 }
      );
    }

    await db
      .delete(pickupRegistrations)
      .where(eq(pickupRegistrations.id, existing.id));

    // Promote next waitlisted player for this position if the withdrawn player had a confirmed spot
    if (existing.status === "registered") {
      const nextWaitlisted = await db.query.pickupRegistrations.findFirst({
        where: and(
          eq(pickupRegistrations.sessionId, id),
          eq(pickupRegistrations.position, existing.position),
          eq(pickupRegistrations.status, "waitlisted")
        ),
        orderBy: [pickupRegistrations.waitlistPosition],
      });

      if (nextWaitlisted) {
        await db
          .update(pickupRegistrations)
          .set({ status: "registered", waitlistPosition: null, updatedAt: new Date() })
          .where(eq(pickupRegistrations.id, nextWaitlisted.id));

        // Renumber remaining waitlisted players for this position
        await db
          .update(pickupRegistrations)
          .set({
            waitlistPosition: sql`${pickupRegistrations.waitlistPosition} - 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(pickupRegistrations.sessionId, id),
              eq(pickupRegistrations.position, existing.position),
              eq(pickupRegistrations.status, "waitlisted"),
              gt(pickupRegistrations.waitlistPosition, nextWaitlisted.waitlistPosition!)
            )
          );
      }
    } else if (existing.status === "waitlisted") {
      // Player was on waitlist — renumber everyone behind them
      await db
        .update(pickupRegistrations)
        .set({
          waitlistPosition: sql`${pickupRegistrations.waitlistPosition} - 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(pickupRegistrations.sessionId, id),
            eq(pickupRegistrations.position, existing.position),
            eq(pickupRegistrations.status, "waitlisted"),
            gt(pickupRegistrations.waitlistPosition, existing.waitlistPosition!)
          )
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pickup registration cancel error:", error);
    return NextResponse.json({ error: "Cancellation failed." }, { status: 500 });
  }
}
