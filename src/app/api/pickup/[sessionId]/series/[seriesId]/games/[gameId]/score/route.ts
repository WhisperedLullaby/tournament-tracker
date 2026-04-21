import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/auth/server";
import { db } from "@/lib/db";
import { pickupSessions, pickupSeries, pickupGames } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      sessionId: string;
      seriesId: string;
      gameId: string;
    }>;
  }
) {
  const { sessionId: sStr, seriesId: srStr, gameId: gStr } = await params;
  const sessionId = parseInt(sStr, 10);
  const seriesId = parseInt(srStr, 10);
  const gameId = parseInt(gStr, 10);
  if (isNaN(sessionId) || isNaN(seriesId) || isNaN(gameId))
    return NextResponse.json({ error: "Invalid IDs" }, { status: 400 });

  const body = await request.json().catch(() => ({}));
  const { side, delta } = body as { side?: "A" | "B"; delta?: 1 | -1 };
  if ((side !== "A" && side !== "B") || (delta !== 1 && delta !== -1))
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });

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

  const game = await db.query.pickupGames.findFirst({
    where: and(eq(pickupGames.id, gameId), eq(pickupGames.seriesId, seriesId)),
  });
  if (!game) return NextResponse.json({ error: "Game not found" }, { status: 404 });
  if (game.status === "completed")
    return NextResponse.json({ error: "Game already completed" }, { status: 400 });

  const currentScore = side === "A" ? game.teamAScore : game.teamBScore;
  const newScore = Math.max(0, currentScore + delta);

  const updateFields =
    side === "A"
      ? { teamAScore: newScore, status: "in_progress" as const, updatedAt: new Date() }
      : { teamBScore: newScore, status: "in_progress" as const, updatedAt: new Date() };

  const [updated] = await db
    .update(pickupGames)
    .set(updateFields)
    .where(eq(pickupGames.id, gameId))
    .returning();

  return NextResponse.json({ game: updated });
}
