import { db } from "./index";
import {
  pickupSessions,
  pickupRegistrations,
  pickupSeries,
  pickupGames,
  pickupPlayerStats,
} from "./schema";
import { eq, and, count, sql, desc, asc } from "drizzle-orm";

export async function getPickupSessionBySlug(slug: string) {
  return db.query.pickupSessions.findFirst({
    where: eq(pickupSessions.slug, slug),
  });
}

export async function getPickupSessionById(id: number) {
  return db.query.pickupSessions.findFirst({
    where: eq(pickupSessions.id, id),
  });
}

export async function getAllPickupSessions(filter?: {
  status?: "upcoming" | "attendance" | "active" | "completed";
  includeTest?: boolean;
}) {
  const conditions = [];
  if (filter?.status) conditions.push(eq(pickupSessions.status, filter.status));
  if (!filter?.includeTest) conditions.push(eq(pickupSessions.isTest, false));

  const rows = await db
    .select()
    .from(pickupSessions)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(pickupSessions.date));
  return rows;
}

export async function getPickupRegistrations(sessionId: number) {
  return db
    .select()
    .from(pickupRegistrations)
    .where(eq(pickupRegistrations.sessionId, sessionId))
    .orderBy(asc(pickupRegistrations.createdAt));
}

export async function getRegisteredCountByPosition(
  sessionId: number,
  position: string
): Promise<number> {
  const result = await db
    .select({ count: count() })
    .from(pickupRegistrations)
    .where(
      and(
        eq(pickupRegistrations.sessionId, sessionId),
        eq(
          pickupRegistrations.position,
          position as (typeof pickupRegistrations.position.enumValues)[number]
        ),
        eq(pickupRegistrations.status, "registered")
      )
    );
  return result[0]?.count ?? 0;
}

export async function getNextWaitlistPosition(
  sessionId: number,
  position: string
): Promise<number> {
  const result = await db
    .select({ max: sql<number>`coalesce(max(${pickupRegistrations.waitlistPosition}), 0)` })
    .from(pickupRegistrations)
    .where(
      and(
        eq(pickupRegistrations.sessionId, sessionId),
        eq(
          pickupRegistrations.position,
          position as (typeof pickupRegistrations.position.enumValues)[number]
        ),
        eq(pickupRegistrations.status, "waitlisted")
      )
    );
  return (result[0]?.max ?? 0) + 1;
}

export async function isPickupOrganizer(
  userId: string,
  sessionId: number
): Promise<boolean> {
  const session = await db.query.pickupSessions.findFirst({
    where: and(
      eq(pickupSessions.id, sessionId),
      eq(pickupSessions.createdBy, userId)
    ),
  });
  return !!session;
}

export async function getUserPickupRegistration(
  userId: string,
  sessionId: number
) {
  return db.query.pickupRegistrations.findFirst({
    where: and(
      eq(pickupRegistrations.userId, userId),
      eq(pickupRegistrations.sessionId, sessionId)
    ),
  });
}

export async function getGuestPickupRegistration(
  email: string,
  sessionId: number
) {
  return db.query.pickupRegistrations.findFirst({
    where: and(
      eq(pickupRegistrations.email, email),
      eq(pickupRegistrations.sessionId, sessionId)
    ),
  });
}

export async function getUserPickupStats(userId: string) {
  const stats = await db
    .select({
      stat: pickupPlayerStats,
      session: pickupSessions,
    })
    .from(pickupPlayerStats)
    .innerJoin(
      pickupSessions,
      eq(pickupPlayerStats.sessionId, pickupSessions.id)
    )
    .where(eq(pickupPlayerStats.userId, userId))
    .orderBy(desc(pickupSessions.date));

  const sessions = stats.map((row) => ({
    session: row.session,
    position: row.stat.position,
    seriesWins: row.stat.seriesWins,
    seriesLosses: row.stat.seriesLosses,
    pointsFor: row.stat.pointsFor,
    pointsAgainst: row.stat.pointsAgainst,
  }));

  const totalSeriesWins = sessions.reduce((s, r) => s + r.seriesWins, 0);
  const totalSeriesLosses = sessions.reduce((s, r) => s + r.seriesLosses, 0);
  const totalSeries = totalSeriesWins + totalSeriesLosses;

  // Find primary position (most series played)
  const positionCounts: Record<string, number> = {};
  for (const row of sessions) {
    positionCounts[row.position] =
      (positionCounts[row.position] ?? 0) +
      row.seriesWins +
      row.seriesLosses;
  }
  const primaryPosition =
    Object.keys(positionCounts).sort(
      (a, b) => positionCounts[b] - positionCounts[a]
    )[0] ?? null;

  return {
    sessions,
    aggregates: {
      sessionsPlayed: sessions.length,
      totalSeriesWins,
      totalSeriesLosses,
      winPercentage: totalSeries > 0 ? Math.round((totalSeriesWins / totalSeries) * 100) : 0,
      primaryPosition,
    },
  };
}

export async function getPickupSeriesForSession(sessionId: number) {
  return db
    .select()
    .from(pickupSeries)
    .where(eq(pickupSeries.sessionId, sessionId))
    .orderBy(desc(pickupSeries.seriesNumber));
}

export async function getPickupSeriesById(seriesId: number) {
  return db.query.pickupSeries.findFirst({
    where: eq(pickupSeries.id, seriesId),
  });
}

export async function getPickupGamesForSeries(seriesId: number) {
  return db
    .select()
    .from(pickupGames)
    .where(eq(pickupGames.seriesId, seriesId))
    .orderBy(asc(pickupGames.gameNumber));
}

// Re-export table references needed by API routes
export { pickupSessions, pickupRegistrations, pickupSeries, pickupGames, pickupPlayerStats };
