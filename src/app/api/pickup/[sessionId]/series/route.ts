import { NextRequest, NextResponse } from "next/server";
import { getPickupSessionById, getPickupSeriesForSession } from "@/lib/db/pickup-queries";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId: sessionIdStr } = await params;
  const sessionId = parseInt(sessionIdStr, 10);
  if (isNaN(sessionId)) return NextResponse.json({ error: "Invalid session" }, { status: 400 });

  const session = await getPickupSessionById(sessionId);
  if (!session) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const series = await getPickupSeriesForSession(sessionId);
  return NextResponse.json({ series });
}
