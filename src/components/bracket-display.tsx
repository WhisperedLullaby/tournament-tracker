"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Trophy, Clock } from "lucide-react";
import type { BracketMatch, BracketTeam } from "@/lib/db/schema";

interface BracketDisplayProps {
  matches: BracketMatch[];
  teams: BracketTeam[];
  pods: Map<number, string>;
}

export function BracketDisplay({ matches, teams, pods }: BracketDisplayProps) {
  // Helper to get team name by ID
  const getTeamName = (teamId: number | null): string => {
    if (!teamId) return "TBD";
    const team = teams.find((t) => t.id === teamId);
    return team?.teamName || "TBD";
  };

  // Helper to get team display with pods
  const getTeamDisplay = (teamId: number | null): string => {
    if (!teamId) return "TBD";
    const team = teams.find((t) => t.id === teamId);
    if (!team) return "TBD";

    const pod1 = pods.get(team.pod1Id) || `Pod ${team.pod1Id}`;
    const pod2 = pods.get(team.pod2Id) || `Pod ${team.pod2Id}`;
    const pod3 = pods.get(team.pod3Id) || `Pod ${team.pod3Id}`;

    return `${pod1} • ${pod2} • ${pod3}`;
  };

  // Get matches by game number
  const getMatch = (gameNum: number) =>
    matches.find((m) => m.gameNumber === gameNum);

  const game1 = getMatch(1);
  const game2 = getMatch(2);
  const game3 = getMatch(3);
  const game4 = getMatch(4);
  const game5 = getMatch(5);

  // Match card component
  const MatchCard = ({
    match,
    label,
    className = "",
  }: {
    match?: BracketMatch;
    label: string;
    className?: string;
  }) => {
    if (!match) {
      return (
        <Card className={`border-muted border-2 border-dashed ${className}`}>
          <CardContent className="p-3">
            <div className="text-muted-foreground mb-2 text-center text-xs font-medium">
              {label}
            </div>
            <div className="text-muted-foreground py-4 text-center text-sm">
              Conditional
            </div>
          </CardContent>
        </Card>
      );
    }

    const isComplete = match.status === "completed";
    const isInProgress = match.status === "in_progress";
    const isPending = match.status === "pending";

    const teamAName = getTeamName(match.teamAId);
    const teamBName = getTeamName(match.teamBId);
    const teamAWon = isComplete && match.teamAScore > match.teamBScore;
    const teamBWon = isComplete && match.teamBScore > match.teamAScore;

    return (
      <Card
        className={`border-2 transition-all ${
          isInProgress
            ? "border-primary bg-primary/5 shadow-lg"
            : isComplete
              ? "border-green-500/30 bg-green-500/5"
              : "border-muted"
        } ${className}`}
      >
        <CardContent className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-muted-foreground text-xs font-medium">
              {label}
            </div>
            {isInProgress && (
              <Clock className="text-primary h-3 w-3 animate-pulse" />
            )}
            {isComplete && <Trophy className="h-3 w-3 text-green-600" />}
          </div>

          {/* Team A */}
          <div
            className={`flex items-center justify-between rounded-t border-b p-2 ${
              teamAWon
                ? "border-green-500/30 bg-green-500/10"
                : isPending && !match.teamAId
                  ? "bg-muted/30 border-muted"
                  : "bg-background border-muted"
            }`}
            title={match.teamAId ? getTeamDisplay(match.teamAId) : undefined}
          >
            <span
              className={`truncate text-sm font-medium ${
                teamAWon ? "text-green-600 dark:text-green-400" : ""
              } ${!match.teamAId ? "text-muted-foreground italic" : ""}`}
            >
              {teamAName}
            </span>
            <span
              className={`ml-2 text-sm font-bold ${
                teamAWon ? "text-green-600 dark:text-green-400" : ""
              }`}
            >
              {match.teamAScore}
            </span>
          </div>

          {/* Team B */}
          <div
            className={`flex items-center justify-between rounded-b p-2 ${
              teamBWon
                ? "border-green-500/30 bg-green-500/10"
                : isPending && !match.teamBId
                  ? "bg-muted/30 border-muted"
                  : "bg-background border-muted"
            }`}
            title={match.teamBId ? getTeamDisplay(match.teamBId) : undefined}
          >
            <span
              className={`truncate text-sm font-medium ${
                teamBWon ? "text-green-600 dark:text-green-400" : ""
              } ${!match.teamBId ? "text-muted-foreground italic" : ""}`}
            >
              {teamBName}
            </span>
            <span
              className={`ml-2 text-sm font-bold ${
                teamBWon ? "text-green-600 dark:text-green-400" : ""
              }`}
            >
              {match.teamBScore}
            </span>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[800px] p-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="mb-1 text-2xl font-bold">Tournament Bracket</h2>
          <p className="text-muted-foreground text-sm">
            Double Elimination Format
          </p>
        </div>

        {/* Bracket Grid */}
        <div className="grid grid-cols-4 gap-6">
          {/* Round 1 */}
          <div className="space-y-4">
            <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">
              ROUND 1
            </div>
            <MatchCard match={game1} label="Game 1" />
          </div>

          {/* Round 2 */}
          <div className="space-y-4">
            <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">
              ROUND 2
            </div>
            <MatchCard match={game2} label="Game 2" />
            <div className="h-4" />
            <MatchCard match={game3} label="Game 3 (Losers)" />
          </div>

          {/* Round 3 */}
          <div className="space-y-4">
            <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">
              Winners Finals
            </div>
            <MatchCard match={game4} label="Game 4" />
          </div>

          {/* Championship */}
          <div className="space-y-4">
            <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">
              Bracket Reset
            </div>
            <MatchCard match={game5} label="Game 5 (If Needed)" />
          </div>
        </div>

        {/* Legend */}
        <div className="text-muted-foreground mt-6 flex items-center justify-center gap-6 text-xs">
          <div className="flex items-center gap-2">
            <div className="border-primary bg-primary/5 h-3 w-3 rounded border-2" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded border-2 border-green-500/30 bg-green-500/5" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="border-muted h-3 w-3 rounded border-2 border-dashed" />
            <span>Conditional</span>
          </div>
        </div>
      </div>
    </div>
  );
}
