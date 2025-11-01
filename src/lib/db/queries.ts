import { db } from "./index";
import { pods, poolStandings, poolMatches, bracketTeams, bracketMatches } from "./schema";
import { count, eq, desc, sql, asc } from "drizzle-orm";
import {
  adaptPlayerNameToFirstName as _adaptPlayerNameToFirstName,
  adaptCombinedNamesToFirstNames as _adaptCombinedNamesToFirstNames,
} from "@/lib/utils/name-adapter";

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

    // Use adapters to translate database IDs to pod numbers and extract first names
    const translatedPods = await Promise.all(
      podList.map(async (pod) => {
        const translatedPodNumber = await adaptPodIdToNumber(pod.podId);
        return {
          ...pod,
          podId: translatedPodNumber ?? pod.podId, // Fallback to original ID if translation fails
          player1: _adaptPlayerNameToFirstName(pod.player1),
          player2: _adaptPlayerNameToFirstName(pod.player2),
          playerNames: _adaptCombinedNamesToFirstNames(pod.playerNames),
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

    // Apply name adapter to extract first names only
    const adaptedStandings = standings.map((standing) => ({
      ...standing,
      player1: _adaptPlayerNameToFirstName(standing.player1),
      player2: _adaptPlayerNameToFirstName(standing.player2),
      playerNames: _adaptCombinedNamesToFirstNames(standing.playerNames),
    }));

    return adaptedStandings;
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

// Re-export name adapter functions from utility module
export {
  adaptPlayerNameToFirstName,
  adaptCombinedNamesToFirstNames,
} from "@/lib/utils/name-adapter";

/**
 * Check if pool play is complete
 * Returns true if all 6 pool play games have been completed
 */
export async function isPoolPlayComplete(): Promise<boolean> {
  try {
    const completedMatches = await db
      .select({ count: count() })
      .from(poolMatches)
      .where(eq(poolMatches.status, "completed"));

    return (completedMatches[0]?.count || 0) >= 6;
  } catch (error) {
    console.error("Error checking pool play completion:", error);
    return false;
  }
}

/**
 * Create bracket teams from final pool standings
 * Creates 3 teams based on final standings:
 * - Team A (1st seed): Places 1, 5, 9
 * - Team B (2nd seed): Places 2, 6, 7
 * - Team C (3rd seed): Places 3, 4, 8
 *
 * Returns the created teams or existing teams if already created
 */
export async function createBracketTeamsFromStandings() {
  try {
    // Check if teams already exist
    const existingTeams = await db.select().from(bracketTeams);
    if (existingTeams.length > 0) {
      return existingTeams;
    }

    // Get final standings
    const standings = await getPoolStandings();

    if (standings.length < 9) {
      throw new Error("Not enough pods to create bracket teams");
    }

    // Create Team A (1st seed): Places 1, 5, 9
    const teamA = await db
      .insert(bracketTeams)
      .values({
        teamName: "Team A",
        pod1Id: standings[0].podId,
        pod2Id: standings[4].podId,
        pod3Id: standings[8].podId,
      })
      .returning();

    // Create Team B (2nd seed): Places 2, 6, 7
    const teamB = await db
      .insert(bracketTeams)
      .values({
        teamName: "Team B",
        pod1Id: standings[1].podId,
        pod2Id: standings[5].podId,
        pod3Id: standings[6].podId,
      })
      .returning();

    // Create Team C (3rd seed): Places 3, 4, 8
    const teamC = await db
      .insert(bracketTeams)
      .values({
        teamName: "Team C",
        pod1Id: standings[2].podId,
        pod2Id: standings[3].podId,
        pod3Id: standings[7].podId,
      })
      .returning();

    return [teamA[0], teamB[0], teamC[0]];
  } catch (error) {
    console.error("Error creating bracket teams:", error);
    throw error;
  }
}

/**
 * Seed bracket matches based on double elimination format
 * Game 1: Team B vs Team C (Team A gets bye)
 * Game 2: Team A vs Winner G1
 * Game 3: Loser G1 vs Loser G2
 * Game 4: Winner G3 vs Winner G2
 * Game 5: Conditional - only if Winner G2 loses G4
 *
 * Returns the created matches or existing matches if already created
 */
export async function seedBracketMatches() {
  try {
    // Check if matches already exist
    const existingMatches = await db.select().from(bracketMatches);
    if (existingMatches.length > 0) {
      return existingMatches;
    }

    // Get bracket teams
    const teams = await db
      .select()
      .from(bracketTeams)
      .orderBy(asc(bracketTeams.teamName));

    if (teams.length < 3) {
      throw new Error("Not enough bracket teams to create matches");
    }

    const teamA = teams.find(t => t.teamName === "Team A");
    const teamB = teams.find(t => t.teamName === "Team B");
    const teamC = teams.find(t => t.teamName === "Team C");

    if (!teamA || !teamB || !teamC) {
      throw new Error("Could not find all bracket teams");
    }

    // Game 1: Team B vs Team C (winners bracket)
    const game1 = await db
      .insert(bracketMatches)
      .values({
        gameNumber: 1,
        bracketType: "winners",
        teamAId: teamB.id,
        teamBId: teamC.id,
        status: "pending",
      })
      .returning();

    // Game 2: Team A vs Winner G1 (winners bracket) - teamBId will be filled when G1 completes
    const game2 = await db
      .insert(bracketMatches)
      .values({
        gameNumber: 2,
        bracketType: "winners",
        teamAId: teamA.id,
        teamBId: null, // Winner of Game 1
        status: "pending",
      })
      .returning();

    // Game 3: Loser G1 vs Loser G2 (losers bracket)
    const game3 = await db
      .insert(bracketMatches)
      .values({
        gameNumber: 3,
        bracketType: "losers",
        teamAId: null, // Loser of Game 1
        teamBId: null, // Loser of Game 2
        status: "pending",
      })
      .returning();

    // Game 4: Winner G2 vs Winner G3 (championship potential)
    const game4 = await db
      .insert(bracketMatches)
      .values({
        gameNumber: 4,
        bracketType: "winners",
        teamAId: null, // Winner of Game 2
        teamBId: null, // Winner of Game 3
        status: "pending",
      })
      .returning();

    return [game1[0], game2[0], game3[0], game4[0]];
  } catch (error) {
    console.error("Error seeding bracket matches:", error);
    throw error;
  }
}

/**
 * Get all bracket teams
 */
export async function getBracketTeams() {
  try {
    return await db
      .select()
      .from(bracketTeams)
      .orderBy(asc(bracketTeams.teamName));
  } catch (error) {
    console.error("Error fetching bracket teams:", error);
    return [];
  }
}

/**
 * Get all bracket matches
 */
export async function getBracketMatches() {
  try {
    return await db
      .select()
      .from(bracketMatches)
      .orderBy(asc(bracketMatches.gameNumber));
  } catch (error) {
    console.error("Error fetching bracket matches:", error);
    return [];
  }
}

/**
 * Get the current in-progress bracket match
 */
export async function getCurrentBracketMatch() {
  try {
    const matches = await db
      .select()
      .from(bracketMatches)
      .where(eq(bracketMatches.status, "in_progress"))
      .orderBy(asc(bracketMatches.gameNumber))
      .limit(1);

    return matches[0] || null;
  } catch (error) {
    console.error("Error fetching current bracket match:", error);
    return null;
  }
}

/**
 * Get the next pending bracket match
 */
export async function getNextBracketMatch() {
  try {
    const matches = await db
      .select()
      .from(bracketMatches)
      .where(eq(bracketMatches.status, "pending"))
      .orderBy(asc(bracketMatches.gameNumber))
      .limit(1);

    return matches[0] || null;
  } catch (error) {
    console.error("Error fetching next bracket match:", error);
    return null;
  }
}

/**
 * Advance teams after a bracket match completes
 * Implements the progression logic for double elimination
 */
export async function advanceBracketTeams(completedGameNumber: number, winnerId: number, loserId: number) {
  try {
    switch (completedGameNumber) {
      case 1:
        // Game 1 complete: Winner to G2, Loser to G3
        await db
          .update(bracketMatches)
          .set({ teamBId: winnerId })
          .where(eq(bracketMatches.gameNumber, 2));

        await db
          .update(bracketMatches)
          .set({ teamAId: loserId })
          .where(eq(bracketMatches.gameNumber, 3));
        break;

      case 2:
        // Game 2 complete: Winner to G4, Loser to G3
        await db
          .update(bracketMatches)
          .set({ teamAId: winnerId })
          .where(eq(bracketMatches.gameNumber, 4));

        await db
          .update(bracketMatches)
          .set({ teamBId: loserId })
          .where(eq(bracketMatches.gameNumber, 3));
        break;

      case 3:
        // Game 3 complete: Winner to G4
        await db
          .update(bracketMatches)
          .set({ teamBId: winnerId })
          .where(eq(bracketMatches.gameNumber, 4));
        break;

      case 4:
        // Game 4 complete: Check if G5 is needed
        // If the winner of G4 is the team that lost G2 (came from losers bracket), need G5
        const game2 = await db
          .select()
          .from(bracketMatches)
          .where(eq(bracketMatches.gameNumber, 2))
          .limit(1);

        if (!game2[0]) break;

        const game2WinnerId = game2[0].teamAScore > game2[0].teamBScore ? game2[0].teamAId : game2[0].teamBId;

        // If G4 winner is NOT the G2 winner, they need a rematch (G5)
        if (winnerId !== game2WinnerId) {
          // Create Game 5 if it doesn't exist
          const existingGame5 = await db
            .select()
            .from(bracketMatches)
            .where(eq(bracketMatches.gameNumber, 5))
            .limit(1);

          if (existingGame5.length === 0) {
            await db
              .insert(bracketMatches)
              .values({
                gameNumber: 5,
                bracketType: "championship",
                teamAId: game2WinnerId,
                teamBId: winnerId,
                status: "pending",
              });
          }
        }
        break;

      case 5:
        // Game 5 complete: Tournament over, winner is champion
        break;

      default:
    }
  } catch (error) {
    console.error("Error advancing bracket teams:", error);
    throw error;
  }
}
