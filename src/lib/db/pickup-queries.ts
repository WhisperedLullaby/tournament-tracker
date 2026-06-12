import { db } from "./index";
import {
  pickupSessions,
  pickupRegistrations,
  pickupSeries,
  pickupGames,
  pickupPlayerStats,
} from "./schema";
import { eq, and, count, sql, desc, asc, gt, inArray } from "drizzle-orm";

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

// Insert a registration with capacity + waitlist handling, used by both
// self-registration (POST /register) and the organizer "add player" route
// (POST /registrations, userId null — players without an account). Locks the
// session row so concurrent sign-ups can't race the "last spot" check or
// waitlist numbering. The duplicate check only applies to authenticated users
// — one row per user per session; organizer-added guests have no identity to
// de-dupe on.
export async function addPickupRegistration(input: {
  sessionId: number;
  userId: string | null;
  email: string;
  displayName: string;
  position: (typeof pickupRegistrations.position.enumValues)[number];
  positionLimit: number;
}) {
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`SELECT id FROM pickup_sessions WHERE id = ${input.sessionId} FOR UPDATE`
    );

    if (input.userId !== null) {
      const already = await tx.query.pickupRegistrations.findFirst({
        where: and(
          eq(pickupRegistrations.userId, input.userId),
          eq(pickupRegistrations.sessionId, input.sessionId)
        ),
      });
      if (already) return { duplicate: true as const };
    }

    // "attended" still holds the spot once attendance has been taken —
    // registration is open through the attendance phase, so checked-in
    // players must count toward capacity.
    const [{ registered }] = await tx
      .select({ registered: count() })
      .from(pickupRegistrations)
      .where(
        and(
          eq(pickupRegistrations.sessionId, input.sessionId),
          eq(pickupRegistrations.position, input.position),
          inArray(pickupRegistrations.status, ["registered", "attended"])
        )
      );

    let status: "registered" | "waitlisted" = "registered";
    let waitlistPosition: number | null = null;

    if (registered >= input.positionLimit) {
      status = "waitlisted";
      const [{ maxWaitlist }] = await tx
        .select({
          maxWaitlist: sql<number>`coalesce(max(${pickupRegistrations.waitlistPosition}), 0)`,
        })
        .from(pickupRegistrations)
        .where(
          and(
            eq(pickupRegistrations.sessionId, input.sessionId),
            eq(pickupRegistrations.position, input.position),
            eq(pickupRegistrations.status, "waitlisted")
          )
        );
      waitlistPosition = Number(maxWaitlist) + 1;
    }

    const [registration] = await tx
      .insert(pickupRegistrations)
      .values({
        sessionId: input.sessionId,
        userId: input.userId,
        email: input.email,
        displayName: input.displayName,
        position: input.position,
        status,
        waitlistPosition,
      })
      .returning();

    return { duplicate: false as const, registration, status, waitlistPosition };
  });
}

// Delete a registration and keep the waitlist consistent: if the removed
// player held a confirmed spot ("registered", or "attended" once they've been
// checked in), the first waitlisted player for that position is promoted and
// everyone behind them renumbers; if the removed player was waitlisted,
// everyone behind them moves up one. One transaction so a partial failure
// can't leave a gap or a duplicate waitlist position.
export async function removePickupRegistration(
  registration: typeof pickupRegistrations.$inferSelect
) {
  await db.transaction(async (tx) => {
    await tx
      .delete(pickupRegistrations)
      .where(eq(pickupRegistrations.id, registration.id));

    if (
      registration.status === "registered" ||
      registration.status === "attended"
    ) {
      const nextWaitlisted = await tx.query.pickupRegistrations.findFirst({
        where: and(
          eq(pickupRegistrations.sessionId, registration.sessionId),
          eq(pickupRegistrations.position, registration.position),
          eq(pickupRegistrations.status, "waitlisted")
        ),
        orderBy: [pickupRegistrations.waitlistPosition],
      });

      if (nextWaitlisted) {
        await tx
          .update(pickupRegistrations)
          .set({ status: "registered", waitlistPosition: null, updatedAt: new Date() })
          .where(eq(pickupRegistrations.id, nextWaitlisted.id));

        await tx
          .update(pickupRegistrations)
          .set({
            waitlistPosition: sql`${pickupRegistrations.waitlistPosition} - 1`,
            updatedAt: new Date(),
          })
          .where(
            and(
              eq(pickupRegistrations.sessionId, registration.sessionId),
              eq(pickupRegistrations.position, registration.position),
              eq(pickupRegistrations.status, "waitlisted"),
              gt(pickupRegistrations.waitlistPosition, nextWaitlisted.waitlistPosition!)
            )
          );
      }
    } else if (registration.status === "waitlisted") {
      await tx
        .update(pickupRegistrations)
        .set({
          waitlistPosition: sql`${pickupRegistrations.waitlistPosition} - 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(pickupRegistrations.sessionId, registration.sessionId),
            eq(pickupRegistrations.position, registration.position),
            eq(pickupRegistrations.status, "waitlisted"),
            gt(pickupRegistrations.waitlistPosition, registration.waitlistPosition!)
          )
        );
    }
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
