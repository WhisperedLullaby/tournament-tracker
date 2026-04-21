import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { pickupSessions, pickupSeries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; seriesId: string }> }
) {
  const { sessionId: sessionIdStr, seriesId: seriesIdStr } = await params;
  const sessionId = parseInt(sessionIdStr, 10);
  const seriesId = parseInt(seriesIdStr, 10);
  if (isNaN(sessionId) || isNaN(seriesId))
    return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const session = await db.query.pickupSessions.findFirst({
    where: eq(pickupSessions.id, sessionId),
  });
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  if (session.createdBy !== user.id)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const series = await db.query.pickupSeries.findFirst({
    where: and(eq(pickupSeries.id, seriesId), eq(pickupSeries.sessionId, sessionId)),
  });
  if (!series) return NextResponse.json({ error: "Series not found" }, { status: 404 });
  if (series.status !== "pending")
    return NextResponse.json({ error: "Series already started" }, { status: 400 });

  const [updated] = await db
    .update(pickupSeries)
    .set({ status: "in_progress", updatedAt: new Date() })
    .where(eq(pickupSeries.id, seriesId))
    .returning();

  return NextResponse.json({ series: updated });
}
