import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pickupRegistrations, pickupSessions } from "@/lib/db/schema";
import { createClient } from "@/lib/auth/server";
import {
  isPickupOrganizer,
  getPickupSessionById,
  getPickupRegistrations,
} from "@/lib/db/pickup-queries";
import { and, eq } from "drizzle-orm";

interface AttendanceData {
  // Map of registrationId → "attended" | "no_show"
  attendance: Record<number, "attended" | "no_show">;
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

    const body: AttendanceData = await request.json();
    const { attendance } = body;

    if (!attendance || typeof attendance !== "object") {
      return NextResponse.json({ error: "Invalid attendance data" }, { status: 400 });
    }

    const now = new Date();

    // Apply all attendance marks
    for (const [regIdStr, status] of Object.entries(attendance)) {
      const regId = parseInt(regIdStr);
      if (isNaN(regId)) continue;
      await db
        .update(pickupRegistrations)
        .set({ status: status as "attended" | "no_show", updatedAt: now })
        .where(
          and(
            eq(pickupRegistrations.id, regId),
            eq(pickupRegistrations.sessionId, id)
          )
        );
    }

    // For each no-show that had a confirmed spot, promote first waitlisted player in same position
    const noShowIds = Object.entries(attendance)
      .filter(([, s]) => s === "no_show")
      .map(([id]) => parseInt(id));

    if (noShowIds.length > 0) {
      const allRegs = await getPickupRegistrations(id);

      for (const noShowId of noShowIds) {
        const noShowReg = allRegs.find((r) => r.id === noShowId);
        if (!noShowReg) continue;

        // Find the first waitlisted player for this position
        const nextWaitlisted = allRegs.find(
          (r) =>
            r.position === noShowReg.position &&
            r.status === "waitlisted"
        );

        if (nextWaitlisted) {
          await db
            .update(pickupRegistrations)
            .set({ status: "attended", waitlistPosition: null, updatedAt: now })
            .where(eq(pickupRegistrations.id, nextWaitlisted.id));
        }
      }
    }

    // Transition session to "attendance" status if still upcoming
    if (session.status === "upcoming") {
      await db
        .update(pickupSessions)
        .set({ status: "attendance", updatedAt: now })
        .where(eq(pickupSessions.id, id));
    }

    const updatedRegistrations = await getPickupRegistrations(id);
    return NextResponse.json({ success: true, registrations: updatedRegistrations });
  } catch (error) {
    console.error("Attendance error:", error);
    return NextResponse.json({ error: "Attendance update failed" }, { status: 500 });
  }
}
