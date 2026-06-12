import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import {
  addPickupRegistration,
  getPickupSessionById,
  getPickupRegistrations,
  isPickupOrganizer,
} from "@/lib/db/pickup-queries";
import { parseBody, pickupAddPlayerBody } from "@/lib/validation/api";
import type { PickupRegistration, PublicPickupRegistration } from "@/lib/db/schema";

function toPublic(reg: PickupRegistration): PublicPickupRegistration {
  return {
    id: reg.id,
    sessionId: reg.sessionId,
    displayName: reg.displayName,
    position: reg.position,
    status: reg.status,
    waitlistPosition: reg.waitlistPosition,
    createdAt: reg.createdAt,
  };
}

export async function GET(
  _request: NextRequest,
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

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const allRegistrations = await getPickupRegistrations(id);

    // The session organizer gets full rows (they may need emails to reach
    // players); everyone else gets the display-safe subset only.
    const organizer = user ? await isPickupOrganizer(user.id, id) : false;
    const registrations = organizer
      ? allRegistrations
      : allRegistrations.map(toPublic);

    // The caller's own registration, resolved server-side so the client never
    // needs other players' userIds to find its row.
    const own = user
      ? allRegistrations.find((r) => r.userId === user.id)
      : undefined;
    const userRegistration = own ? toPublic(own) : null;

    // Group by position for easy frontend consumption
    const byPosition: Record<string, PublicPickupRegistration[]> = {};
    for (const reg of registrations) {
      if (!byPosition[reg.position]) byPosition[reg.position] = [];
      byPosition[reg.position].push(reg);
    }

    return NextResponse.json({ registrations, byPosition, userRegistration });
  } catch (error) {
    console.error("Get registrations error:", error);
    return NextResponse.json({ error: "Failed to fetch registrations." }, { status: 500 });
  }
}

// Organizer manually adds a player who can't sign up themselves (no account).
// The row is created with userId null — the lineup generator and roster key
// off registration ids, so a guest flows through attendance/lineups normally;
// the stats writer skips rows without a userId.
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

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const organizer = await isPickupOrganizer(user.id, id);
    if (!organizer) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const session = await getPickupSessionById(id);
    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    if (session.status === "active" || session.status === "completed") {
      return NextResponse.json(
        { error: "Cannot add a player after the session has started." },
        { status: 400 }
      );
    }

    const parsed = await parseBody(request, pickupAddPlayerBody);
    if ("response" in parsed) return parsed.response;
    const { displayName, position, email } = parsed.data;

    const positionLimit = session.positionLimits[position];
    if (positionLimit === undefined) {
      return NextResponse.json(
        { error: `Position "${position}" is not available for this session.` },
        { status: 400 }
      );
    }

    const outcome = await addPickupRegistration({
      sessionId: id,
      userId: null,
      email: email ?? "",
      displayName,
      position,
      positionLimit,
    });

    // duplicate is only possible for authenticated users; narrows the type.
    if (outcome.duplicate) {
      return NextResponse.json(
        { error: "This player is already registered." },
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
            ? `${displayName} added to the ${position.replace(/_/g, " ")} waitlist (#${waitlistPosition}).`
            : `${displayName} added as ${position.replace(/_/g, " ")}.`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Add player error:", error);
    return NextResponse.json({ error: "Failed to add player." }, { status: 500 });
  }
}
