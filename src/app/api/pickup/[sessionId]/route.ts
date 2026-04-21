import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pickupSessions } from "@/lib/db/schema";
import { createClient } from "@/lib/auth/server";
import { isPickupOrganizer, getPickupSessionById } from "@/lib/db/pickup-queries";
import { eq } from "drizzle-orm";

export async function PATCH(
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

    const body = await request.json();
    const allowed = [
      "title", "date", "startTime", "estimatedEndTime", "location", "description",
      "totalCapacity", "seriesFormat", "positionLimits", "scoringRules", "status",
    ];
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const key of allowed) {
      if (key in body) {
        updates[key] = key === "date" ? new Date(body[key]) : body[key];
      }
    }

    const [updated] = await db
      .update(pickupSessions)
      .set(updates)
      .where(eq(pickupSessions.id, id))
      .returning();

    return NextResponse.json({ success: true, session: updated });
  } catch (error) {
    console.error("Pickup session update error:", error);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
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

    await db.delete(pickupSessions).where(eq(pickupSessions.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pickup session delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
