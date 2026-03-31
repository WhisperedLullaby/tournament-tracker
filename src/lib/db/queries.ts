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
import { count, eq, desc, sql, asc, and, inArray } from "drizzle-orm";
import {
  adaptPlayerNameToFirstName as _adaptPlayerNameToFirstName,
  adaptCombinedNamesToFirstNames as _adaptCombinedNamesToFirstNames,
} from "@/lib/utils/name-adapter";

type PodData = {
  podId: number;
  teamName: string | null;
  playerNames: string;
  player1: string;
  player2: string | null;
  player3?: string | null;
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
 * Get a map of raw pod DB ID → display name for a tournament.
 * Suitable for components that need to look up pods by their real DB ID
 * (e.g. bracket_teams.pod1Id / pod2Id / pod3Id).
 */
export async function getPodNameMap(tournamentId: number): Promise<Map<number, string>> {
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

    return new Map(
      podList.map((pod, index) => {
        const display =
          pod.teamName ||
          _adaptCombinedNamesToFirstNames(pod.playerNames) ||
          `Pod ${index + 1}`;
        return [pod.podId, display];
      })
    );
  } catch (error) {
    console.error("Error fetching pod name map:", error);
    return new Map();
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
          player2: pod.player2 ? _adaptPlayerNameToFirstName(pod.player2) : null,
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
 * Check if registration is open for a tournament (less than maxPods)
 */
export async function isRegistrationOpen(tournamentId: number): Promise<boolean> {
  const tournament = await db.query.tournaments.findFirst({
    where: eq(tournaments.id, tournamentId),
  });

  if (!tournament) {
    return false;
  }

  const podCount = await getPodCount(tournamentId);
  return podCount < tournament.maxPods;
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
      player2: standing.player2 ? _adaptPlayerNameToFirstName(standing.player2) : null,
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
 * Returns true if all pool play games have been completed
 */
export async function isPoolPlayComplete(tournamentId: number): Promise<boolean> {
  try {
    // Get total number of pool matches for this tournament
    const totalMatches = await db
      .select({ count: count() })
      .from(poolMatches)
      .where(eq(poolMatches.tournamentId, tournamentId));

    const total = totalMatches[0]?.count || 0;

    // Get number of completed matches
    const completedMatches = await db
      .select({ count: count() })
      .from(poolMatches)
      .where(sql`${poolMatches.tournamentId} = ${tournamentId} AND ${poolMatches.status} = 'completed'`);

    const completed = completedMatches[0]?.count || 0;

    // Pool play is complete when all matches are completed
    return total > 0 && completed >= total;
  } catch (error) {
    console.error("Error checking pool play completion:", error);
    return false;
  }
}

// ====================================================================
// BRACKET HELPERS
// ====================================================================

/**
 * Derive bracket team count and pods-per-team from tournament config.
 *   pod_2: 3 pods × 2 players = 6  →  teamCount = maxPods / 3
 *   pod_3: 2 pods × 3 players = 6  →  teamCount = maxPods / 2
 */
function getBracketConfig(tournament: { tournamentType: string; maxPods: number }): {
  teamCount: number;
  podsPerTeam: number;
} {
  const podsPerTeam = tournament.tournamentType === "pod_3" ? 2 : 3;
  return { teamCount: Math.floor(tournament.maxPods / podsPerTeam), podsPerTeam };
}

// ====================================================================
// BRACKET TEAM CREATION
// ====================================================================

/**
 * Create bracket teams from final pool play standings.
 *
 * Team count and pod distribution are derived from the tournament config:
 *   pod_2 type (2 players/pod): 3 pods per team → teamCount = maxPods / 3
 *   pod_3 type (3 players/pod): 2 pods per team → teamCount = maxPods / 2
 *
 * Pods are distributed using a serpentine (snake) draft so each team gets
 * one high-seed and one low-seed pod per pair of rounds:
 *   Even rounds: assign ascending  (team 0 → N-1)
 *   Odd rounds:  assign descending (team N-1 → 0)
 *
 * Examples:
 *   4 teams, 3 pods (12-pod pod_2): A=1,8,9  B=2,7,10  C=3,6,11  D=4,5,12
 *   6 teams, 2 pods (12-pod pod_3): A=1,12   B=2,11    C=3,10    D=4,9    E=5,8   F=6,7
 *   6 teams, 3 pods (18-pod pod_2): A=1,12,13 B=2,11,14 C=3,10,15 D=4,9,16 E=5,8,17 F=6,7,18
 */
export async function createBracketTeamsFromStandings(tournamentId: number) {
  try {
    const existingTeams = await db
      .select()
      .from(bracketTeams)
      .where(eq(bracketTeams.tournamentId, tournamentId));
    if (existingTeams.length > 0) return existingTeams;

    const tournament = await db.query.tournaments.findFirst({
      where: eq(tournaments.id, tournamentId),
    });
    if (!tournament) throw new Error("Tournament not found");

    const { teamCount, podsPerTeam } = getBracketConfig(tournament);
    const standings = await getPoolStandings(tournamentId);

    const requiredPods = teamCount * podsPerTeam;
    if (standings.length < requiredPods) {
      throw new Error(
        `Need ${requiredPods} pods for ${teamCount} bracket teams (${podsPerTeam} pods each), but only ${standings.length} pods are registered.`
      );
    }

    // Serpentine draft: distribute pods across teams in snake order
    const teamPodIds: number[][] = Array.from({ length: teamCount }, () => []);
    for (let round = 0; round < podsPerTeam; round++) {
      for (let pick = 0; pick < teamCount; pick++) {
        const ascending = round % 2 === 0;
        const teamIdx = ascending ? pick : teamCount - 1 - pick;
        teamPodIds[teamIdx].push(standings[round * teamCount + pick].podId);
      }
    }

    const TEAM_LETTERS = "ABCDEFGHIJKLMNOP";
    const createdTeams = [];
    for (let i = 0; i < teamCount; i++) {
      const pods = teamPodIds[i];
      const [team] = await db
        .insert(bracketTeams)
        .values({
          tournamentId,
          teamName: `Team ${TEAM_LETTERS[i]}`,
          pod1Id: pods[0],
          pod2Id: pods[1],
          pod3Id: pods[2] ?? null,
        })
        .returning();
      createdTeams.push(team);
    }

    return createdTeams;
  } catch (error) {
    console.error("Error creating bracket teams:", error);
    throw error;
  }
}

/**
 * Seed bracket matches — dispatches to the correct seeder based on team count.
 * Returns the created matches or existing matches if already seeded.
 */
export async function seedBracketMatches(tournamentId: number) {
  try {
    const existingMatches = await db
      .select()
      .from(bracketMatches)
      .where(eq(bracketMatches.tournamentId, tournamentId));
    if (existingMatches.length > 0) {
      return existingMatches;
    }

    const teams = await db
      .select()
      .from(bracketTeams)
      .where(eq(bracketTeams.tournamentId, tournamentId))
      .orderBy(asc(bracketTeams.teamName));

    if (teams.length === 4) {
      await seed4TeamDE(tournamentId, teams);
    } else if (teams.length === 6) {
      await seed6TeamDE(tournamentId, teams);
    } else {
      throw new Error(`Unsupported bracket team count: ${teams.length}`);
    }

    return await db
      .select()
      .from(bracketMatches)
      .where(eq(bracketMatches.tournamentId, tournamentId))
      .orderBy(asc(bracketMatches.gameNumber));
  } catch (error) {
    console.error("Error seeding bracket matches:", error);
    throw error;
  }
}

/**
 * 4-team double elimination seeder (7 games).
 * Single-court flow: G1, G2, G3 (L-R1), G4 (W-Final), G5 (L-Final), G6 (Champ), G7 (Rematch if needed)
 */
async function seed4TeamDE(tournamentId: number, teams: { id: number; teamName: string }[]) {
  const get = (name: string) => {
    const t = teams.find(t => t.teamName === name);
    if (!t) throw new Error(`Bracket team "${name}" not found`);
    return t.id;
  };

  const rows = [
    { gameNumber: 1, bracketType: "winners" as const, teamAId: get("Team A"), teamBId: get("Team C") },
    { gameNumber: 2, bracketType: "winners" as const, teamAId: get("Team B"), teamBId: get("Team D") },
    { gameNumber: 3, bracketType: "losers"  as const, teamAId: null, teamBId: null }, // Losers R1: loser G1 vs loser G2
    { gameNumber: 4, bracketType: "winners" as const, teamAId: null, teamBId: null }, // Winners Final: winner G1 vs winner G2
    { gameNumber: 5, bracketType: "losers"  as const, teamAId: null, teamBId: null }, // Losers Final: winner G3 vs loser G4
    { gameNumber: 6, bracketType: "championship" as const, teamAId: null, teamBId: null }, // Championship: winner G4 vs winner G5
    { gameNumber: 7, bracketType: "championship" as const, teamAId: null, teamBId: null }, // Rematch if needed
  ];

  for (const row of rows) {
    await db.insert(bracketMatches).values({ tournamentId, status: "pending", ...row });
  }
}

/**
 * 6-team double elimination seeder (11 games).
 * Single-court flow:
 *   G1  Winners R1: A vs F
 *   G2  Winners R1: B vs E
 *   G3  Winners R1: C vs D
 *   G4  Losers R1:  loser G1 vs loser G2
 *   G5  Losers R1:  loser G3 sits (bye — only 2 losers available for first round)
 *   G6  Winners SF: winner G1 vs winner G3
 *   G7  Winners SF: winner G2 vs winner G4... (wait — need to rethink)
 *
 * Standard 6-team DE schedule:
 *   G1  W-R1: seed1(A) vs seed6(F)
 *   G2  W-R1: seed2(B) vs seed5(E)
 *   G3  W-R1: seed3(C) vs seed4(D)
 *   G4  L-R1: loser(G1) vs loser(G2)
 *   G5  W-QF: winner(G1) vs winner(G3)   [seed1/6 winner vs seed3/4 winner]
 *   G6  W-QF: winner(G2) vs bye           [seed2/5 winner gets bye — becomes W-SF entry]
 *   G7  L-R2: loser(G5) vs loser(G3)      [W-QF loser vs W-R1 loser with bye]
 *   G8  L-R2: winner(G4) vs loser(G6)
 *   G9  W-SF: winner(G5) vs winner(G6)    [Winners Final]
 *   G10 L-QF: winner(G7) vs winner(G8)
 *   G11 L-SF: loser(G9) vs winner(G10)    [Losers Final]
 *   G12 Championship: winner(G9) vs winner(G11)
 *   G13 Rematch if needed
 *
 * Reordered for single-court logical flow:
 *   G1  W-R1: A vs F
 *   G2  W-R1: B vs E
 *   G3  W-R1: C vs D
 *   G4  L-R1: loser(G1) vs loser(G2)      — both losers known after G1+G2
 *   G5  W-QF: winner(G1) vs winner(G3)    — G3 loser goes to L-R2 (G7)
 *   G6  W-QF: winner(G2) vs winner(G4)...
 *
 * Simplified practical schedule (interleaved single court):
 *   G1  W-R1:   A vs F
 *   G2  W-R1:   B vs E
 *   G3  W-R1:   C vs D
 *   G4  L-R1:   loser(G1) vs loser(G2)
 *   G5  W-SF:   winner(G1) vs winner(G3)
 *   G6  W-SF:   winner(G2) vs winner(G4)  [NOTE: winner(G4) = winner of L-R1... this is non-standard]
 *
 * Using the clean 6-team DE with 3 byes in losers:
 *   G1  W-R1:   A vs F            (1st/6th)
 *   G2  W-R1:   B vs E            (2nd/5th)
 *   G3  W-R1:   C vs D            (3rd/4th)
 *   G4  L-R1:   loser(G2) vs loser(G3)
 *   G5  W-SF:   winner(G2) vs winner(G3)
 *   G6  L-R1:   loser(G1) vs loser(G5)
 *   G7  W-SF:   winner(G1) vs winner(G5)  [Winners Final]
 *   G8  L-SF:   winner(G4) vs winner(G6)
 *   G9  L-Final: winner(G8) vs loser(G7)
 *   G10 Championship: winner(G7) vs winner(G9)
 *   G11 Rematch if needed
 */
async function seed6TeamDE(tournamentId: number, teams: { id: number; teamName: string }[]) {
  const get = (name: string) => {
    const t = teams.find(t => t.teamName === name);
    if (!t) throw new Error(`Bracket team "${name}" not found`);
    return t.id;
  };

  // 6-team DE: 11 games
  // Seeds: A=1st, B=2nd, C=3rd, D=4th, E=5th, F=6th
  // W-R1 matchups: 1v6, 2v5, 3v4
  // Single-court interleaved flow:
  //   G1: W-R1 A vs F
  //   G2: W-R1 B vs E
  //   G3: W-R1 C vs D
  //   G4: L-R1 loser(G2) vs loser(G3)     — first two losers available
  //   G5: W-SF winner(G2) vs winner(G3)
  //   G6: L-R1 loser(G1) vs loser(G5)     — G1 loser waits, plays L-R1 vs W-SF loser
  //   G7: W-F  winner(G1) vs winner(G5)   — Winners Final
  //   G8: L-QF winner(G4) vs winner(G6)
  //   G9: L-SF loser(G7)  vs winner(G8)   — Losers Final
  //  G10: Champ winner(G7) vs winner(G9)
  //  G11: Rematch if needed
  const rows = [
    { gameNumber: 1,  bracketType: "winners"      as const, teamAId: get("Team A"), teamBId: get("Team F") },
    { gameNumber: 2,  bracketType: "winners"      as const, teamAId: get("Team B"), teamBId: get("Team E") },
    { gameNumber: 3,  bracketType: "winners"      as const, teamAId: get("Team C"), teamBId: get("Team D") },
    { gameNumber: 4,  bracketType: "losers"       as const, teamAId: null, teamBId: null }, // loser(G2) vs loser(G3)
    { gameNumber: 5,  bracketType: "winners"      as const, teamAId: null, teamBId: null }, // winner(G2) vs winner(G3)
    { gameNumber: 6,  bracketType: "losers"       as const, teamAId: null, teamBId: null }, // loser(G1) vs loser(G5)
    { gameNumber: 7,  bracketType: "winners"      as const, teamAId: null, teamBId: null }, // winner(G1) vs winner(G5) — Winners Final
    { gameNumber: 8,  bracketType: "losers"       as const, teamAId: null, teamBId: null }, // winner(G4) vs winner(G6)
    { gameNumber: 9,  bracketType: "losers"       as const, teamAId: null, teamBId: null }, // loser(G7) vs winner(G8) — Losers Final
    { gameNumber: 10, bracketType: "championship" as const, teamAId: null, teamBId: null }, // winner(G7) vs winner(G9)
    { gameNumber: 11, bracketType: "championship" as const, teamAId: null, teamBId: null }, // rematch if needed
  ];

  for (const row of rows) {
    await db.insert(bracketMatches).values({ tournamentId, status: "pending", ...row });
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
 * Advance teams after a bracket match completes.
 * Dispatches to the per-format helper based on how many bracket teams exist.
 */
export async function advanceBracketTeams(tournamentId: number, completedGameNumber: number, winnerId: number, loserId: number) {
  try {
    const teams = await db
      .select({ id: bracketTeams.id })
      .from(bracketTeams)
      .where(eq(bracketTeams.tournamentId, tournamentId));

    if (teams.length === 4) {
      await advance4TeamDE(tournamentId, completedGameNumber, winnerId, loserId);
    } else if (teams.length === 6) {
      await advance6TeamDE(tournamentId, completedGameNumber, winnerId, loserId);
    } else {
      throw new Error(`Unsupported bracket team count for advancement: ${teams.length}`);
    }
  } catch (error) {
    console.error("Error advancing bracket teams:", error);
    throw error;
  }
}

// ---- private helpers ----

async function setSlot(tournamentId: number, gameNumber: number, slot: "teamAId" | "teamBId", teamId: number) {
  await db
    .update(bracketMatches)
    .set({ [slot]: teamId })
    .where(sql`${bracketMatches.tournamentId} = ${tournamentId} AND ${bracketMatches.gameNumber} = ${gameNumber}`);
}

/**
 * 4-team DE advancement.
 * Game map: G1 W-R1, G2 W-R1, G3 L-R1, G4 W-Final, G5 L-Final, G6 Champ, G7 Rematch
 */
async function advance4TeamDE(tournamentId: number, g: number, winnerId: number, loserId: number) {
  switch (g) {
    case 1:
      await setSlot(tournamentId, 4, "teamAId", winnerId); // → W-Final
      await setSlot(tournamentId, 3, "teamAId", loserId);  // → L-R1
      break;
    case 2:
      await setSlot(tournamentId, 4, "teamBId", winnerId); // → W-Final
      await setSlot(tournamentId, 3, "teamBId", loserId);  // → L-R1
      break;
    case 3: // L-R1
      await setSlot(tournamentId, 5, "teamAId", winnerId); // → L-Final
      break;
    case 4: // W-Final
      await setSlot(tournamentId, 6, "teamAId", winnerId); // → Champ (undefeated side)
      await setSlot(tournamentId, 5, "teamBId", loserId);  // → L-Final
      break;
    case 5: // L-Final
      await setSlot(tournamentId, 6, "teamBId", winnerId); // → Champ (losers side)
      break;
    case 6: { // Championship
      // Rematch only if the G4 winner (undefeated) lost here — they still have just 1 loss
      const [game4] = await db
        .select()
        .from(bracketMatches)
        .where(sql`${bracketMatches.tournamentId} = ${tournamentId} AND ${bracketMatches.gameNumber} = 4`)
        .limit(1);
      if (game4) {
        const g4Winner = game4.teamAScore > game4.teamBScore ? game4.teamAId : game4.teamBId;
        if (loserId === g4Winner) {
          await db
            .update(bracketMatches)
            .set({ teamAId: winnerId, teamBId: loserId })
            .where(sql`${bracketMatches.tournamentId} = ${tournamentId} AND ${bracketMatches.gameNumber} = 7`);
        }
      }
      break;
    }
    case 7:
      break; // Tournament over
  }
}

/**
 * 6-team DE advancement.
 * Game map:
 *   G1  W-R1:   A vs F
 *   G2  W-R1:   B vs E
 *   G3  W-R1:   C vs D
 *   G4  L-R1:   loser(G2) vs loser(G3)
 *   G5  W-SF:   winner(G2) vs winner(G3)
 *   G6  L-R1:   loser(G1) vs loser(G5)
 *   G7  W-Final: winner(G1) vs winner(G5)
 *   G8  L-QF:   winner(G4) vs winner(G6)
 *   G9  L-Final: loser(G7) vs winner(G8)
 *   G10 Champ:  winner(G7) vs winner(G9)
 *   G11 Rematch if needed
 */
async function advance6TeamDE(tournamentId: number, g: number, winnerId: number, loserId: number) {
  switch (g) {
    case 1: // W-R1 A vs F
      await setSlot(tournamentId, 7, "teamAId", winnerId); // → W-Final teamA
      await setSlot(tournamentId, 6, "teamAId", loserId);  // → L-R1(G6) teamA (waits for G5 loser)
      break;
    case 2: // W-R1 B vs E
      await setSlot(tournamentId, 5, "teamAId", winnerId); // → W-SF teamA
      await setSlot(tournamentId, 4, "teamAId", loserId);  // → L-R1(G4) teamA
      break;
    case 3: // W-R1 C vs D
      await setSlot(tournamentId, 5, "teamBId", winnerId); // → W-SF teamB
      await setSlot(tournamentId, 4, "teamBId", loserId);  // → L-R1(G4) teamB
      break;
    case 4: // L-R1
      await setSlot(tournamentId, 8, "teamAId", winnerId); // → L-QF teamA
      break;
    case 5: // W-SF
      await setSlot(tournamentId, 7, "teamBId", winnerId); // → W-Final teamB
      await setSlot(tournamentId, 6, "teamBId", loserId);  // → L-R1(G6) teamB
      break;
    case 6: // L-R1 (second)
      await setSlot(tournamentId, 8, "teamBId", winnerId); // → L-QF teamB
      break;
    case 7: // W-Final
      await setSlot(tournamentId, 10, "teamAId", winnerId); // → Champ (undefeated side)
      await setSlot(tournamentId, 9,  "teamAId", loserId);  // → L-Final
      break;
    case 8: // L-QF
      await setSlot(tournamentId, 9, "teamBId", winnerId); // → L-Final
      break;
    case 9: // L-Final
      await setSlot(tournamentId, 10, "teamBId", winnerId); // → Champ (losers side)
      break;
    case 10: { // Championship
      // Rematch only if G7 winner (undefeated) lost here
      const [game7] = await db
        .select()
        .from(bracketMatches)
        .where(sql`${bracketMatches.tournamentId} = ${tournamentId} AND ${bracketMatches.gameNumber} = 7`)
        .limit(1);
      if (game7) {
        const g7Winner = game7.teamAScore > game7.teamBScore ? game7.teamAId : game7.teamBId;
        if (loserId === g7Winner) {
          await db
            .update(bracketMatches)
            .set({ teamAId: winnerId, teamBId: loserId })
            .where(sql`${bracketMatches.tournamentId} = ${tournamentId} AND ${bracketMatches.gameNumber} = 11`);
        }
      }
      break;
    }
    case 11:
      break; // Tournament over
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
        tournamentType: tournaments.tournamentType,
        bracketStyle: tournaments.bracketStyle,
        level: tournaments.level,
        maxPods: tournaments.maxPods,
        maxTeams: tournaments.maxTeams,
        scoringRules: tournaments.scoringRules,
        poolPlayDescription: tournaments.poolPlayDescription,
        bracketPlayDescription: tournaments.bracketPlayDescription,
        rulesDescription: tournaments.rulesDescription,
        prizeInfo: tournaments.prizeInfo,
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
 * Get tournaments where user is an organizer
 * @param userId - The user's ID
 * @returns Array of tournaments with pod counts
 */
export async function getOrganizerTournaments(userId: string) {
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
      })
      .from(tournaments)
      .innerJoin(
        tournamentRoles,
        eq(tournaments.id, tournamentRoles.tournamentId)
      )
      .where(
        and(
          eq(tournamentRoles.userId, userId),
          eq(tournamentRoles.role, "organizer")
        )
      )
      .orderBy(desc(tournaments.date));

    return result;
  } catch (error) {
    console.error("Error fetching organizer tournaments:", error);
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
 * Prioritizes "organizer" over "participant" if user has both roles
 * @param userId - The user's ID
 * @param tournamentId - The tournament ID
 * @returns The user's role or null if no role
 */
export async function getUserTournamentRole(
  userId: string,
  tournamentId: number
): Promise<"organizer" | "participant" | null> {
  try {
    // Get all roles for this user in this tournament
    const result = await db
      .select({ role: tournamentRoles.role })
      .from(tournamentRoles)
      .where(
        and(
          eq(tournamentRoles.userId, userId),
          eq(tournamentRoles.tournamentId, tournamentId)
        )
      );

    if (result.length === 0) {
      return null;
    }

    // Prioritize organizer role over participant
    const hasOrganizerRole = result.some((r) => r.role === "organizer");
    if (hasOrganizerRole) {
      return "organizer";
    }

    // Otherwise return participant if they have it
    const hasParticipantRole = result.some((r) => r.role === "participant");
    if (hasParticipantRole) {
      return "participant";
    }

    return null;
  } catch (error) {
    console.error("Error fetching user tournament role:", error);
    return null;
  }
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export type BracketFinish =
  | "Champions"
  | "Runner-up"
  | "3rd Place"
  | "Lost in Bracket";

export type TournamentHistoryEntry = {
  tournament: {
    id: number;
    name: string;
    slug: string;
    date: Date;
    location: string | null;
    status: string;
    level: string | null;
  };
  role: "organizer" | "participant";
  pod: {
    player1: string;
    player2: string | null;
    player3: string | null;
    teamName: string | null;
  } | null;
  poolRecord: { wins: number; losses: number } | null;
  bracketFinish: BracketFinish | null;
};

export type UserTournamentStats = {
  history: TournamentHistoryEntry[];
  aggregates: {
    tournamentsPlayed: number;
    totalWins: number;
    totalLosses: number;
    winPercentage: number;
  };
};

/**
 * Get a user's full tournament history with stats for the profile page.
 * Uses batch queries to minimize round-trips.
 */
export async function getUserTournamentStats(
  userId: string
): Promise<UserTournamentStats> {
  const empty: UserTournamentStats = {
    history: [],
    aggregates: { tournamentsPlayed: 0, totalWins: 0, totalLosses: 0, winPercentage: 0 },
  };

  try {
    // 1. Get all tournaments user has a role in
    const userTournaments = await getUserTournaments(userId);
    if (userTournaments.length === 0) return empty;

    const tournamentIds = userTournaments.map((t) => t.id);

    // 2. Batch-fetch user's pods across all their tournaments
    const userPods = await db
      .select({
        id: pods.id,
        tournamentId: pods.tournamentId,
        player1: pods.player1,
        player2: pods.player2,
        player3: pods.player3,
        teamName: pods.teamName,
      })
      .from(pods)
      .where(and(eq(pods.userId, userId), inArray(pods.tournamentId, tournamentIds)));

    const podByTournament = new Map(userPods.map((p) => [p.tournamentId, p]));
    const podIds = userPods.map((p) => p.id);

    // 3. Batch-fetch pool standings for user's pods
    const standings =
      podIds.length > 0
        ? await db
            .select({
              podId: poolStandings.podId,
              wins: poolStandings.wins,
              losses: poolStandings.losses,
            })
            .from(poolStandings)
            .where(inArray(poolStandings.podId, podIds))
        : [];
    const standingByPod = new Map(standings.map((s) => [s.podId, s]));

    // 4. For completed tournaments, determine bracket finish
    const completedIds = userTournaments
      .filter((t) => t.status === "completed")
      .map((t) => t.id);

    const bracketFinishByTournament = new Map<number, BracketFinish | null>();

    if (completedIds.length > 0 && podIds.length > 0) {
      const [allBracketTeams, allBracketMatches] = await Promise.all([
        db
          .select({
            id: bracketTeams.id,
            tournamentId: bracketTeams.tournamentId,
            pod1Id: bracketTeams.pod1Id,
            pod2Id: bracketTeams.pod2Id,
            pod3Id: bracketTeams.pod3Id,
          })
          .from(bracketTeams)
          .where(inArray(bracketTeams.tournamentId, completedIds)),
        db
          .select({
            id: bracketMatches.id,
            tournamentId: bracketMatches.tournamentId,
            gameNumber: bracketMatches.gameNumber,
            bracketType: bracketMatches.bracketType,
            teamAId: bracketMatches.teamAId,
            teamBId: bracketMatches.teamBId,
            teamAScore: bracketMatches.teamAScore,
            teamBScore: bracketMatches.teamBScore,
            status: bracketMatches.status,
          })
          .from(bracketMatches)
          .where(
            and(
              inArray(bracketMatches.tournamentId, completedIds),
              eq(bracketMatches.status, "completed")
            )
          ),
      ]);

      for (const tid of completedIds) {
        const userPod = podByTournament.get(tid);
        if (!userPod) {
          bracketFinishByTournament.set(tid, null);
          continue;
        }

        const userBracketTeam = allBracketTeams.find(
          (bt) =>
            bt.tournamentId === tid &&
            (bt.pod1Id === userPod.id ||
              bt.pod2Id === userPod.id ||
              bt.pod3Id === userPod.id)
        );
        if (!userBracketTeam) {
          bracketFinishByTournament.set(tid, null);
          continue;
        }

        const tMatches = allBracketMatches.filter((m) => m.tournamentId === tid);

        const champMatch = tMatches
          .filter((m) => m.bracketType === "championship")
          .sort((a, b) => b.gameNumber - a.gameNumber)[0];

        const losersFinal = tMatches
          .filter((m) => m.bracketType === "losers")
          .sort((a, b) => b.gameNumber - a.gameNumber)[0];

        const btId = userBracketTeam.id;
        let finish: BracketFinish | null = null;

        if (champMatch) {
          const champWinnerId =
            (champMatch.teamAScore ?? 0) > (champMatch.teamBScore ?? 0)
              ? champMatch.teamAId
              : champMatch.teamBId;
          const champLoserId =
            champWinnerId === champMatch.teamAId
              ? champMatch.teamBId
              : champMatch.teamAId;

          if (btId === champWinnerId) {
            finish = "Champions";
          } else if (btId === champLoserId) {
            finish = "Runner-up";
          } else if (losersFinal) {
            const losersWinnerId =
              (losersFinal.teamAScore ?? 0) > (losersFinal.teamBScore ?? 0)
                ? losersFinal.teamAId
                : losersFinal.teamBId;
            finish = btId === losersWinnerId ? "3rd Place" : "Lost in Bracket";
          } else {
            finish = "Lost in Bracket";
          }
        }

        bracketFinishByTournament.set(tid, finish);
      }
    }

    // 5. Assemble history
    const history: TournamentHistoryEntry[] = userTournaments.map((t) => {
      const pod = podByTournament.get(t.id) ?? null;
      const standing = pod ? standingByPod.get(pod.id) ?? null : null;

      return {
        tournament: {
          id: t.id,
          name: t.name,
          slug: t.slug,
          date: t.date,
          location: t.location ?? null,
          status: t.status,
          level: t.level ?? null,
        },
        role: t.role as "organizer" | "participant",
        pod: pod
          ? {
              player1: pod.player1,
              player2: pod.player2 ?? null,
              player3: pod.player3 ?? null,
              teamName: pod.teamName ?? null,
            }
          : null,
        poolRecord: standing
          ? { wins: standing.wins ?? 0, losses: standing.losses ?? 0 }
          : null,
        bracketFinish: bracketFinishByTournament.get(t.id) ?? null,
      };
    });

    // 6. Compute aggregates (completed participant tournaments only)
    let totalWins = 0;
    let totalLosses = 0;
    let tournamentsPlayed = 0;

    for (const entry of history) {
      if (
        entry.tournament.status === "completed" &&
        entry.role === "participant"
      ) {
        tournamentsPlayed++;
        if (entry.poolRecord) {
          totalWins += entry.poolRecord.wins;
          totalLosses += entry.poolRecord.losses;
        }
      }
    }

    const totalGames = totalWins + totalLosses;
    const winPercentage =
      totalGames > 0 ? Math.round((totalWins / totalGames) * 100) : 0;

    return {
      history,
      aggregates: { tournamentsPlayed, totalWins, totalLosses, winPercentage },
    };
  } catch (error) {
    console.error("Error fetching user tournament stats:", error);
    return empty;
  }
}
