import { NextRequest, NextResponse } from "next/server";
import {
  isPoolPlayComplete,
  getCurrentMatches,
  getCurrentBracketMatch,
  getBracketTeams,
  getPodNameMap,
} from "@/lib/db/queries";
import type { ScoreboardMatchData } from "@/app/tournaments/[slug]/scoreboard/types";

const BRACKET_LABELS: Record<string, string> = {
  winners: "Winners Bracket",
  losers: "Losers Bracket",
  championship: "Championship",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ tournamentId: string }> }
) {
  const { tournamentId } = await params;
  const id = parseInt(tournamentId);

  if (isNaN(id)) {
    return NextResponse.json(null);
  }

  const podNameMap = await getPodNameMap(id);
  const poolComplete = await isPoolPlayComplete(id);

  if (!poolComplete) {
    const matches = await getCurrentMatches(id);
    const match = matches[0] ?? null;

    if (!match) return NextResponse.json(null);

    const teamAName = match.teamAPods
      .map((podId: number) => podNameMap.get(podId) ?? `Pod ${podId}`)
      .join(" & ");
    const teamBName = match.teamBPods
      .map((podId: number) => podNameMap.get(podId) ?? `Pod ${podId}`)
      .join(" & ");

    return NextResponse.json({
      phase: "pool",
      teamAName,
      teamBName,
      teamAScore: match.teamAScore,
      teamBScore: match.teamBScore,
      gameLabel: `Pool Play · Round ${match.roundNumber}`,
      matchId: match.id,
    } satisfies ScoreboardMatchData);
  }

  const match = await getCurrentBracketMatch(id);
  if (!match) return NextResponse.json(null);

  const bracketTeamsList = await getBracketTeams(id);

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

  return NextResponse.json({
    phase: "bracket",
    teamAName: resolveBracketName(match.teamAId),
    teamBName: resolveBracketName(match.teamBId),
    teamAScore: match.teamAScore,
    teamBScore: match.teamBScore,
    gameLabel: BRACKET_LABELS[match.bracketType] ?? match.bracketType,
    matchId: match.id,
  } satisfies ScoreboardMatchData);
}
