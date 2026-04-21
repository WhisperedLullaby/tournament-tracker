"use client";

import { POSITION_ORDER, POSITION_LABELS } from "@/lib/pickup/positions";
import { cn } from "@/lib/utils";

interface PositionSelectorProps {
  positionLimits: Record<string, number>;
  registeredCounts: Record<string, number>;
  value: string;
  onChange: (position: string) => void;
}

export function PositionSelector({
  positionLimits,
  registeredCounts,
  value,
  onChange,
}: PositionSelectorProps) {
  const activePositions = POSITION_ORDER.filter(
    (pos) => (positionLimits[pos] ?? 0) > 0
  );

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {activePositions.map((position) => {
        const limit = positionLimits[position] ?? 0;
        const registered = registeredCounts[position] ?? 0;
        const available = Math.max(0, limit - registered);
        const isFull = available === 0;
        const isSelected = value === position;

        return (
          <button
            key={position}
            type="button"
            disabled={isFull}
            onClick={() => !isFull && onChange(position)}
            className={cn(
              "rounded-lg border p-3 text-left transition-all",
              isSelected
                ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                : isFull
                  ? "cursor-not-allowed border-muted bg-muted/30 opacity-50"
                  : "border-border hover:border-primary/50 hover:bg-accent/40 cursor-pointer"
            )}
          >
            <p className="text-sm font-medium leading-tight">
              {POSITION_LABELS[position]}
            </p>
            <p
              className={cn(
                "mt-1 text-xs",
                isFull
                  ? "text-destructive"
                  : available <= 1
                    ? "text-amber-600"
                    : "text-muted-foreground"
              )}
            >
              {isFull ? "Full" : `${available} spot${available !== 1 ? "s" : ""} left`}
            </p>
          </button>
        );
      })}
    </div>
  );
}
