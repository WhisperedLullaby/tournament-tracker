import { db } from "./index";
import { pods, poolStandings, poolMatches } from "./schema";
import { count, eq, desc, sql } from "drizzle-orm";

/**
 * Get the total number of registered pods
 */
export async function getPodCount(): Promise<number> {
  try {
    const result = await db.select({ count: count() }).from(pods);
    return result[0]?.count || 0;
  } catch (error) {
    console.error("Error fetching pod count:", error);
    return 0;
  }
}

/**
 * Check if registration is open (less than 9 pods)
 */
export async function isRegistrationOpen(): Promise<boolean> {
  const podCount = await getPodCount();
  return podCount < 9;
}

/**
 * Get pool standings with pod information and calculated point differential
 * Returns standings sorted by:
 * 1. Point differential (descending)
 * 2. Points for (descending) - tie-breaker
 * 3. Wins (descending) - tie-breaker
 * Shows all registered pods, even if they haven't played yet
 */
export async function getPoolStandings() {
  try {
    const standings = await db
      .select({
        podId: pods.id,
        teamName: pods.teamName,
        playerNames: pods.name,
        player1: pods.player1,
        player2: pods.player2,
        wins: sql<number>`COALESCE(${poolStandings.wins}, 0)`,
        losses: sql<number>`COALESCE(${poolStandings.losses}, 0)`,
        pointsFor: sql<number>`COALESCE(${poolStandings.pointsFor}, 0)`,
        pointsAgainst: sql<number>`COALESCE(${poolStandings.pointsAgainst}, 0)`,
        pointDifferential: sql<number>`COALESCE(${poolStandings.pointsFor}, 0) - COALESCE(${poolStandings.pointsAgainst}, 0)`,
        gamesPlayed: sql<number>`COALESCE(${poolStandings.wins}, 0) + COALESCE(${poolStandings.losses}, 0)`,
      })
      .from(pods)
      .leftJoin(poolStandings, eq(pods.id, poolStandings.podId))
      .orderBy(
        desc(sql`COALESCE(${poolStandings.pointsFor}, 0) - COALESCE(${poolStandings.pointsAgainst}, 0)`),
        desc(sql`COALESCE(${poolStandings.pointsFor}, 0)`),
        desc(sql`COALESCE(${poolStandings.wins}, 0)`)
      );

    return standings;
  } catch (error) {
    console.error("Error fetching pool standings:", error);
    return [];
  }
}

/**
 * Get completed pool matches for the game log
 * Returns matches with pod IDs, ordered by most recent first
 */
export async function getPoolMatchesLog() {
  try {
    const matches = await db
      .select({
        id: poolMatches.id,
        roundNumber: poolMatches.roundNumber,
        teamAPods: poolMatches.teamAPods,
        teamBPods: poolMatches.teamBPods,
        teamAScore: poolMatches.teamAScore,
        teamBScore: poolMatches.teamBScore,
        updatedAt: poolMatches.updatedAt,
      })
      .from(poolMatches)
      .where(eq(poolMatches.status, "completed"))
      .orderBy(desc(poolMatches.updatedAt));

    return matches;
  } catch (error) {
    console.error("Error fetching pool matches log:", error);
    return [];
  }
}
