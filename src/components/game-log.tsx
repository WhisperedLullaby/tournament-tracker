"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, ChevronRight } from "lucide-react";

type StandingsData = {
  podId: number;
  teamName: string | null;
  playerNames: string;
};

type MatchLogData = {
  id: number;
  roundNumber: number;
  teamAPods: number[];
  teamBPods: number[];
  teamAScore: number;
  teamBScore: number;
  updatedAt: Date;
};

interface GameLogProps {
  matchLog: MatchLogData[];
  standings: StandingsData[];
}

export function GameLog({ matchLog, standings }: GameLogProps) {
  const [expandedMatches, setExpandedMatches] = useState<Set<number>>(
    new Set()
  );

  const toggleMatch = (matchId: number) => {
    setExpandedMatches((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(matchId)) {
        newSet.delete(matchId);
      } else {
        newSet.add(matchId);
      }
      return newSet;
    });
  };

  // Create mapping of pod IDs to team numbers based on standings order
  const podToTeamNumber = new Map<number, number>();
  standings.forEach((standing, index) => {
    podToTeamNumber.set(standing.podId, index + 1);
  });

  // Create mapping of pod IDs to team names
  const podToTeamName = new Map<number, string>();
  standings.forEach((standing) => {
    podToTeamName.set(
      standing.podId,
      standing.teamName || standing.playerNames
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Game Log</CardTitle>
      </CardHeader>
      <CardContent>
        {matchLog.length === 0 ? (
          <p className="text-muted-foreground py-8 text-center">
            No completed matches yet. Games will appear here as they are played.
          </p>
        ) : (
          <div className="space-y-3">
            {matchLog.map((match) => {
              const isExpanded = expandedMatches.has(match.id);
              const teamAPods = match.teamAPods as number[];
              const teamBPods = match.teamBPods as number[];

              return (
                <div
                  key={match.id}
                  className="bg-card hover:bg-muted/50 flex flex-col rounded-lg border p-4 transition-colors"
                >
                  {/* Header with round and date */}
                  <div className="text-muted-foreground mb-2 flex items-center gap-2 text-xs">
                    <span className="font-medium">
                      Round {match.roundNumber}
                    </span>
                    <span>•</span>
                    <span>
                      {new Date(match.updatedAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Match display */}
                  <button
                    onClick={() => toggleMatch(match.id)}
                    className="hover:text-primary flex w-full items-start gap-2 text-left transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="mt-1 h-4 w-4 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="mt-1 h-4 w-4 flex-shrink-0" />
                    )}
                    <div className="flex flex-1 flex-wrap items-center gap-3">
                      {/* Team A numbers */}
                      <div className="flex items-center gap-2">
                        {teamAPods.map((podId) => {
                          const teamNum = podToTeamNumber.get(podId);
                          return (
                            <div
                              key={podId}
                              className="text-foreground flex h-7 w-7 items-center justify-center rounded border-2 border-primary font-medium"
                            >
                              {teamNum}
                            </div>
                          );
                        })}
                      </div>

                      {/* Team A score */}
                      <span
                        className={`text-lg font-bold ${
                          match.teamAScore > match.teamBScore
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {match.teamAScore}
                      </span>

                      <span className="text-muted-foreground">vs</span>

                      {/* Team B numbers */}
                      <div className="flex items-center gap-2">
                        {teamBPods.map((podId) => {
                          const teamNum = podToTeamNumber.get(podId);
                          return (
                            <div
                              key={podId}
                              className="text-foreground flex h-7 w-7 items-center justify-center rounded border-2 border-primary font-medium"
                            >
                              {teamNum}
                            </div>
                          );
                        })}
                      </div>

                      {/* Team B score */}
                      <span
                        className={`text-lg font-bold ${
                          match.teamBScore > match.teamAScore
                            ? "text-green-600 dark:text-green-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {match.teamBScore}
                      </span>
                    </div>
                  </button>

                  {/* Expanded view - team names */}
                  {isExpanded && (
                    <div className="text-muted-foreground mt-3 ml-6 space-y-2 text-sm">
                      <div className="flex flex-wrap items-start gap-6">
                        {/* Team A names */}
                        <div className="flex flex-col gap-1">
                          {teamAPods.map((podId) => (
                            <div key={podId} className="text-foreground">
                              {podToTeamName.get(podId)}
                            </div>
                          ))}
                        </div>

                        <div className="text-muted-foreground">vs</div>

                        {/* Team B names */}
                        <div className="flex flex-col gap-1">
                          {teamBPods.map((podId) => (
                            <div key={podId} className="text-foreground">
                              {podToTeamName.get(podId)}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
