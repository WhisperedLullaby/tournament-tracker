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
 * Returns standings sorted by point differential (descending)
 */
export async function getPoolStandings() {
  try {
    const standings = await db
      .select({
        podId: poolStandings.podId,
        teamName: pods.teamName,
        playerNames: pods.name,
        player1: pods.player1,
        player2: pods.player2,
        wins: poolStandings.wins,
        losses: poolStandings.losses,
        pointsFor: poolStandings.pointsFor,
        pointsAgainst: poolStandings.pointsAgainst,
        pointDifferential: sql<number>`${poolStandings.pointsFor} - ${poolStandings.pointsAgainst}`,
        gamesPlayed: sql<number>`${poolStandings.wins} + ${poolStandings.losses}`,
      })
      .from(poolStandings)
      .innerJoin(pods, eq(poolStandings.podId, pods.id))
      .orderBy(
        desc(sql`${poolStandings.pointsFor} - ${poolStandings.pointsAgainst}`)
      );

    return standings;
  } catch (error) {
    console.error("Error fetching pool standings:", error);
    return [];
  }
}

/**
 * Get completed pool matches for the game log
 * Returns matches with team names, ordered by most recent first
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
        status: poolMatches.status,
        updatedAt: poolMatches.updatedAt,
      })
      .from(poolMatches)
      .where(eq(poolMatches.status, "completed"))
      .orderBy(desc(poolMatches.updatedAt));

    // Fetch all pods to build team names
    const allPods = await db.select().from(pods);
    const podMap = new Map(allPods.map((p) => [p.id, p]));

    // Enrich matches with team names
    const enrichedMatches = matches.map((match) => {
      const teamAPodIds = match.teamAPods as number[];
      const teamBPodIds = match.teamBPods as number[];

      const teamANames = teamAPodIds
        .map((id) => {
          const pod = podMap.get(id);
          return pod?.teamName || pod?.name || `Pod ${id}`;
        })
        .join(" & ");

      const teamBNames = teamBPodIds
        .map((id) => {
          const pod = podMap.get(id);
          return pod?.teamName || pod?.name || `Pod ${id}`;
        })
        .join(" & ");

      return {
        id: match.id,
        roundNumber: match.roundNumber,
        teamAName: teamANames,
        teamBName: teamBNames,
        teamAScore: match.teamAScore,
        teamBScore: match.teamBScore,
        updatedAt: match.updatedAt,
      };
    });

    return enrichedMatches;
  } catch (error) {
    console.error("Error fetching pool matches log:", error);
    return [];
  }
}
