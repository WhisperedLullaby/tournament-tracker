"use client";

import React, { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil } from "lucide-react";
import { useTournament } from "@/contexts/tournament-context";
import { ScoreEntryModal } from "@/components/score-entry-modal";
import type { PoolMatch } from "@/lib/db/schema";

interface ScheduleTableProps {
  matches: PoolMatch[];
  podNames: Map<number, string>; // Map of pod ID to team name
}

export function ScheduleTable({ matches, podNames }: ScheduleTableProps) {
  const [filterPod, setFilterPod] = useState<number | null>(null);
  const [editMatch, setEditMatch] = useState<PoolMatch | null>(null);
  const shouldReduceMotion = useReducedMotion();
  const { isOrganizer } = useTournament();

  // Get unique pod IDs from podNames map and sort them
  const allPodIds = Array.from(podNames.keys()).sort((a, b) => a - b);

  // Map DB IDs to relative pod numbers (1, 2, 3...) for fallback display
  const podNumberMap = new Map<number, number>();
  allPodIds.forEach((id, index) => podNumberMap.set(id, index + 1));

  // Filter by pod - only show games where pod is playing (not sitting)
  const filteredMatches = filterPod
    ? matches.filter(
        (match) =>
          (Array.isArray(match.teamAPods) &&
            (match.teamAPods as number[]).includes(filterPod)) ||
          (Array.isArray(match.teamBPods) &&
            (match.teamBPods as number[]).includes(filterPod))
      )
    : matches;

  // Format pods as team names
  const formatTeamNames = (pods: number[] | null | undefined): string => {
    if (!pods || !Array.isArray(pods) || pods.length === 0) {
      return "TBD";
    }
    return pods
      .map((podId) => podNames.get(podId) || `Pod ${podNumberMap.get(podId) ?? podId}`)
      .join(", ");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground">
            Completed
          </Badge>
        );
      case "in_progress":
        return (
          <Badge className="bg-primary text-primary-foreground">
            In Progress
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Pending
          </Badge>
        );
    }
  };

  const getRowClassName = (status: string) => {
    switch (status) {
      case "completed":
        return "opacity-60 odd:bg-muted/20";
      case "in_progress":
        return "bg-primary/10 font-medium";
      default:
        return "odd:bg-muted/30";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pool Play Schedule</CardTitle>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant={filterPod === null ? "default" : "outline"}
            size="sm"
            onClick={() => setFilterPod(null)}
          >
            All Pods
          </Button>
          {allPodIds.map((pod) => (
            <Button
              key={pod}
              variant={filterPod === pod ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterPod(pod)}
            >
              {podNames.get(pod) || `Pod ${podNumberMap.get(pod) ?? pod}`}
            </Button>
          ))}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Game</TableHead>
                <TableHead className="w-24">Time</TableHead>
                <TableHead>Team A</TableHead>
                <TableHead className="w-12 text-center">vs</TableHead>
                <TableHead>Team B</TableHead>
                <TableHead>Sitting</TableHead>
                <TableHead className="w-32">Status</TableHead>
                {isOrganizer && <TableHead className="w-12" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatches.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={isOrganizer ? 8 : 7}
                    className="text-muted-foreground text-center"
                  >
                    No games found for this pod
                  </TableCell>
                </TableRow>
              ) : (
                filteredMatches.map((match) => (
                  <TableRow
                    key={match.id}
                    className={getRowClassName(match.status)}
                  >
                    <TableCell className="font-medium">
                      {match.gameNumber}
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      {match.scheduledTime || "TBD"}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>
                          {formatTeamNames(match.teamAPods as number[])}
                        </span>
                        {match.status !== "pending" && (
                          <motion.span
                            key={`${match.id}-a-${match.teamAScore}`}
                            initial={shouldReduceMotion ? {} : { scale: 1.2, opacity: 0.7, filter: "drop-shadow(0 0 4px rgba(200,165,70,0.6))" }}
                            animate={{ scale: 1, opacity: 1, filter: "drop-shadow(0 0 0px rgba(200,165,70,0))" }}
                            transition={{ duration: 0.35 }}
                            className="text-primary mt-1 text-sm font-semibold"
                          >
                            {match.teamAScore}
                          </motion.span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-center">
                      vs
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span>
                          {formatTeamNames(match.teamBPods as number[])}
                        </span>
                        {match.status !== "pending" && (
                          <motion.span
                            key={`${match.id}-b-${match.teamBScore}`}
                            initial={shouldReduceMotion ? {} : { scale: 1.2, opacity: 0.7, filter: "drop-shadow(0 0 4px rgba(200,165,70,0.6))" }}
                            animate={{ scale: 1, opacity: 1, filter: "drop-shadow(0 0 0px rgba(200,165,70,0))" }}
                            transition={{ duration: 0.35 }}
                            className="text-primary mt-1 text-sm font-semibold"
                          >
                            {match.teamBScore}
                          </motion.span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatTeamNames(match.sittingPods as number[])}
                    </TableCell>
                    <TableCell>{getStatusBadge(match.status)}</TableCell>
                    {isOrganizer && (
                      <TableCell>
                        {match.status === "in_progress" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditMatch(match)}
                            aria-label="Edit score"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      {isOrganizer && editMatch && (
        <ScoreEntryModal
          open={editMatch !== null}
          onOpenChange={(open) => {
            if (!open) setEditMatch(null);
          }}
          matchId={editMatch.id}
          matchType="pool"
          teamAName={formatTeamNames(editMatch.teamAPods as number[])}
          teamBName={formatTeamNames(editMatch.teamBPods as number[])}
          initialScoreA={editMatch.teamAScore}
          initialScoreB={editMatch.teamBScore}
        />
      )}
    </Card>
  );
}
