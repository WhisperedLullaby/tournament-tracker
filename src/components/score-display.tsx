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
      <div className="px-2 sm:px-4 py-1.5 sm:py-2 bg-black/10 border-b-2 border-black/20">
        <h2 className="text-sm sm:text-base lg:text-lg font-bold text-center tracking-wide uppercase truncate">
          {teamName}
        </h2>
      </div>

      {/* Score Display Area */}
      <div className="relative h-[200px] sm:h-[280px] select-none">
        {/* Full Score Display - Centered */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div
            className={`text-[140px] sm:text-[200px] font-mono font-bold leading-none ${
              disabled ? "opacity-50" : ""
            }`}
            style={{ letterSpacing: "0.05em" }}
          >
            {score}
          </div>
        </div>

        {/* Horizontal Line - Visual Separator */}
        <div className="absolute top-1/2 left-0 right-0 h-px bg-black/20 pointer-events-none" />

        {/* Top Half - Tap to Increment (Invisible Button) */}
        <button
          onClick={onIncrement}
          disabled={disabled}
          className={`absolute top-0 left-0 right-0 h-1/2 ${
            disabled ? "cursor-not-allowed" : "cursor-pointer"
          }`}
          aria-label="Increment score"
        />

        {/* Bottom Half - Tap to Decrement (Invisible Button) */}
        <button
          onClick={onDecrement}
          disabled={disabled || score === 0}
          className={`absolute bottom-0 left-0 right-0 h-1/2 ${
            disabled || score === 0 ? "cursor-not-allowed" : "cursor-pointer"
          }`}
          aria-label="Decrement score"
        />
      </div>

      {/* Touch Instructions */}
      <div className="px-2 sm:px-3 py-1 sm:py-1.5 bg-black/10 border-t-2 border-black/20">
        <p className="text-center text-[10px] sm:text-xs font-medium opacity-75">
          Tap top to add • Tap bottom to subtract
        </p>
      </div>
    </Card>
  );
}
