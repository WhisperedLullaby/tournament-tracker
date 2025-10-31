"use client";

import React, { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock } from "lucide-react";

interface NextUpProps {
  nextGamePods: number[] | null; // Combined pods from next game
  nextGameTime?: string;
  podNames: Map<number, string>; // Map of pod ID to team name
}

export function NextUp({ nextGamePods, nextGameTime, podNames }: NextUpProps) {
  // Randomize the pod order so players can't guess matchups
  const randomizedPods = useMemo(() => {
    if (!nextGamePods) return [];

    // Create a copy and shuffle using Fisher-Yates algorithm
    const shuffled = [...nextGamePods];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }, [nextGamePods]);

  // Generate random color classes for badges
  const getColorClass = (index: number) => {
    const colors = [
      "bg-blue-100 text-blue-800 border-blue-300",
      "bg-green-100 text-green-800 border-green-300",
      "bg-purple-100 text-purple-800 border-purple-300",
      "bg-orange-100 text-orange-800 border-orange-300",
      "bg-pink-100 text-pink-800 border-pink-300",
      "bg-indigo-100 text-indigo-800 border-indigo-300",
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
              {randomizedPods.map((podId, index) => (
                <Badge
                  key={`${podId}-${index}`}
                  variant="outline"
                  className={`px-3 py-2 text-sm font-semibold border-2 ${getColorClass(index)}`}
                >
                  {podNames.get(podId) || `Pod ${podId}`}
                </Badge>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t">
            <p className="text-xs text-muted-foreground italic">
              Teams are randomized • Check the schedule to see your full team
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
