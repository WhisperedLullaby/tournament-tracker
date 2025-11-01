"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Award } from "lucide-react";
import type { BracketMatch, BracketTeam } from "@/lib/db/schema";

interface BracketStandingsProps {
  matches: BracketMatch[];
  teams: BracketTeam[];
  pods: Map<number, string>;
}

export function BracketStandings({
  matches,
  teams,
  pods,
}: BracketStandingsProps) {
  // Check if bracket is complete
  const finalGame = matches.find((m) => m.gameNumber === 5) || matches.find((m) => m.gameNumber === 4);
  const isBracketComplete = finalGame?.status === "completed";

  if (!isBracketComplete) {
    return (
      <Card className="border-2 border-muted">
        <CardContent className="p-12 text-center">
          <Trophy className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-bold mb-2">Tournament In Progress</h3>
          <p className="text-muted-foreground">
            Final standings will be displayed when the bracket is complete.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Determine final placements
  const getTeamName = (teamId: number | null): string => {
    if (!teamId) return "TBD";
    const team = teams.find((t) => t.id === teamId);
    return team?.teamName || "TBD";
  };

  const getTeamPods = (teamId: number | null): string[] => {
    if (!teamId) return [];
    const team = teams.find((t) => t.id === teamId);
    if (!team) return [];

    return [
      pods.get(team.pod1Id) || `Pod ${team.pod1Id}`,
      pods.get(team.pod2Id) || `Pod ${team.pod2Id}`,
      pods.get(team.pod3Id) || `Pod ${team.pod3Id}`,
    ];
  };

  // Get final match (Game 5 if it exists, otherwise Game 4)
  const game5 = matches.find((m) => m.gameNumber === 5);
  const game4 = matches.find((m) => m.gameNumber === 4);
  const championshipMatch = game5 || game4;

  if (!championshipMatch) return null;

  const championId =
    championshipMatch.teamAScore > championshipMatch.teamBScore
      ? championshipMatch.teamAId
      : championshipMatch.teamBId;

  const runnerUpId =
    championshipMatch.teamAScore > championshipMatch.teamBScore
      ? championshipMatch.teamBId
      : championshipMatch.teamAId;

  // Determine 3rd place (loser of game 3 or team that didn't make finals)
  const game3 = matches.find((m) => m.gameNumber === 3);
  let thirdPlaceId: number | null = null;

  if (game3 && game3.status === "completed") {
    thirdPlaceId =
      game3.teamAScore < game3.teamBScore ? game3.teamAId : game3.teamBId;
  }

  const placements = [
    {
      place: 1,
      teamId: championId,
      label: "Champion",
      icon: Trophy,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      borderColor: "border-yellow-500/30",
    },
    {
      place: 2,
      teamId: runnerUpId,
      label: "Runner-Up",
      icon: Medal,
      color: "text-slate-400",
      bgColor: "bg-slate-400/10",
      borderColor: "border-slate-400/30",
    },
    {
      place: 3,
      teamId: thirdPlaceId,
      label: "Third Place",
      icon: Award,
      color: "text-amber-700",
      bgColor: "bg-amber-700/10",
      borderColor: "border-amber-700/30",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Tournament Results</h2>
        <p className="text-muted-foreground">
          Congratulations to all teams!
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {placements.map((placement) => {
          if (!placement.teamId) return null;

          const teamName = getTeamName(placement.teamId);
          const podNames = getTeamPods(placement.teamId);
          const Icon = placement.icon;

          return (
            <Card
              key={placement.place}
              className={`border-2 ${placement.borderColor} ${placement.bgColor} transition-all hover:shadow-lg`}
            >
              <CardHeader className="text-center pb-3">
                <div className="flex justify-center mb-2">
                  <Icon className={`h-12 w-12 ${placement.color}`} />
                </div>
                <CardTitle className="text-2xl">{teamName}</CardTitle>
                <p className={`text-sm font-medium ${placement.color}`}>
                  {placement.label}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {podNames.map((podName, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-2 rounded bg-background/50"
                    >
                      <div className="bg-primary/20 h-2 w-2 rounded-full" />
                      <p className="text-sm">{podName}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
