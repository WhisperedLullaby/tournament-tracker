"use client";

import type { PickupGame } from "@/lib/db/schema";

interface SeriesScoreSummaryProps {
  games: PickupGame[];
  teamASeriesWins: number;
  teamBSeriesWins: number;
  seriesFormat: "best_of_3" | "best_of_5";
  variant?: "light" | "dark";
}

export function SeriesScoreSummary({
  games,
  teamASeriesWins,
  teamBSeriesWins,
  seriesFormat,
  variant = "light",
}: SeriesScoreSummaryProps) {
  const winsNeeded = seriesFormat === "best_of_5" ? 3 : 2;
  const maxGames = seriesFormat === "best_of_5" ? 5 : 3;
  const completedGames = games.filter((g) => g.status === "completed");
  const isDark = variant === "dark";

  const containerCls = isDark
    ? "rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm text-white"
    : "rounded-xl border bg-card px-4 py-3 shadow-sm";
  const labelMutedCls = isDark ? "text-white/60" : "text-muted-foreground";
  const gameTileCls = isDark
    ? "flex min-w-[4.5rem] flex-col items-center rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs"
    : "flex min-w-[4.5rem] flex-col items-center rounded-md border bg-muted/40 px-2 py-1 text-xs";
  const dashedTileCls = isDark
    ? "flex min-w-[4.5rem] flex-col items-center rounded-md border border-dashed border-white/20 px-2 py-1 text-xs text-white/50"
    : "flex min-w-[4.5rem] flex-col items-center rounded-md border border-dashed px-2 py-1 text-xs text-muted-foreground";

  function WinPips({ wins }: { wins: number }) {
    return (
      <div className="flex gap-1">
        {Array.from({ length: winsNeeded }).map((_, i) => {
          const filled = i < wins;
          const filledCls = isDark
            ? "bg-white border-white"
            : "bg-foreground border-foreground";
          const emptyCls = isDark
            ? "border-white/40 bg-transparent"
            : "border-muted-foreground bg-transparent";
          return (
            <div
              key={i}
              className={`h-3 w-3 rounded-full border-2 ${filled ? filledCls : emptyCls}`}
            />
          );
        })}
      </div>
    );
  }

  return (
    <div className={containerCls}>
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#c98a8a]">
            Team A
          </span>
          <WinPips wins={teamASeriesWins} />
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span className={`text-xs ${labelMutedCls}`}>
            {seriesFormat === "best_of_5" ? "Best of 5" : "Best of 3"}
          </span>
          <span className="text-xl font-bold">
            {teamASeriesWins} – {teamBSeriesWins}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#8fa3c4]">
            Team B
          </span>
          <WinPips wins={teamBSeriesWins} />
        </div>
      </div>

      {completedGames.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {completedGames.map((g) => {
            const aWon = g.teamAScore > g.teamBScore;
            return (
              <div key={g.id} className={gameTileCls}>
                <span className={labelMutedCls}>G{g.gameNumber}</span>
                <span
                  className={`font-bold ${aWon ? "text-[#c98a8a]" : "text-[#8fa3c4]"}`}
                >
                  {g.teamAScore}–{g.teamBScore}
                </span>
              </div>
            );
          })}
          {completedGames.length < maxGames && (
            <div className={dashedTileCls}>
              <span>G{completedGames.length + 1}</span>
              <span>–</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
