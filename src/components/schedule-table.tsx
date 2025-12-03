"use client";

import React, { useState } from "react";
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
import type { PoolMatch } from "@/lib/db/schema";

interface ScheduleTableProps {
  matches: PoolMatch[];
  podNames: Map<number, string>; // Map of pod ID to team name
}

export function ScheduleTable({ matches, podNames }: ScheduleTableProps) {
  const [filterPod, setFilterPod] = useState<number | null>(null);

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
      .map((podId) => podNames.get(podId) || `Pod ${podId}`)
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
        return "opacity-60";
      case "in_progress":
        return "bg-primary/10 font-medium";
      default:
        return "";
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
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((pod) => (
            <Button
              key={pod}
              variant={filterPod === pod ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterPod(pod)}
            >
              Pod {pod}
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredMatches.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
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
                          <span className="text-primary mt-1 text-sm font-semibold">
                            {match.teamAScore}
                          </span>
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
                          <span className="text-primary mt-1 text-sm font-semibold">
                            {match.teamBScore}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatTeamNames(match.sittingPods as number[])}
                    </TableCell>
                    <TableCell>{getStatusBadge(match.status)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
