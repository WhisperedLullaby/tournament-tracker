import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { pickupSessions, pickupSeries } from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function DELETE(
  _request: NextRequest,
  {
    params,
  }: { params: Promise<{ sessionId: string; seriesId: string }> }
) {
  try {
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
    if (series.status === "completed")
      return NextResponse.json(
        { error: "Completed series can't be deleted — player stats are already recorded." },
        { status: 400 }
      );

    await db.transaction(async (tx) => {
      // Games cascade via the pickup_games.series_id FK
      await tx.delete(pickupSeries).where(eq(pickupSeries.id, seriesId));

      // Re-sync the counter so the next generated series doesn't skip a number
      await tx
        .update(pickupSessions)
        .set({
          currentSeriesNumber: sql`(
            select coalesce(max(${pickupSeries.seriesNumber}), 0)
            from ${pickupSeries}
            where ${pickupSeries.sessionId} = ${sessionId}
          )`,
          updatedAt: new Date(),
        })
        .where(eq(pickupSessions.id, sessionId));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Pickup series delete error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
