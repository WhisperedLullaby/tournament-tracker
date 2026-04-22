"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { useTournament } from "@/contexts/tournament-context";
import { ScoreEntryModal } from "@/components/score-entry-modal";
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
  const [editOpen, setEditOpen] = useState(false);
  const shouldReduceMotion = useReducedMotion();
  const { isOrganizer } = useTournament();

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

  // Map DB IDs to relative pod numbers for fallback display
  const podNumberMap = new Map<number, number>();
  Array.from(podNames.keys()).sort((a, b) => a - b).forEach((id, index) => podNumberMap.set(id, index + 1));

  // Format team names from pod IDs
  const formatTeamNames = (pods: number[] | null | undefined): string => {
    if (!pods || !Array.isArray(pods) || pods.length === 0) {
      return "TBD";
    }
    return pods
      .map((podId) => podNames.get(podId) || `Pod ${podNumberMap.get(podId) ?? podId}`)
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
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-3">
              <span>Game {match.gameNumber}</span>
              {!showCompletedAnimation && (
                <Badge className="bg-primary text-primary-foreground animate-pulse">
                  LIVE
                </Badge>
              )}
              {showCompletedAnimation && (
                <Badge className="bg-primary text-primary-foreground">
                  FINAL
                </Badge>
              )}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {scheduledTime && `Scheduled: ${scheduledTime} • `}Court 1
            </p>
          </div>
          {isOrganizer && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditOpen(true)}
              aria-label="Edit score"
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
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
            <motion.div
              key={`score-a-${match.teamAScore}`}
              initial={shouldReduceMotion ? {} : { scale: 1.35, filter: "drop-shadow(0 0 12px rgba(200,165,70,0.6))" }}
              animate={{ scale: 1, filter: "drop-shadow(0 0 0px rgba(200,165,70,0))" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`text-6xl font-bold tabular-nums ${
                showCompletedAnimation && winner === "A"
                  ? "text-primary"
                  : "text-foreground"
              }`}
            >
              {match.teamAScore}
            </motion.div>
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
            <motion.div
              key={`score-b-${match.teamBScore}`}
              initial={shouldReduceMotion ? {} : { scale: 1.35, filter: "drop-shadow(0 0 12px rgba(200,165,70,0.6))" }}
              animate={{ scale: 1, filter: "drop-shadow(0 0 0px rgba(200,165,70,0))" }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={`text-6xl font-bold tabular-nums ${
                showCompletedAnimation && winner === "B"
                  ? "text-primary"
                  : "text-foreground"
              }`}
            >
              {match.teamBScore}
            </motion.div>
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
      {isOrganizer && (
        <ScoreEntryModal
          open={editOpen}
          onOpenChange={setEditOpen}
          matchId={match.id}
          matchType="pool"
          teamAName={formatTeamNames(teamAPods)}
          teamBName={formatTeamNames(teamBPods)}
          initialScoreA={match.teamAScore}
          initialScoreB={match.teamBScore}
        />
      )}
    </Card>
  );
}
