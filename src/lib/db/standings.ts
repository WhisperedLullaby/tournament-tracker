/**
 * Utilities for updating pool standings based on completed games
 */

import { db } from "./index";
import { poolStandings } from "./schema";
import { eq } from "drizzle-orm";

/**
 * Updates pool standings for all pods involved in a completed game
 * @param teamAPods - Array of pod IDs on Team A
 * @param teamBPods - Array of pod IDs on Team B
 * @param teamAScore - Final score for Team A
 * @param teamBScore - Final score for Team B
 */
export async function updatePoolStandings(
  teamAPods: number[],
  teamBPods: number[],
  teamAScore: number,
  teamBScore: number
) {
  const teamAWon = teamAScore > teamBScore;
  const winningPods = teamAWon ? teamAPods : teamBPods;
  const losingPods = teamAWon ? teamBPods : teamAPods;
  const winningScore = teamAWon ? teamAScore : teamBScore;
  const losingScore = teamAWon ? teamBScore : teamAScore;

  // Update standings for winning pods
  for (const podId of winningPods) {
    await updatePodStanding(podId, true, winningScore, losingScore);
  }

  // Update standings for losing pods
  for (const podId of losingPods) {
    await updatePodStanding(podId, false, losingScore, winningScore);
  }
}

/**
 * Updates or creates a standing record for a single pod
 * @param podId - The pod ID to update
 * @param won - Whether the pod won this game
 * @param pointsFor - Points scored by this pod's team
 * @param pointsAgainst - Points scored by the opposing team
 */
async function updatePodStanding(
  podId: number,
  won: boolean,
  pointsFor: number,
  pointsAgainst: number
) {
  try {
    // Check if standing exists
    const existing = await db
      .select()
      .from(poolStandings)
      .where(eq(poolStandings.podId, podId))
      .limit(1);

    if (existing.length > 0) {
      // Update existing standing
      const current = existing[0];
      await db
        .update(poolStandings)
        .set({
          wins: won ? current.wins + 1 : current.wins,
          losses: won ? current.losses : current.losses + 1,
          pointsFor: current.pointsFor + pointsFor,
          pointsAgainst: current.pointsAgainst + pointsAgainst,
        })
        .where(eq(poolStandings.podId, podId));
    } else {
      // Create new standing
      await db.insert(poolStandings).values({
        podId,
        wins: won ? 1 : 0,
        losses: won ? 0 : 1,
        pointsFor,
        pointsAgainst,
      });
    }
  } catch (error) {
    // Log error but don't throw - this allows the game to complete even if a pod doesn't exist
    console.error(`Warning: Failed to update standings for pod ${podId}:`, error);
    console.error(
      `This pod may not exist in the database. Check your game schedule data.`
    );
  }
}
