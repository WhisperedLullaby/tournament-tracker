import { db } from "./index";
import { pods, poolStandings, poolMatches } from "./schema";
import { count, eq, desc, sql, asc } from "drizzle-orm";

type PodData = {
  podId: number;
  teamName: string | null;
  playerNames: string;
  player1: string;
  player2: string;
};

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
 * Get all pods with translated pod numbers
 * Returns all pods ordered by ID, with podId field containing the translated pod number (1-9)
 */
export async function getAllPods(): Promise<PodData[]> {
  try {
    const podList = await db
      .select({
        podId: pods.id,
        teamName: pods.teamName,
        playerNames: pods.name,
        player1: pods.player1,
        player2: pods.player2,
      })
      .from(pods)
      .orderBy(asc(pods.id));

    // Use adapter to translate database IDs to pod numbers
    const translatedPods = await Promise.all(
      podList.map(async (pod) => {
        const translatedPodNumber = await adaptPodIdToNumber(pod.podId);
        return {
          ...pod,
          podId: translatedPodNumber ?? pod.podId, // Fallback to original ID if translation fails
        };
      })
    );

    return translatedPods;
  } catch (error) {
    console.error("Error fetching all pods:", error);
    return [];
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
        desc(
          sql`COALESCE(${poolStandings.pointsFor}, 0) - COALESCE(${poolStandings.pointsAgainst}, 0)`
        ),
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

/**
 * Get all currently in-progress pool matches
 * Returns matches with status = 'in_progress'
 */
export async function getCurrentMatches() {
  try {
    const matches = await db
      .select()
      .from(poolMatches)
      .where(eq(poolMatches.status, "in_progress"))
      .orderBy(asc(poolMatches.gameNumber));

    return matches;
  } catch (error) {
    console.error("Error fetching current matches:", error);
    return [];
  }
}

/**
 * Get the next pending game by game number
 * Returns the lowest game number with status = 'pending'
 */
export async function getNextPendingGame() {
  try {
    const match = await db
      .select()
      .from(poolMatches)
      .where(eq(poolMatches.status, "pending"))
      .orderBy(asc(poolMatches.gameNumber))
      .limit(1);

    return match[0] || null;
  } catch (error) {
    console.error("Error fetching next pending game:", error);
    return null;
  }
}

/**
 * Get a specific pool match by game number
 * @param gameNumber - The game number to fetch (1-6 for pool play)
 */
export async function getMatchByGameNumber(gameNumber: number) {
  try {
    const match = await db
      .select()
      .from(poolMatches)
      .where(eq(poolMatches.gameNumber, gameNumber))
      .limit(1);

    return match[0] || null;
  } catch (error) {
    console.error("Error fetching match by game number:", error);
    return null;
  }
}

/**
 * Get all pool matches for schedule display
 * Returns all matches ordered by game number
 */
export async function getAllPoolMatches() {
  try {
    const matches = await db
      .select()
      .from(poolMatches)
      .orderBy(asc(poolMatches.gameNumber));

    return matches;
  } catch (error) {
    console.error("Error fetching all pool matches:", error);
    return [];
  }
}

/**
 * Pod ID to Pod Number Adapter
 *
 * Adapter design pattern implementation for translating database pod IDs
 * to sequential pod numbers (1-9) based on their sorted order.
 *
 * Example: podId 27 → podNumber 1, podId 35 → podNumber 9
 */
class PodIdAdapter {
  private podIdToNumberMap: Map<number, number> | null = null;

  /**
   * Initialize the adapter by building the ID to number mapping
   * @private
   */
  private async initialize(): Promise<void> {
    if (this.podIdToNumberMap !== null) {
      return; // Already initialized
    }

    try {
      const allPods = await db
        .select({ id: pods.id })
        .from(pods)
        .orderBy(asc(pods.id));

      const mapping = new Map<number, number>();
      allPods.forEach((pod, index) => {
        mapping.set(pod.id, index + 1);
      });
      this.podIdToNumberMap = mapping;
    } catch (error) {
      console.error("Error initializing pod ID adapter:", error);
      this.podIdToNumberMap = new Map();
    }
  }

  /**
   * Translate a pod ID to its corresponding pod number (1-9)
   * @param podId - The database pod ID to translate
   * @returns The pod number (1-9) or undefined if pod ID not found
   */
  async adaptPodIdToNumber(podId: number): Promise<number | undefined> {
    await this.initialize();
    return this.podIdToNumberMap?.get(podId);
  }

  /**
   * Reset the adapter cache (useful for testing or when pods are updated)
   */
  reset(): void {
    this.podIdToNumberMap = null;
  }
}

// Singleton instance
const podIdAdapter = new PodIdAdapter();

/**
 * Adapt pod ID to pod number
 *
 * Adapter function that translates database pod IDs to sequential pod numbers.
 * Pods are numbered 1-9 based on their ascending ID order.
 *
 * @param podId - The database pod ID to translate (e.g., 27, 35)
 * @returns The pod number (1-9) or undefined if pod ID not found
 *
 * @example
 * ```ts
 * const podNumber = await adaptPodIdToNumber(27); // Returns 1
 * const podNumber = await adaptPodIdToNumber(35); // Returns 9
 * ```
 */
export async function adaptPodIdToNumber(
  podId: number
): Promise<number | undefined> {
  return podIdAdapter.adaptPodIdToNumber(podId);
}
