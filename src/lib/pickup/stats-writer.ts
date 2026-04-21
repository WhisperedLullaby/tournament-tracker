import { db } from "@/lib/db";
import {
  pickupSeries,
  pickupGames,
  pickupRegistrations,
  pickupPlayerStats,
} from "@/lib/db/schema";
import { eq, and, sql } from "drizzle-orm";

export async function writeSeriesStats(
  seriesId: number,
  sessionId: number
): Promise<void> {
  const series = await db.query.pickupSeries.findFirst({
    where: eq(pickupSeries.id, seriesId),
  });
  if (!series || !series.winningSide) return;

  const games = await db
    .select()
    .from(pickupGames)
    .where(
      and(eq(pickupGames.seriesId, seriesId), eq(pickupGames.status, "completed"))
    );

  const regs = await db
    .select({
      id: pickupRegistrations.id,
      userId: pickupRegistrations.userId,
      position: pickupRegistrations.position,
    })
    .from(pickupRegistrations)
    .where(eq(pickupRegistrations.sessionId, sessionId));

  const regMap = new Map(regs.map((r) => [r.id, r]));

  const teamAPointsFor = games.reduce((s, g) => s + g.teamAScore, 0);
  const teamAPointsAgainst = games.reduce((s, g) => s + g.teamBScore, 0);

  async function upsertStat(
    userId: string,
    position: (typeof pickupRegistrations.$inferSelect)["position"],
    seriesWin: number,
    seriesLoss: number,
    pointsFor: number,
    pointsAgainst: number
  ) {
    await db
      .insert(pickupPlayerStats)
      .values({
        sessionId,
        userId,
        position,
        seriesWins: seriesWin,
        seriesLosses: seriesLoss,
        pointsFor,
        pointsAgainst,
      })
      .onConflictDoUpdate({
        target: [pickupPlayerStats.userId, pickupPlayerStats.sessionId],
        set: {
          seriesWins: sql`${pickupPlayerStats.seriesWins} + ${seriesWin}`,
          seriesLosses: sql`${pickupPlayerStats.seriesLosses} + ${seriesLoss}`,
          pointsFor: sql`${pickupPlayerStats.pointsFor} + ${pointsFor}`,
          pointsAgainst: sql`${pickupPlayerStats.pointsAgainst} + ${pointsAgainst}`,
          updatedAt: new Date(),
        },
      });
  }

  const teamAWon = series.winningSide === "A" ? 1 : 0;
  const teamBWon = series.winningSide === "B" ? 1 : 0;

  for (const regId of series.teamAPlayerIds) {
    const reg = regMap.get(regId);
    if (!reg?.userId) continue;
    await upsertStat(
      reg.userId,
      reg.position,
      teamAWon,
      1 - teamAWon,
      teamAPointsFor,
      teamAPointsAgainst
    );
  }

  for (const regId of series.teamBPlayerIds) {
    const reg = regMap.get(regId);
    if (!reg?.userId) continue;
    await upsertStat(
      reg.userId,
      reg.position,
      teamBWon,
      1 - teamBWon,
      teamAPointsAgainst,
      teamAPointsFor
    );
  }
}
