import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pickupRegistrations } from "@/lib/db/schema";
import { createClient } from "@/lib/auth/server";
import {
  getPickupSessionById,
  getUserPickupRegistration,
  removePickupRegistration,
} from "@/lib/db/pickup-queries";
import { and, count, eq, inArray, sql } from "drizzle-orm";
import { parseBody, pickupRegisterBody } from "@/lib/validation/api";

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

    // Registration requires a signed-in account — guest sign-ups are not allowed.
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to register for a session." },
        { status: 401 }
      );
    }

    const parsed = await parseBody(request, pickupRegisterBody);
    if ("response" in parsed) return parsed.response;
    const { displayName, position } = parsed.data;
    // Email always comes from the authenticated account, never the request body.
    const email = user.email ?? "";

    if (!email) {
      return NextResponse.json(
        { error: "Your account has no email address." },
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

    // Serialize concurrent sign-ups for this session so the "last spot" check
    // and waitlist numbering can't race. Locking the session row blocks parallel
    // registrations until this transaction commits.
    const outcome = await db.transaction(async (tx) => {
      await tx.execute(
        sql`SELECT id FROM pickup_sessions WHERE id = ${id} FOR UPDATE`
      );

      const already = await tx.query.pickupRegistrations.findFirst({
        where: and(
          eq(pickupRegistrations.userId, user.id),
          eq(pickupRegistrations.sessionId, id)
        ),
      });
      if (already) return { duplicate: true as const };

      // "attended" still holds the spot once attendance has been taken —
      // registration is open through the attendance phase, so checked-in
      // players must count toward capacity.
      const [{ registered }] = await tx
        .select({ registered: count() })
        .from(pickupRegistrations)
        .where(
          and(
            eq(pickupRegistrations.sessionId, id),
            eq(pickupRegistrations.position, position),
            inArray(pickupRegistrations.status, ["registered", "attended"])
          )
        );

      let status: "registered" | "waitlisted" = "registered";
      let waitlistPosition: number | null = null;

      if (registered >= positionLimit) {
        status = "waitlisted";
        const [{ maxWaitlist }] = await tx
          .select({
            maxWaitlist: sql<number>`coalesce(max(${pickupRegistrations.waitlistPosition}), 0)`,
          })
          .from(pickupRegistrations)
          .where(
            and(
              eq(pickupRegistrations.sessionId, id),
              eq(pickupRegistrations.position, position),
              eq(pickupRegistrations.status, "waitlisted")
            )
          );
        waitlistPosition = Number(maxWaitlist) + 1;
      }

      const [registration] = await tx
        .insert(pickupRegistrations)
        .values({
          sessionId: id,
          userId: user.id,
          email,
          displayName,
          position,
          status,
          waitlistPosition,
        })
        .returning();

      return { duplicate: false as const, registration, status, waitlistPosition };
    });

    if (outcome.duplicate) {
      return NextResponse.json(
        { error: "You are already registered for this session." },
        { status: 400 }
      );
    }

    const { registration, status, waitlistPosition } = outcome;
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

    // Cancellation requires a signed-in account; identity comes from the
    // session, never the request body. (Previously an unauthenticated caller
    // could cancel any player's spot by passing their email.)
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "You must be signed in to cancel a registration." },
        { status: 401 }
      );
    }

    const existing = await getUserPickupRegistration(user.id, id);

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

    // Delete + promote + renumber as one transaction so the waitlist can't be
    // left with a gap or a duplicated position on a partial failure.
    await removePickupRegistration(existing);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pickup registration cancel error:", error);
    return NextResponse.json({ error: "Cancellation failed." }, { status: 500 });
  }
}
