/**
 * Utilities for updating pool standings based on completed games
 */

import { db } from "./index";
import { poolStandings } from "./schema";
import { sql } from "drizzle-orm";

/**
 * Updates pool standings for all pods involved in a completed game.
 *
 * Runs in a single transaction so a partial failure rolls back rather than
 * leaving some pods updated and others not. Each pod is upserted atomically
 * (INSERT ... ON CONFLICT), which relies on the unique constraint on
 * (tournament_id, pod_id).
 *
 * @param tournamentId - The tournament ID
 * @param teamAPods - Array of pod IDs on Team A
 * @param teamBPods - Array of pod IDs on Team B
 * @param teamAScore - Final score for Team A
 * @param teamBScore - Final score for Team B
 */
export async function updatePoolStandings(
  tournamentId: number,
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

  await db.transaction(async (tx) => {
    for (const podId of winningPods) {
      await upsertPodStanding(tx, tournamentId, podId, true, winningScore, losingScore);
    }
    for (const podId of losingPods) {
      await upsertPodStanding(tx, tournamentId, podId, false, losingScore, winningScore);
    }
  });
}

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/**
 * Upserts a single pod's standing: creates the row on first game, otherwise
 * increments the running totals. Atomic — no read-then-write race.
 */
async function upsertPodStanding(
  tx: Tx,
  tournamentId: number,
  podId: number,
  won: boolean,
  pointsFor: number,
  pointsAgainst: number
) {
  const winInc = won ? 1 : 0;
  const lossInc = won ? 0 : 1;

  await tx
    .insert(poolStandings)
    .values({
      tournamentId,
      podId,
      wins: winInc,
      losses: lossInc,
      pointsFor,
      pointsAgainst,
    })
    .onConflictDoUpdate({
      target: [poolStandings.tournamentId, poolStandings.podId],
      set: {
        wins: sql`${poolStandings.wins} + ${winInc}`,
        losses: sql`${poolStandings.losses} + ${lossInc}`,
        pointsFor: sql`${poolStandings.pointsFor} + ${pointsFor}`,
        pointsAgainst: sql`${poolStandings.pointsAgainst} + ${pointsAgainst}`,
      },
    });
}
