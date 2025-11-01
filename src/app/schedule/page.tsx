import { SchedulePageClient } from "@/components/schedule-page-client";
import {
  getCurrentMatches,
  getNextPendingGame,
  getAllPoolMatches,
  isPoolPlayComplete,
  getBracketMatches,
  getBracketTeams,
} from "@/lib/db/queries";
import { db } from "@/lib/db";
import { pods, type BracketMatch, type BracketTeam } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  // Fetch all data in parallel
  const [currentMatches, nextGame, allMatches, allPods, poolComplete] =
    await Promise.all([
      getCurrentMatches(),
      getNextPendingGame(),
      getAllPoolMatches(),
      db.select().from(pods),
      isPoolPlayComplete(),
    ]);

  // Get the current in-progress match (should only be one)
  const currentMatch = currentMatches[0] || null;

  // Fetch bracket data if pool play is complete
  let bracketMatches: BracketMatch[] = [];
  let bracketTeams: BracketTeam[] = [];

  if (poolComplete) {
    [bracketMatches, bracketTeams] = await Promise.all([
      getBracketMatches(),
      getBracketTeams(),
    ]);
  }

  return (
    <SchedulePageClient
      currentMatch={currentMatch}
      nextGame={nextGame}
      allMatches={allMatches}
      allPods={allPods}
      isPoolPlayComplete={poolComplete}
      bracketMatches={bracketMatches}
      bracketTeams={bracketTeams}
    />
  );
}
