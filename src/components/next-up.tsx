"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface NextUpProps {
  nextGamePods: number[] | null; // Combined pods from next game
  nextGameTime?: string;
  podNames: Map<number, string>; // Map of pod ID to team name
}

export function NextUp({ nextGamePods, nextGameTime, podNames }: NextUpProps) {
  // Display pods in their original order
  const displayPods = nextGamePods || [];

  // Map DB IDs to relative pod numbers for fallback display
  const podNumberMap = new Map<number, number>();
  Array.from(podNames.keys()).sort((a, b) => a - b).forEach((id, index) => podNumberMap.set(id, index + 1));

  // Cycle per-pod through the 5 sage chart tokens defined in globals.css.
  // Class strings must be literal so Tailwind's JIT can see them.
  const getColorClass = (index: number) => {
    const colors = [
      "bg-chart-1/20 text-foreground border-chart-1/50",
      "bg-chart-2/20 text-foreground border-chart-2/60",
      "bg-chart-3/30 text-foreground border-chart-3/70",
      "bg-chart-4/40 text-foreground border-chart-4/70",
      "bg-chart-5/40 text-foreground border-chart-5/70",
    ];
    return colors[index % colors.length];
  };

  if (!nextGamePods || nextGamePods.length === 0) {
    return (
      <Card className="border-2 border-muted">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            On Deck
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground py-4">
            No upcoming games
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-accent">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          On Deck
        </CardTitle>
        {nextGameTime && (
          <p className="text-sm text-muted-foreground">
            Scheduled: {nextGameTime}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground mb-3">
              Court 1 - Next Players:
            </p>
            <div className="flex flex-wrap gap-2">
              {displayPods.map((podId, index) => (
                <Badge
                  key={`${podId}-${index}`}
                  variant="outline"
                  className={`px-3 py-2 text-sm font-semibold border-2 ${getColorClass(index)}`}
                >
                  {podNames.get(podId) || `Pod ${podNumberMap.get(podId) ?? podId}`}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
