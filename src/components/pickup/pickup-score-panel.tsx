"use client";

import { Card } from "@/components/ui/card";

interface PickupScorePanelProps {
  label: string;
  score: number;
  onIncrement: () => void;
  onDecrement: () => void;
  side: "A" | "B";
  disabled?: boolean;
}

export function PickupScorePanel({
  label,
  score,
  onIncrement,
  onDecrement,
  side,
  disabled = false,
}: PickupScorePanelProps) {
  const colorStyles =
    side === "A"
      ? "bg-[#9b6b6b] text-white border-[#7d5858]"
      : "bg-[#6b7c9b] text-white border-[#58647d]";

  return (
    <Card className={`${colorStyles} border-2 overflow-hidden shadow-lg`}>
      <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-black/10 border-b-2 border-black/20">
        <h2 className="text-sm sm:text-base lg:text-lg font-bold text-center tracking-wide uppercase truncate">
          {label}
        </h2>
      </div>

      <div className="relative h-[180px] sm:h-[260px] select-none">
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`text-[120px] sm:text-[180px] font-mono font-bold leading-none ${
              disabled ? "opacity-50" : ""
            }`}
            style={{ letterSpacing: "0.05em" }}
          >
            {score}
          </div>
        </div>

        <div className="absolute top-1/2 left-0 right-0 h-px bg-black/20 pointer-events-none" />

        <button
          onClick={onIncrement}
          disabled={disabled}
          className={`absolute top-0 left-0 right-0 h-1/2 ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
          aria-label="Increment score"
        />

        <button
          onClick={onDecrement}
          disabled={disabled || score === 0}
          className={`absolute bottom-0 left-0 right-0 h-1/2 ${
            disabled || score === 0 ? "cursor-not-allowed" : "cursor-pointer"
          }`}
          aria-label="Decrement score"
        />
      </div>

      <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-black/10 border-t-2 border-black/20">
        <p className="text-center text-[10px] sm:text-xs font-medium opacity-75">
          Tap top to add • Tap bottom to subtract
        </p>
      </div>
    </Card>
  );
}
