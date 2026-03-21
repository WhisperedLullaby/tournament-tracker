import { notFound } from "next/navigation";
import {
  getTournamentBySlug,
  isPoolPlayComplete,
  getCurrentMatches,
  getCurrentBracketMatch,
  getBracketTeams,
  getPodNameMap,
} from "@/lib/db/queries";
import type { ScoreboardMatchData } from "./types";
import { ScoreboardClient } from "./scoreboard-client";

const BRACKET_LABELS: Record<string, string> = {
  winners: "Winners Bracket",
  losers: "Losers Bracket",
  championship: "Championship",
};

export default async function ScoreboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await getTournamentBySlug(slug);

  if (!tournament) notFound();

  const podNameMap = await getPodNameMap(tournament.id);
  const poolComplete = await isPoolPlayComplete(tournament.id);

  let initialData: ScoreboardMatchData | null = null;

  if (!poolComplete) {
    const matches = await getCurrentMatches(tournament.id);
    const match = matches[0] ?? null;

    if (match) {
      initialData = {
        phase: "pool",
        teamAName: match.teamAPods
          .map((id: number) => podNameMap.get(id) ?? `Pod ${id}`)
          .join(" & "),
        teamBName: match.teamBPods
          .map((id: number) => podNameMap.get(id) ?? `Pod ${id}`)
          .join(" & "),
        teamAScore: match.teamAScore,
        teamBScore: match.teamBScore,
        gameLabel: `Pool Play · Round ${match.roundNumber}`,
        matchId: match.id,
      };
    }
  } else {
    const match = await getCurrentBracketMatch(tournament.id);

    if (match) {
      const bracketTeamsList = await getBracketTeams(tournament.id);

      const resolveBracketName = (teamId: number | null): string => {
        if (teamId == null) return "TBD";
        const team = bracketTeamsList.find(t => t.id === teamId);
        if (!team) return "TBD";
        return (
          [team.pod1Id, team.pod2Id, team.pod3Id]
            .filter((pid): pid is number => pid != null)
            .map(pid => podNameMap.get(pid) ?? `Pod ${pid}`)
            .join(" · ") || team.teamName
        );
      };

      initialData = {
        phase: "bracket",
        teamAName: resolveBracketName(match.teamAId),
        teamBName: resolveBracketName(match.teamBId),
        teamAScore: match.teamAScore,
        teamBScore: match.teamBScore,
        gameLabel: BRACKET_LABELS[match.bracketType] ?? match.bracketType,
        matchId: match.id,
      };
    }
  }

  return <ScoreboardClient tournament={tournament} initialData={initialData} />;
}
