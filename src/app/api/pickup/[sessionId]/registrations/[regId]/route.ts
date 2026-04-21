import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pickupRegistrations } from "@/lib/db/schema";
import { createClient } from "@/lib/auth/server";
import { isPickupOrganizer } from "@/lib/db/pickup-queries";
import { and, eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; regId: string }> }
) {
  try {
    const { sessionId, regId } = await params;
    const sessionIdNum = parseInt(sessionId);
    const regIdNum = parseInt(regId);
    if (isNaN(sessionIdNum) || isNaN(regIdNum)) {
      return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const organizer = await isPickupOrganizer(user.id, sessionIdNum);
    if (!organizer) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const body = await request.json();
    const allowed = ["status", "waitlistPosition"];
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }

    // Promoting a waitlisted player: clear waitlistPosition when setting status to registered
    if (body.status === "registered") {
      updates.waitlistPosition = null;
    }

    const [updated] = await db
      .update(pickupRegistrations)
      .set(updates)
      .where(
        and(
          eq(pickupRegistrations.id, regIdNum),
          eq(pickupRegistrations.sessionId, sessionIdNum)
        )
      )
      .returning();

    if (!updated) {
      return NextResponse.json({ error: "Registration not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, registration: updated });
  } catch (error) {
    console.error("Registration patch error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}
