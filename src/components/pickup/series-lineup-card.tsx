"use client";

import { Badge } from "@/components/ui/badge";
import { formatPosition } from "@/lib/pickup/positions";
import type { PickupSeries, PickupRegistration } from "@/lib/db/schema";
import { Users } from "lucide-react";

interface Props {
  series: PickupSeries;
  registrations: PickupRegistration[];
  isCurrent?: boolean;
}

function PlayerList({
  ids,
  registrations,
  label,
  winner,
}: {
  ids: number[];
  registrations: PickupRegistration[];
  label: string;
  winner?: boolean;
}) {
  const regMap = new Map(registrations.map((r) => [r.id, r]));
  return (
    <div
      className={`flex-1 rounded-lg border p-4 ${winner ? "border-primary/60 bg-primary/5" : "bg-muted/30"}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        {winner && (
          <Badge variant="default" className="text-xs">
            Won
          </Badge>
        )}
      </div>
      <ul className="space-y-1.5">
        {ids.map((id) => {
          const reg = regMap.get(id);
          return (
            <li key={id} className="flex items-center justify-between text-sm">
              <span className="font-medium">{reg?.displayName ?? "Unknown"}</span>
              <span className="text-xs text-muted-foreground">
                {reg ? formatPosition(reg.position) : ""}
              </span>
            </li>
          );
        })}
        {ids.length === 0 && (
          <li className="text-sm text-muted-foreground">No players</li>
        )}
      </ul>
    </div>
  );
}

export function SeriesLineupCard({ series, registrations, isCurrent }: Props) {
  const isComplete = series.status === "completed";
  const teamAWon = series.winningSide === "A";
  const teamBWon = series.winningSide === "B";

  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold">Series {series.seriesNumber}</span>
          {isCurrent && (
            <Badge variant="secondary" className="text-xs">
              Current
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isComplete && (
            <span className="text-sm text-muted-foreground">
              {series.teamASeriesWins}–{series.teamBSeriesWins}
            </span>
          )}
          <Badge
            variant={
              series.status === "in_progress"
                ? "default"
                : series.status === "completed"
                  ? "outline"
                  : "secondary"
            }
            className="capitalize"
          >
            {series.status === "in_progress"
              ? "In Progress"
              : series.status === "completed"
                ? "Completed"
                : "Pending"}
          </Badge>
        </div>
      </div>

      <div className="flex gap-3">
        <PlayerList
          ids={series.teamAPlayerIds}
          registrations={registrations}
          label="Team A"
          winner={isComplete && teamAWon}
        />
        <PlayerList
          ids={series.teamBPlayerIds}
          registrations={registrations}
          label="Team B"
          winner={isComplete && teamBWon}
        />
      </div>

      {series.benchPlayerIds.length > 0 && (
        <div className="mt-3">
          <p className="mb-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Bench
          </p>
          <div className="flex flex-wrap gap-1.5">
            {series.benchPlayerIds.map((id) => {
              const reg = registrations.find((r) => r.id === id);
              return (
                <Badge key={id} variant="outline" className="text-xs">
                  {reg?.displayName ?? "Unknown"}
                </Badge>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
