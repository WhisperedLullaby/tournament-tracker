"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PoolMatch } from "@/lib/db/schema";

interface CurrentGameProps {
  initialMatch: PoolMatch | null;
  podNames: Map<number, string>; // Map of pod ID to team name
  scheduledTime?: string;
}

export function CurrentGame({
  initialMatch,
  podNames,
  scheduledTime,
}: CurrentGameProps) {
  const [match, setMatch] = useState<PoolMatch | null>(initialMatch);
  const [showCompletedAnimation, setShowCompletedAnimation] = useState(false);

  // Update match when prop changes (from page-level subscription)
  useEffect(() => {
    // Check if game just completed to trigger animation
    if (
      match &&
      initialMatch &&
      match.id === initialMatch.id &&
      match.status !== "completed" &&
      initialMatch.status === "completed"
    ) {
      setShowCompletedAnimation(true);
      setTimeout(() => {
        setShowCompletedAnimation(false);
      }, 4000);
    }

    setMatch(initialMatch);
  }, [initialMatch, match]);

  // Format team names from pod IDs
  const formatTeamNames = (pods: number[] | null | undefined): string => {
    if (!pods || !Array.isArray(pods) || pods.length === 0) {
      return "TBD";
    }
    return pods
      .map((podId) => podNames.get(podId) || `Pod ${podId}`)
      .join(" • ");
  };

  // No current game
  if (!match || match.status !== "in_progress") {
    return (
      <Card className="border-2 border-muted">
        <CardHeader>
          <CardTitle>Current Game</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-2xl font-medium text-muted-foreground mb-2">
            No game in progress
          </p>
          <p className="text-sm text-muted-foreground">
            Next game starts at {scheduledTime || "TBD"}
          </p>
        </CardContent>
      </Card>
    );
  }

  const teamAPods = match.teamAPods as number[];
  const teamBPods = match.teamBPods as number[];
  const winner =
    match.teamAScore > match.teamBScore
      ? "A"
      : match.teamBScore > match.teamAScore
        ? "B"
        : null;

  return (
    <Card
      className={`border-2 ${showCompletedAnimation ? "border-primary animate-pulse" : "border-primary"}`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <span>Game {match.gameNumber}</span>
          {!showCompletedAnimation && (
            <Badge className="bg-primary text-primary-foreground animate-pulse">
              LIVE
            </Badge>
          )}
          {showCompletedAnimation && (
            <Badge className="bg-green-600 text-white">FINAL</Badge>
          )}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {scheduledTime && `Scheduled: ${scheduledTime} • `}Court 1
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Team A */}
          <div
            className={`flex items-center justify-between p-6 rounded-lg border-2 transition-all ${
              showCompletedAnimation && winner === "A"
                ? "bg-primary/20 border-primary"
                : "bg-muted/30 border-muted"
            }`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Team A
              </p>
              <p className="text-lg font-semibold">
                {formatTeamNames(teamAPods)}
              </p>
            </div>
            <div
              className={`text-6xl font-bold tabular-nums ${
                showCompletedAnimation && winner === "A"
                  ? "text-primary"
                  : "text-foreground"
              }`}
            >
              {match.teamAScore}
            </div>
          </div>

          {/* Team B */}
          <div
            className={`flex items-center justify-between p-6 rounded-lg border-2 transition-all ${
              showCompletedAnimation && winner === "B"
                ? "bg-primary/20 border-primary"
                : "bg-muted/30 border-muted"
            }`}
          >
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground mb-1">
                Team B
              </p>
              <p className="text-lg font-semibold">
                {formatTeamNames(teamBPods)}
              </p>
            </div>
            <div
              className={`text-6xl font-bold tabular-nums ${
                showCompletedAnimation && winner === "B"
                  ? "text-primary"
                  : "text-foreground"
              }`}
            >
              {match.teamBScore}
            </div>
          </div>
        </div>

        {showCompletedAnimation && (
          <div className="mt-6 text-center">
            <p className="text-lg font-semibold text-primary">
              Game Complete! Loading next game...
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
