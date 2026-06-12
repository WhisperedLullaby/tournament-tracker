import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import {
  getPickupSessionById,
  getPickupRegistrations,
  isPickupOrganizer,
} from "@/lib/db/pickup-queries";
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
