"use client";

import type { PickupRegistration } from "@/lib/db/schema";
import { POSITION_ORDER, POSITION_LABELS } from "@/lib/pickup/positions";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface PositionRosterProps {
  positionLimits: Record<string, number>;
  registrations: PickupRegistration[];
}

export function PositionRoster({ positionLimits, registrations }: PositionRosterProps) {
  const activePositions = POSITION_ORDER.filter(
    (pos) => (positionLimits[pos] ?? 0) > 0
  );

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {activePositions.map((position) => {
        const limit = positionLimits[position] ?? 0;
        const confirmed = registrations.filter(
          (r) => r.position === position && r.status === "registered"
        );
        const waitlisted = registrations.filter(
          (r) => r.position === position && r.status === "waitlisted"
        );
        const openSpots = Math.max(0, limit - confirmed.length);
        const isFull = confirmed.length >= limit;

        return (
          <div
            key={position}
            className="rounded-lg border bg-card p-4 shadow-sm"
          >
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-sm">{POSITION_LABELS[position]}</h3>
              <Badge
                variant={isFull ? "destructive" : "secondary"}
                className="text-xs"
              >
                {confirmed.length}/{limit}
              </Badge>
            </div>

            <div className="space-y-1.5">
              {confirmed.map((reg) => (
                <div
                  key={reg.id}
                  className="flex items-center gap-2 text-sm"
                >
                  <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                  <span className="truncate">{reg.displayName}</span>
                </div>
              ))}

              {Array.from({ length: openSpots }).map((_, i) => (
                <div
                  key={`open-${i}`}
                  className="flex items-center gap-2 text-sm text-muted-foreground"
                >
                  <div className="h-2 w-2 rounded-full border border-muted-foreground/40 shrink-0" />
                  <span>Open</span>
                </div>
              ))}
            </div>

            {waitlisted.length > 0 && (
              <div className="mt-3 border-t pt-3">
                <p className="mb-1.5 text-xs font-medium text-amber-600">
                  Waitlist ({waitlisted.length})
                </p>
                {waitlisted
                  .sort((a, b) => (a.waitlistPosition ?? 0) - (b.waitlistPosition ?? 0))
                  .map((reg) => (
                    <div
                      key={reg.id}
                      className="flex items-center gap-2 text-xs text-amber-700"
                    >
                      <span className="font-mono text-amber-500">
                        #{reg.waitlistPosition}
                      </span>
                      <span className="truncate">{reg.displayName}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        );
      })}

      {activePositions.length === 0 && (
        <div className="col-span-full flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <Users className="h-8 w-8 opacity-40" />
          <p className="text-sm">No positions configured.</p>
        </div>
      )}
    </div>
  );
}
