import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { pickupSessions, pickupSeries } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { writeSeriesStats } from "@/lib/pickup/stats-writer";

export async function POST(
  request: NextRequest,
  {
    params,
  }: { params: Promise<{ sessionId: string; seriesId: string }> }
) {
  const { sessionId: sStr, seriesId: srStr } = await params;
  const sessionId = parseInt(sStr, 10);
  const seriesId = parseInt(srStr, 10);
  if (isNaN(sessionId) || isNaN(seriesId))
    return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
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
  if (series.status !== "in_progress")
    return NextResponse.json({ error: "Series is not in progress" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const overrideSide = (body as { winningSide?: "A" | "B" }).winningSide;

  let winningSide: "A" | "B";
  if (overrideSide === "A" || overrideSide === "B") {
    winningSide = overrideSide;
  } else {
    winningSide = series.teamASeriesWins >= series.teamBSeriesWins ? "A" : "B";
  }

  const [updatedSeries] = await db
    .update(pickupSeries)
    .set({
      status: "completed",
      winningSide,
      updatedAt: new Date(),
    })
    .where(eq(pickupSeries.id, seriesId))
    .returning();

  await writeSeriesStats(seriesId, sessionId);

  return NextResponse.json({ series: updatedSeries });
}
