import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { pickupSeries, pickupGames, pickupRegistrations } from "@/lib/db/schema";
import { getPickupSessionBySlug } from "@/lib/db/pickup-queries";
import { and, eq } from "drizzle-orm";
import { PickupScoreboardClient } from "@/components/pickup/pickup-scoreboard-client";
import type { ScoreboardData } from "@/components/pickup/pickup-scoreboard-client";

export default async function PickupScoreboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await getPickupSessionBySlug(slug);
  if (!session) notFound();

  const activeSeries = await db.query.pickupSeries.findFirst({
    where: and(
      eq(pickupSeries.sessionId, session.id),
      eq(pickupSeries.status, "in_progress")
    ),
  });

  let initialData: ScoreboardData | null = null;

  if (activeSeries) {
    const activeGame = await db.query.pickupGames.findFirst({
      where: and(
        eq(pickupGames.seriesId, activeSeries.id),
        eq(pickupGames.status, "in_progress")
      ),
    });

    const allPlayerIds = [
      ...activeSeries.teamAPlayerIds,
      ...activeSeries.teamBPlayerIds,
    ];

    const playerRegs =
      allPlayerIds.length > 0
        ? await db
            .select({
              id: pickupRegistrations.id,
              displayName: pickupRegistrations.displayName,
              position: pickupRegistrations.position,
            })
            .from(pickupRegistrations)
            .where(eq(pickupRegistrations.sessionId, session.id))
        : [];

    const playerMap = new Map(playerRegs.map((r) => [r.id, r]));

    initialData = {
      sessionId: session.id,
      sessionTitle: session.title,
      status: session.status,
      activeSeries: {
        id: activeSeries.id,
        seriesNumber: activeSeries.seriesNumber,
        teamASeriesWins: activeSeries.teamASeriesWins,
        teamBSeriesWins: activeSeries.teamBSeriesWins,
        teamA: activeSeries.teamAPlayerIds
          .map((pid) => playerMap.get(pid))
          .filter((p): p is NonNullable<typeof p> => p != null),
        teamB: activeSeries.teamBPlayerIds
          .map((pid) => playerMap.get(pid))
          .filter((p): p is NonNullable<typeof p> => p != null),
        activeGame: activeGame
          ? {
              id: activeGame.id,
              gameNumber: activeGame.gameNumber,
              teamAScore: activeGame.teamAScore,
              teamBScore: activeGame.teamBScore,
            }
          : null,
      },
    };
  } else {
    initialData = {
      sessionId: session.id,
      sessionTitle: session.title,
      status: session.status,
      activeSeries: null,
    };
  }

  return <PickupScoreboardClient sessionId={session.id} initialData={initialData} />;
}
