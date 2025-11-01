import { StandingsPageClient } from "@/components/standings-page-client";
import {
  getPoolStandings,
  getPoolMatchesLog,
  isPoolPlayComplete,
  getBracketMatches,
  getBracketTeams,
  getAllPods,
  adaptCombinedNamesToFirstNames,
} from "@/lib/db/queries";
import type { BracketMatch, BracketTeam } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const [standings, matchLog, poolComplete] = await Promise.all([
    getPoolStandings(),
    getPoolMatchesLog(),
    isPoolPlayComplete(),
  ]);

  // Fetch bracket data if pool play is complete
  let bracketMatches: BracketMatch[] = [];
  let bracketTeams: BracketTeam[] = [];
  const podNames = new Map<number, string>();

  if (poolComplete) {
    [bracketMatches, bracketTeams] = await Promise.all([
      getBracketMatches(),
      getBracketTeams(),
    ]);

    // Get all pods for name mapping
    const pods = await getAllPods();
    pods.forEach((pod) => {
      const displayName = pod.teamName
        ? pod.teamName
        : adaptCombinedNamesToFirstNames(pod.playerNames);
      podNames.set(pod.podId, displayName);
    });
  }

  return (
    <StandingsPageClient
      standings={standings}
      matchLog={matchLog}
      isPoolPlayComplete={poolComplete}
      bracketMatches={bracketMatches}
      bracketTeams={bracketTeams}
      podNames={podNames}
    />
  );
}
