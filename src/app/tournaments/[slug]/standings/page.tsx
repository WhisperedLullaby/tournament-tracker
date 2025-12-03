import { StandingsPageClient } from "@/components/standings-page-client";
import {
  getPoolStandings,
  getPoolMatchesLog,
  isPoolPlayComplete,
  getBracketMatches,
  getBracketTeams,
  getAllPods,
  adaptCombinedNamesToFirstNames,
  getTournamentBySlug,
} from "@/lib/db/queries";
import type { BracketMatch, BracketTeam } from "@/lib/db/schema";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TournamentStandingsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await getTournamentBySlug(slug);

  if (!tournament) {
    notFound();
  }

  const [standings, matchLog, poolComplete] = await Promise.all([
    getPoolStandings(tournament.id),
    getPoolMatchesLog(tournament.id),
    isPoolPlayComplete(tournament.id),
  ]);

  // Fetch bracket data if pool play is complete
  let bracketMatches: BracketMatch[] = [];
  let bracketTeams: BracketTeam[] = [];
  const podNames = new Map<number, string>();

  if (poolComplete) {
    [bracketMatches, bracketTeams] = await Promise.all([
      getBracketMatches(tournament.id),
      getBracketTeams(tournament.id),
    ]);

    // Get all pods for name mapping
    const pods = await getAllPods(tournament.id);
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
