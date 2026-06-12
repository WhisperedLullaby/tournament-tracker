"use client";

import { useState } from "react";
import type { PickupRegistration } from "@/lib/db/schema";
import { POSITION_ORDER, POSITION_LABELS } from "@/lib/pickup/positions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, X } from "lucide-react";

interface PositionRosterProps {
  positionLimits: Record<string, number>;
  registrations: PickupRegistration[];
  // Organizers can remove anyone; a player can remove themselves. The page
  // decides — the roster just renders the control where this returns true.
  canRemove?: (reg: PickupRegistration) => boolean;
  onRemove?: (reg: PickupRegistration) => Promise<void>;
}

export function PositionRoster({
  positionLimits,
  registrations,
  canRemove,
  onRemove,
}: PositionRosterProps) {
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  const activePositions = POSITION_ORDER.filter(
    (pos) => (positionLimits[pos] ?? 0) > 0
  );

  async function handleRemove(reg: PickupRegistration) {
    if (!onRemove) return;
    setRemovingId(reg.id);
    try {
      await onRemove(reg);
      setConfirmingId(null);
    } finally {
      setRemovingId(null);
    }
  }

  function removeConfirm(reg: PickupRegistration) {
    return (
      <div
        key={reg.id}
        className="flex items-center justify-between gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-2 py-1"
      >
        <span className="truncate text-xs font-medium text-destructive">
          Remove {reg.displayName}?
        </span>
        <div className="flex shrink-0 gap-1">
          <Button
            variant="destructive"
            size="sm"
            className="h-6 px-2 text-xs"
            disabled={removingId === reg.id}
            onClick={() => handleRemove(reg)}
          >
            {removingId === reg.id ? "Removing…" : "Remove"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs"
            disabled={removingId === reg.id}
            onClick={() => setConfirmingId(null)}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  function removeButton(reg: PickupRegistration) {
    if (!onRemove || !canRemove?.(reg)) return null;
    return (
      <Button
        variant="ghost"
        size="sm"
        className="ml-auto h-6 w-6 shrink-0 p-0 text-muted-foreground hover:text-destructive"
        onClick={() => setConfirmingId(reg.id)}
        aria-label={`Remove ${reg.displayName}`}
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {activePositions.map((position) => {
        const limit = positionLimits[position] ?? 0;
        // "attended" still holds the spot once attendance has been taken;
        // "no_show" frees it (the waitlist promotion happens server-side)
        const confirmed = registrations.filter(
          (r) =>
            r.position === position &&
            (r.status === "registered" || r.status === "attended")
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
              {confirmed.map((reg) =>
                confirmingId === reg.id ? (
                  removeConfirm(reg)
                ) : (
                  <div
                    key={reg.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <div className="h-2 w-2 rounded-full bg-green-500 shrink-0" />
                    <span className="truncate">{reg.displayName}</span>
                    {removeButton(reg)}
                  </div>
                )
              )}

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
                  .map((reg) =>
                    confirmingId === reg.id ? (
                      removeConfirm(reg)
                    ) : (
                      <div
                        key={reg.id}
                        className="flex items-center gap-2 text-xs text-amber-700"
                      >
                        <span className="font-mono text-amber-500">
                          #{reg.waitlistPosition}
                        </span>
                        <span className="truncate">{reg.displayName}</span>
                        {removeButton(reg)}
                      </div>
                    )
                  )}
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
