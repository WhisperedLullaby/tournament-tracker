"use client";

import type { PickupGame } from "@/lib/db/schema";

interface SeriesScoreSummaryProps {
  games: PickupGame[];
  teamASeriesWins: number;
  teamBSeriesWins: number;
  seriesFormat: "best_of_3" | "best_of_5";
}

export function SeriesScoreSummary({
  games,
  teamASeriesWins,
  teamBSeriesWins,
  seriesFormat,
}: SeriesScoreSummaryProps) {
  const winsNeeded = seriesFormat === "best_of_5" ? 3 : 2;
  const maxGames = seriesFormat === "best_of_5" ? 5 : 3;
  const completedGames = games.filter((g) => g.status === "completed");

  function WinPips({ wins }: { wins: number }) {
    return (
      <div className="flex gap-1">
        {Array.from({ length: winsNeeded }).map((_, i) => (
          <div
            key={i}
            className={`h-3 w-3 rounded-full border-2 ${
              i < wins
                ? "bg-foreground border-foreground"
                : "border-muted-foreground bg-transparent"
            }`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card px-4 py-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex flex-col items-start gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#9b6b6b]">
            Team A
          </span>
          <WinPips wins={teamASeriesWins} />
        </div>

        <div className="flex flex-col items-center gap-0.5">
          <span className="text-xs text-muted-foreground">
            {seriesFormat === "best_of_5" ? "Best of 5" : "Best of 3"}
          </span>
          <span className="text-xl font-bold">
            {teamASeriesWins} – {teamBSeriesWins}
          </span>
        </div>

        <div className="flex flex-col items-end gap-1">
          <span className="text-xs font-semibold uppercase tracking-wide text-[#6b7c9b]">
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
              <div
                key={g.id}
                className="flex min-w-[4.5rem] flex-col items-center rounded-md border bg-muted/40 px-2 py-1 text-xs"
              >
                <span className="text-muted-foreground">G{g.gameNumber}</span>
                <span
                  className={`font-bold ${aWon ? "text-[#9b6b6b]" : "text-[#6b7c9b]"}`}
                >
                  {g.teamAScore}–{g.teamBScore}
                </span>
              </div>
            );
          })}
          {completedGames.length < maxGames && (
            <div className="flex min-w-[4.5rem] flex-col items-center rounded-md border border-dashed px-2 py-1 text-xs text-muted-foreground">
              <span>G{completedGames.length + 1}</span>
              <span>–</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
