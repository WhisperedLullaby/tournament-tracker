"use client";

import React from "react";
import { Card } from "@/components/ui/card";

interface ScoreDisplayProps {
  teamName: string;
  score: number;
  onIncrement: () => void;
  onDecrement: () => void;
  color: "red" | "blue";
  disabled?: boolean;
}

/**
 * ScoreDisplay component - Inspired by Scoreholio's cornhole scoring
 * Tap top half to increment, bottom half to decrement
 * Features large, visible scores optimized for tablet landscape mode
 */
export function ScoreDisplay({
  teamName,
  score,
  onIncrement,
  onDecrement,
  color,
  disabled = false,
}: ScoreDisplayProps) {
  // Muted colors that match the app's sage green theme
  const colorStyles =
    color === "red"
      ? "bg-[#9b6b6b] text-white border-[#7d5858]" // Muted terracotta/dusty red
      : "bg-[#6b7c9b] text-white border-[#58647d]"; // Muted dusty blue

  return (
    <Card className={`${colorStyles} border-2 overflow-hidden shadow-lg`}>
      {/* Team Name Header */}
      <div className="px-4 py-2 bg-black/10 border-b-2 border-black/20">
        <h2 className="text-lg font-bold text-center tracking-wide uppercase">
          {teamName}
        </h2>
      </div>

      {/* Score Display Area */}
      <div className="flex flex-col h-[280px] select-none">
        {/* Top Half - Tap to Increment */}
        <button
          onClick={onIncrement}
          disabled={disabled}
          className={`flex-1 flex items-center justify-center transition-all active:scale-95 ${
            disabled ? "opacity-50 cursor-not-allowed" : "active:bg-white/10"
          }`}
          aria-label="Increment score"
        >
          {/* Large Score Display */}
          <div
            className="text-[120px] font-mono font-bold leading-none"
            style={{ letterSpacing: "0.08em" }}
          >
            {score}
          </div>
        </button>

        {/* Divider Line */}
        <div className="h-px bg-black/20" />

        {/* Bottom Half - Tap to Decrement */}
        <button
          onClick={onDecrement}
          disabled={disabled || score === 0}
          className={`flex-1 flex items-center justify-center transition-all active:scale-95 ${
            disabled || score === 0
              ? "opacity-30 cursor-not-allowed"
              : "active:bg-black/10"
          }`}
          aria-label="Decrement score"
        >
          <span className="text-4xl font-bold opacity-50">−</span>
        </button>
      </div>

      {/* Touch Instructions */}
      <div className="px-3 py-1.5 bg-black/10 border-t-2 border-black/20">
        <p className="text-center text-xs font-medium opacity-75">
          Tap top to add • Tap bottom to subtract
        </p>
      </div>
    </Card>
  );
}
