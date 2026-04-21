import { NextRequest, NextResponse } from "next/server";
import { getPickupSessionById, getPickupRegistrations } from "@/lib/db/pickup-queries";

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

    const registrations = await getPickupRegistrations(id);

    // Group by position for easy frontend consumption
    const byPosition: Record<string, typeof registrations> = {};
    for (const reg of registrations) {
      if (!byPosition[reg.position]) byPosition[reg.position] = [];
      byPosition[reg.position].push(reg);
    }

    return NextResponse.json({ registrations, byPosition });
  } catch (error) {
    console.error("Get registrations error:", error);
    return NextResponse.json({ error: "Failed to fetch registrations." }, { status: 500 });
  }
}
