"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePickup } from "@/contexts/pickup-context";
import { ScoreDisplay } from "@/components/score-display";
import { SeriesScoreSummary } from "@/components/pickup/series-score-summary";
import { Button } from "@/components/ui/button";
import type { PickupSeries, PickupGame } from "@/lib/db/schema";
import { Trophy, ArrowLeft, CheckCircle } from "lucide-react";

export default function PickupScorekeeperPage() {
  const { session, isOrganizer, isLoading } = usePickup();
  const router = useRouter();

  const [series, setSeries] = useState<PickupSeries | null>(null);
  const [games, setGames] = useState<PickupGame[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    const seriesRes = await fetch(`/api/pickup/${session.id}/series`);
    const seriesData = await seriesRes.json();

    const allSeries: PickupSeries[] = seriesData.series ?? [];
    const activeSeries =
      allSeries.find((s) => s.status === "in_progress") ??
      allSeries.find((s) => s.status === "completed") ??
      null;
    setSeries(activeSeries);

    if (activeSeries) {
      const gRes = await fetch(
        `/api/pickup/${session.id}/series/${activeSeries.id}/games`
      );
      if (gRes.ok) {
        const gData = await gRes.json();
        setGames(gData.games ?? []);
      }
    } else {
      setGames([]);
    }

    setDataLoading(false);
  }, [session.id]);

  useEffect(() => {
    if (!isLoading && !isOrganizer) {
      router.replace(`/pickup/${session.slug}`);
      return;
    }
    fetchData();
    pollRef.current = setInterval(fetchData, 5000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isLoading, isOrganizer, session.slug, router, fetchData]);

  const activeGame =
    games.find((g) => g.status === "in_progress") ??
    games.find((g) => g.status === "pending") ??
    null;

  async function handleScore(side: "A" | "B", delta: 1 | -1) {
    if (!series || !activeGame || saving) return;
    setSaving(true);
    try {
      const res = await fetch(
        `/api/pickup/${session.id}/series/${series.id}/games/${activeGame.id}/score`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ side, delta }),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setGames((prev) =>
          prev.map((g) => (g.id === activeGame.id ? data.game : g))
        );
      } else {
        setError(data.error ?? "Failed to update score");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleEndGame() {
    if (!series || !activeGame || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/pickup/${session.id}/series/${series.id}/games/${activeGame.id}/complete`,
        { method: "POST" }
      );
      const data = await res.json();
      if (res.ok) {
        setSeries(data.series);
        if (data.seriesComplete) {
          setGames((prev) =>
            prev.map((g) => (g.id === activeGame.id ? data.game : g))
          );
        } else {
          await fetchData();
        }
      } else {
        setError(data.error ?? "Failed to end game");
      }
    } finally {
      setSaving(false);
    }
  }

  async function handleEndSeries(winningSide?: "A" | "B") {
    if (!series || saving) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/pickup/${session.id}/series/${series.id}/complete`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(winningSide ? { winningSide } : {}),
        }
      );
      const data = await res.json();
      if (res.ok) {
        setSeries(data.series);
      } else {
        setError(data.error ?? "Failed to end series");
      }
    } finally {
      setSaving(false);
    }
  }

  // Check whether the active game is eligible to be ended based on scoring rules
  function canEndGame(): boolean {
    if (!activeGame || activeGame.status !== "in_progress") return false;
    const { teamAScore, teamBScore } = activeGame;
    const max = Math.max(teamAScore, teamBScore);
    const diff = Math.abs(teamAScore - teamBScore);
    const rules = session.scoringRules;
    const endPoints = rules?.endPoints ?? 25;
    const cap = rules?.cap ?? 27;
    const winByTwo = rules?.winByTwo !== false;
    const winByTwoMet = !winByTwo || diff >= 2;
    return (max >= endPoints && winByTwoMet) || max >= cap;
  }

  if (isLoading || dataLoading) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/40 border-t-white" />
      </div>
    );
  }

  if (!series) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <p className="text-white/80">
          No active series. Generate and start a series from the Lineups page.
        </p>
        <Button asChild variant="outline">
          <Link href={`/pickup/${session.slug}/lineups`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go to Lineups
          </Link>
        </Button>
      </div>
    );
  }

  const isSeriesComplete = series.status === "completed";

  if (isSeriesComplete) {
    const winner = series.winningSide === "A" ? "Team A" : "Team B";
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center gap-6 px-4 py-8 text-center text-white">
        <Trophy className="h-14 w-14 text-yellow-400" />
        <div>
          <h2 className="text-3xl font-bold">{winner} wins!</h2>
          <p className="mt-1 text-white/70">
            Series {series.seriesNumber} complete — {series.teamASeriesWins}–
            {series.teamBSeriesWins}
          </p>
        </div>
        <div className="w-full max-w-md">
          <SeriesScoreSummary
            games={games}
            teamASeriesWins={series.teamASeriesWins}
            teamBSeriesWins={series.teamBSeriesWins}
            seriesFormat={session.seriesFormat}
            variant="dark"
          />
        </div>
        <Button asChild variant="outline">
          <Link href={`/pickup/${session.slug}/lineups`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Lineups
          </Link>
        </Button>
      </div>
    );
  }

  const currentScore = activeGame
    ? { a: activeGame.teamAScore, b: activeGame.teamBScore }
    : { a: 0, b: 0 };
  const gameCount = games.length;
  const completedCount = games.filter((g) => g.status === "completed").length;

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 relative flex flex-col">
      <Link
        href={`/pickup/${session.slug}/lineups`}
        className="absolute top-2 left-2 z-10 text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
        aria-label="Back to lineups"
      >
        <ArrowLeft className="w-5 h-5" />
      </Link>

      <button
        onClick={() => handleEndSeries()}
        disabled={saving}
        className="absolute top-2 right-2 z-10 text-xs uppercase tracking-wide text-white/70 hover:text-white transition-colors px-3 py-1.5 rounded-lg border border-white/20 hover:bg-white/10 disabled:opacity-50"
      >
        End Series
      </button>

      <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-4 py-2 sm:py-4">
        <div className="w-full max-w-5xl flex flex-col items-center gap-2 sm:gap-3">
          <div className="text-center text-white">
            <h1 className="text-xl sm:text-2xl font-bold">
              Series {series.seriesNumber}
              {activeGame && (
                <span className="ml-3 text-white/60 font-normal">
                  Game {activeGame.gameNumber} of {gameCount}
                </span>
              )}
            </h1>
            {completedCount > 0 && (
              <p className="text-xs text-white/50 mt-0.5">
                {completedCount} game{completedCount === 1 ? "" : "s"} completed
              </p>
            )}
          </div>

          <div className="w-full max-w-md">
            <SeriesScoreSummary
              games={games}
              teamASeriesWins={series.teamASeriesWins}
              teamBSeriesWins={series.teamBSeriesWins}
              seriesFormat={session.seriesFormat}
              variant="dark"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-400/40 bg-red-500/20 px-4 py-2 text-sm text-red-100">
              {error}
            </div>
          )}

          <div className="w-full grid grid-cols-2 gap-4 sm:gap-8 max-w-4xl">
            <ScoreDisplay
              teamName="Team A"
              score={currentScore.a}
              onIncrement={() => handleScore("A", 1)}
              onDecrement={() => handleScore("A", -1)}
              color="red"
              disabled={saving || !activeGame}
            />
            <ScoreDisplay
              teamName="Team B"
              score={currentScore.b}
              onIncrement={() => handleScore("B", 1)}
              onDecrement={() => handleScore("B", -1)}
              color="blue"
              disabled={saving || !activeGame}
            />
          </div>

          {activeGame && canEndGame() && (
            <Button
              onClick={handleEndGame}
              disabled={saving}
              size="lg"
              className="bg-primary hover:bg-primary/90 text-white text-base sm:text-lg px-4 sm:px-6 py-4 sm:py-5"
            >
              <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              End Game {activeGame.gameNumber}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
