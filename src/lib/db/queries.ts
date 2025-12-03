import { db } from "./index";
import {
  pods,
  poolStandings,
  poolMatches,
  bracketTeams,
  bracketMatches,
  tournaments,
  tournamentRoles,
  organizerWhitelist,
} from "./schema";
import { count, eq, desc, sql, asc, and } from "drizzle-orm";
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
 * Get the total number of registered pods for a tournament
 */
export async function getPodCount(tournamentId: number): Promise<number> {
  try {
    const result = await db
      .select({ count: count() })
      .from(pods)
      .where(eq(pods.tournamentId, tournamentId));
    return result[0]?.count || 0;
  } catch (error) {
    console.error("Error fetching pod count:", error);
    return 0;
  }
}

/**
 * Get all pods with translated pod numbers for a tournament
 * Returns all pods ordered by ID, with podId field containing the translated pod number (1-9)
 */
export async function getAllPods(tournamentId: number): Promise<PodData[]> {
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
      .where(eq(pods.tournamentId, tournamentId))
      .orderBy(asc(pods.id));

    // Use adapters to translate database IDs to pod numbers and extract first names
    const translatedPods = await Promise.all(
      podList.map(async (pod) => {
        const translatedPodNumber = await adaptPodIdToNumber(tournamentId, pod.podId);
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
 * Check if registration is open for a tournament (less than 9 pods)
 */
export async function isRegistrationOpen(tournamentId: number): Promise<boolean> {
  const podCount = await getPodCount(tournamentId);
  return podCount < 9;
}

/**
 * Get pool standings with pod information and calculated point differential for a tournament
 * Returns standings sorted by:
 * 1. Point differential (descending)
 * 2. Points for (descending) - tie-breaker
 * 3. Wins (descending) - tie-breaker
 * Shows all registered pods, even if they haven't played yet
 */
export async function getPoolStandings(tournamentId: number) {
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
      .leftJoin(
        poolStandings,
        sql`${pods.id} = ${poolStandings.podId} AND ${poolStandings.tournamentId} = ${tournamentId}`
      )
      .where(eq(pods.tournamentId, tournamentId))
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
 * Get completed pool matches for the game log for a tournament
 * Returns matches with pod IDs, ordered by most recent first
 */
export async function getPoolMatchesLog(tournamentId: number) {
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
      .where(sql`${poolMatches.tournamentId} = ${tournamentId} AND ${poolMatches.status} = 'completed'`)
      .orderBy(desc(poolMatches.updatedAt));

    return matches;
  } catch (error) {
    console.error("Error fetching pool matches log:", error);
    return [];
  }
}

/**
 * Get all currently in-progress pool matches for a tournament
 * Returns matches with status = 'in_progress'
 */
export async function getCurrentMatches(tournamentId: number) {
  try {
    const matches = await db
      .select()
      .from(poolMatches)
      .where(sql`${poolMatches.tournamentId} = ${tournamentId} AND ${poolMatches.status} = 'in_progress'`)
      .orderBy(asc(poolMatches.gameNumber));

    return matches;
  } catch (error) {
    console.error("Error fetching current matches:", error);
    return [];
  }
}

/**
 * Get the next pending game by game number for a tournament
 * Returns the lowest game number with status = 'pending'
 */
export async function getNextPendingGame(tournamentId: number) {
  try {
    const match = await db
      .select()
      .from(poolMatches)
      .where(sql`${poolMatches.tournamentId} = ${tournamentId} AND ${poolMatches.status} = 'pending'`)
      .orderBy(asc(poolMatches.gameNumber))
      .limit(1);

    return match[0] || null;
  } catch (error) {
    console.error("Error fetching next pending game:", error);
    return null;
  }
}

/**
 * Get a specific pool match by game number for a tournament
 * @param tournamentId - The tournament ID
 * @param gameNumber - The game number to fetch (1-6 for pool play)
 */
export async function getMatchByGameNumber(tournamentId: number, gameNumber: number) {
  try {
    const match = await db
      .select()
      .from(poolMatches)
      .where(sql`${poolMatches.tournamentId} = ${tournamentId} AND ${poolMatches.gameNumber} = ${gameNumber}`)
      .limit(1);

    return match[0] || null;
  } catch (error) {
    console.error("Error fetching match by game number:", error);
    return null;
  }
}

/**
 * Get all pool matches for schedule display for a tournament
 * Returns all matches ordered by game number
 */
export async function getAllPoolMatches(tournamentId: number) {
  try {
    const matches = await db
      .select()
      .from(poolMatches)
      .where(eq(poolMatches.tournamentId, tournamentId))
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
 * to sequential pod numbers (1-9) based on their sorted order within a tournament.
 *
 * Example: podId 27 → podNumber 1, podId 35 → podNumber 9
 */
class PodIdAdapter {
  private tournamentMaps: Map<number, Map<number, number>> = new Map();

  /**
   * Initialize the adapter by building the ID to number mapping for a tournament
   * @private
   */
  private async initialize(tournamentId: number): Promise<void> {
    if (this.tournamentMaps.has(tournamentId)) {
      return; // Already initialized for this tournament
    }

    try {
      const allPods = await db
        .select({ id: pods.id })
        .from(pods)
        .where(eq(pods.tournamentId, tournamentId))
        .orderBy(asc(pods.id));

      const mapping = new Map<number, number>();
      allPods.forEach((pod, index) => {
        mapping.set(pod.id, index + 1);
      });
      this.tournamentMaps.set(tournamentId, mapping);
    } catch (error) {
      console.error("Error initializing pod ID adapter:", error);
      this.tournamentMaps.set(tournamentId, new Map());
    }
  }

  /**
   * Translate a pod ID to its corresponding pod number (1-9) within a tournament
   * @param tournamentId - The tournament ID
   * @param podId - The database pod ID to translate
   * @returns The pod number (1-9) or undefined if pod ID not found
   */
  async adaptPodIdToNumber(tournamentId: number, podId: number): Promise<number | undefined> {
    await this.initialize(tournamentId);
    return this.tournamentMaps.get(tournamentId)?.get(podId);
  }

  /**
   * Reset the adapter cache (useful for testing or when pods are updated)
   */
  reset(tournamentId?: number): void {
    if (tournamentId) {
      this.tournamentMaps.delete(tournamentId);
    } else {
      this.tournamentMaps.clear();
    }
  }
}

// Singleton instance
const podIdAdapter = new PodIdAdapter();

/**
 * Adapt pod ID to pod number
 *
 * Adapter function that translates database pod IDs to sequential pod numbers within a tournament.
 * Pods are numbered 1-9 based on their ascending ID order for that specific tournament.
 *
 * @param tournamentId - The tournament ID
 * @param podId - The database pod ID to translate (e.g., 27, 35)
 * @returns The pod number (1-9) or undefined if pod ID not found
 *
 * @example
 * ```ts
 * const podNumber = await adaptPodIdToNumber(1, 27); // Returns 1 for tournament 1
 * const podNumber = await adaptPodIdToNumber(1, 35); // Returns 9 for tournament 1
 * ```
 */
export async function adaptPodIdToNumber(
  tournamentId: number,
  podId: number
): Promise<number | undefined> {
  return podIdAdapter.adaptPodIdToNumber(tournamentId, podId);
}

// Re-export name adapter functions from utility module
export {
  adaptPlayerNameToFirstName,
  adaptCombinedNamesToFirstNames,
} from "@/lib/utils/name-adapter";

/**
 * Check if pool play is complete for a tournament
 * Returns true if all 6 pool play games have been completed
 */
export async function isPoolPlayComplete(tournamentId: number): Promise<boolean> {
  try {
    const completedMatches = await db
      .select({ count: count() })
      .from(poolMatches)
      .where(sql`${poolMatches.tournamentId} = ${tournamentId} AND ${poolMatches.status} = 'completed'`);

    return (completedMatches[0]?.count || 0) >= 6;
  } catch (error) {
    console.error("Error checking pool play completion:", error);
    return false;
  }
}

/**
 * Create bracket teams from final pool standings for a tournament
 * Creates 3 teams based on final standings:
 * - Team A (1st seed): Places 1, 5, 9
 * - Team B (2nd seed): Places 2, 6, 7
 * - Team C (3rd seed): Places 3, 4, 8
 *
 * Returns the created teams or existing teams if already created
 */
export async function createBracketTeamsFromStandings(tournamentId: number) {
  try {
    // Check if teams already exist for this tournament
    const existingTeams = await db
      .select()
      .from(bracketTeams)
      .where(eq(bracketTeams.tournamentId, tournamentId));
    if (existingTeams.length > 0) {
      return existingTeams;
    }

    // Get final standings
    const standings = await getPoolStandings(tournamentId);

    if (standings.length < 9) {
      throw new Error("Not enough pods to create bracket teams");
    }

    // Create Team A (1st seed): Places 1, 5, 9
    const teamA = await db
      .insert(bracketTeams)
      .values({
        tournamentId,
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
        tournamentId,
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
        tournamentId,
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
 * Seed bracket matches based on double elimination format for a tournament
 * Game 1: Team B vs Team C (Team A gets bye)
 * Game 2: Team A vs Winner G1
 * Game 3: Loser G1 vs Loser G2
 * Game 4: Winner G3 vs Winner G2
 * Game 5: Conditional - only if Winner G2 loses G4
 *
 * Returns the created matches or existing matches if already created
 */
export async function seedBracketMatches(tournamentId: number) {
  try {
    // Check if matches already exist for this tournament
    const existingMatches = await db
      .select()
      .from(bracketMatches)
      .where(eq(bracketMatches.tournamentId, tournamentId));
    if (existingMatches.length > 0) {
      return existingMatches;
    }

    // Get bracket teams for this tournament
    const teams = await db
      .select()
      .from(bracketTeams)
      .where(eq(bracketTeams.tournamentId, tournamentId))
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
        tournamentId,
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
        tournamentId,
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
        tournamentId,
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
        tournamentId,
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
 * Get all bracket teams for a tournament
 */
export async function getBracketTeams(tournamentId: number) {
  try {
    return await db
      .select()
      .from(bracketTeams)
      .where(eq(bracketTeams.tournamentId, tournamentId))
      .orderBy(asc(bracketTeams.teamName));
  } catch (error) {
    console.error("Error fetching bracket teams:", error);
    return [];
  }
}

/**
 * Get all bracket matches for a tournament
 */
export async function getBracketMatches(tournamentId: number) {
  try {
    return await db
      .select()
      .from(bracketMatches)
      .where(eq(bracketMatches.tournamentId, tournamentId))
      .orderBy(asc(bracketMatches.gameNumber));
  } catch (error) {
    console.error("Error fetching bracket matches:", error);
    return [];
  }
}

/**
 * Get the current in-progress bracket match for a tournament
 */
export async function getCurrentBracketMatch(tournamentId: number) {
  try {
    const matches = await db
      .select()
      .from(bracketMatches)
      .where(sql`${bracketMatches.tournamentId} = ${tournamentId} AND ${bracketMatches.status} = 'in_progress'`)
      .orderBy(asc(bracketMatches.gameNumber))
      .limit(1);

    return matches[0] || null;
  } catch (error) {
    console.error("Error fetching current bracket match:", error);
    return null;
  }
}

/**
 * Get the next pending bracket match for a tournament
 */
export async function getNextBracketMatch(tournamentId: number) {
  try {
    const matches = await db
      .select()
      .from(bracketMatches)
      .where(sql`${bracketMatches.tournamentId} = ${tournamentId} AND ${bracketMatches.status} = 'pending'`)
      .orderBy(asc(bracketMatches.gameNumber))
      .limit(1);

    return matches[0] || null;
  } catch (error) {
    console.error("Error fetching next bracket match:", error);
    return null;
  }
}

/**
 * Advance teams after a bracket match completes for a tournament
 * Implements the progression logic for double elimination
 */
export async function advanceBracketTeams(tournamentId: number, completedGameNumber: number, winnerId: number, loserId: number) {
  try {
    switch (completedGameNumber) {
      case 1:
        // Game 1 complete: Winner to G2, Loser to G3
        await db
          .update(bracketMatches)
          .set({ teamBId: winnerId })
          .where(sql`${bracketMatches.tournamentId} = ${tournamentId} AND ${bracketMatches.gameNumber} = 2`);

        await db
          .update(bracketMatches)
          .set({ teamAId: loserId })
          .where(sql`${bracketMatches.tournamentId} = ${tournamentId} AND ${bracketMatches.gameNumber} = 3`);
        break;

      case 2:
        // Game 2 complete: Winner to G4, Loser to G3
        await db
          .update(bracketMatches)
          .set({ teamAId: winnerId })
          .where(sql`${bracketMatches.tournamentId} = ${tournamentId} AND ${bracketMatches.gameNumber} = 4`);

        await db
          .update(bracketMatches)
          .set({ teamBId: loserId })
          .where(sql`${bracketMatches.tournamentId} = ${tournamentId} AND ${bracketMatches.gameNumber} = 3`);
        break;

      case 3:
        // Game 3 complete: Winner to G4
        await db
          .update(bracketMatches)
          .set({ teamBId: winnerId })
          .where(sql`${bracketMatches.tournamentId} = ${tournamentId} AND ${bracketMatches.gameNumber} = 4`);
        break;

      case 4:
        // Game 4 complete: Check if G5 is needed
        // If the winner of G4 is the team that lost G2 (came from losers bracket), need G5
        const game2 = await db
          .select()
          .from(bracketMatches)
          .where(sql`${bracketMatches.tournamentId} = ${tournamentId} AND ${bracketMatches.gameNumber} = 2`)
          .limit(1);

        if (!game2[0]) break;

        const game2WinnerId = game2[0].teamAScore > game2[0].teamBScore ? game2[0].teamAId : game2[0].teamBId;

        // If G4 winner is NOT the G2 winner, they need a rematch (G5)
        if (winnerId !== game2WinnerId) {
          // Create Game 5 if it doesn't exist
          const existingGame5 = await db
            .select()
            .from(bracketMatches)
            .where(sql`${bracketMatches.tournamentId} = ${tournamentId} AND ${bracketMatches.gameNumber} = 5`)
            .limit(1);

          if (existingGame5.length === 0) {
            await db
              .insert(bracketMatches)
              .values({
                tournamentId,
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

// ====================================================================
// TOURNAMENT MANAGEMENT QUERIES
// ====================================================================

/**
 * Get all tournaments with optional filters
 * @param filter - Optional filters for status and visibility
 * @returns Array of tournaments
 */
export async function getAllTournaments(filter?: {
  status?: "upcoming" | "active" | "completed";
  isPublic?: boolean;
}) {
  try {
    let query = db.select().from(tournaments);

    if (filter) {
      const conditions = [];
      if (filter.status) {
        conditions.push(eq(tournaments.status, filter.status));
      }
      if (filter.isPublic !== undefined) {
        conditions.push(eq(tournaments.isPublic, filter.isPublic));
      }
      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as typeof query;
      }
    }

    const result = await query.orderBy(desc(tournaments.date));
    return result;
  } catch (error) {
    console.error("Error fetching tournaments:", error);
    return [];
  }
}

/**
 * Get tournament by slug
 * @param slug - The unique slug for the tournament
 * @returns Tournament or null
 */
export async function getTournamentBySlug(slug: string) {
  try {
    const result = await db
      .select()
      .from(tournaments)
      .where(eq(tournaments.slug, slug))
      .limit(1);

    return result[0] || null;
  } catch (error) {
    console.error("Error fetching tournament by slug:", error);
    return null;
  }
}

/**
 * Get tournaments where user has any role (organizer or participant)
 * @param userId - The user's ID
 * @returns Array of tournaments
 */
export async function getUserTournaments(userId: string) {
  try {
    const result = await db
      .select({
        id: tournaments.id,
        name: tournaments.name,
        slug: tournaments.slug,
        date: tournaments.date,
        location: tournaments.location,
        description: tournaments.description,
        status: tournaments.status,
        maxPods: tournaments.maxPods,
        registrationDeadline: tournaments.registrationDeadline,
        registrationOpenDate: tournaments.registrationOpenDate,
        isPublic: tournaments.isPublic,
        createdBy: tournaments.createdBy,
        createdAt: tournaments.createdAt,
        updatedAt: tournaments.updatedAt,
        role: tournamentRoles.role,
      })
      .from(tournaments)
      .innerJoin(
        tournamentRoles,
        eq(tournaments.id, tournamentRoles.tournamentId)
      )
      .where(eq(tournamentRoles.userId, userId))
      .orderBy(desc(tournaments.date));

    return result;
  } catch (error) {
    console.error("Error fetching user tournaments:", error);
    return [];
  }
}

/**
 * Check if user is a whitelisted organizer
 * @param userId - The user's ID
 * @returns True if user is whitelisted
 */
export async function isWhitelistedOrganizer(userId: string): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from(organizerWhitelist)
      .where(eq(organizerWhitelist.userId, userId))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("Error checking organizer whitelist:", error);
    return false;
  }
}

/**
 * Check if user is an organizer for a specific tournament
 * @param userId - The user's ID
 * @param tournamentId - The tournament ID
 * @returns True if user is organizer
 */
export async function isTournamentOrganizer(
  userId: string,
  tournamentId: number
): Promise<boolean> {
  try {
    const result = await db
      .select()
      .from(tournamentRoles)
      .where(
        and(
          eq(tournamentRoles.userId, userId),
          eq(tournamentRoles.tournamentId, tournamentId),
          eq(tournamentRoles.role, "organizer")
        )
      )
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error("Error checking tournament organizer:", error);
    return false;
  }
}

/**
 * Get user's role in a tournament
 * @param userId - The user's ID
 * @param tournamentId - The tournament ID
 * @returns The user's role or null if no role
 */
export async function getUserTournamentRole(
  userId: string,
  tournamentId: number
): Promise<"organizer" | "participant" | null> {
  try {
    const result = await db
      .select({ role: tournamentRoles.role })
      .from(tournamentRoles)
      .where(
        and(
          eq(tournamentRoles.userId, userId),
          eq(tournamentRoles.tournamentId, tournamentId)
        )
      )
      .limit(1);

    return result[0]?.role || null;
  } catch (error) {
    console.error("Error fetching user tournament role:", error);
    return null;
  }
}
