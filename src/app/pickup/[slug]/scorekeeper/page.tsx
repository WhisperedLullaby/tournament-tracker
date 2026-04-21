"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePickup } from "@/contexts/pickup-context";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PickupScorePanel } from "@/components/pickup/pickup-score-panel";
import { SeriesScoreSummary } from "@/components/pickup/series-score-summary";
import type { PickupSeries, PickupGame, PickupRegistration } from "@/lib/db/schema";
import { formatPosition } from "@/lib/pickup/positions";
import { Trophy, ArrowLeft } from "lucide-react";

export default function PickupScorekeeperPage() {
  const { session, isOrganizer, isLoading } = usePickup();
  const router = useRouter();

  const [series, setSeries] = useState<PickupSeries | null>(null);
  const [games, setGames] = useState<PickupGame[]>([]);
  const [registrations, setRegistrations] = useState<PickupRegistration[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    const [seriesRes, regsRes] = await Promise.all([
      fetch(`/api/pickup/${session.id}/series`),
      fetch(`/api/pickup/${session.id}/registrations`),
    ]);
    const seriesData = await seriesRes.json();
    const regsData = await regsRes.json();

    const allSeries: PickupSeries[] = seriesData.series ?? [];
    const activeSeries = allSeries.find((s) => s.status === "in_progress") ?? null;
    setSeries(activeSeries);
    setRegistrations(regsData.registrations ?? []);

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

  const regMap = new Map(registrations.map((r) => [r.id, r]));

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

  const isSeriesComplete = series?.status === "completed";
  const gameCount = games.length;
  const completedCount = games.filter((g) => g.status === "completed").length;

  if (isLoading || dataLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <div className="flex flex-1 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (!series && !isSeriesComplete) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <div className="container mx-auto flex flex-1 flex-col items-center justify-center gap-4 px-4 py-16 text-center">
          <p className="text-muted-foreground">No active series. Generate and start a series from the Lineups page.</p>
          <Button asChild variant="outline">
            <Link href={`/pickup/${session.slug}/lineups`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Lineups
            </Link>
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  if (isSeriesComplete && series) {
    const winner = series.winningSide === "A" ? "Team A" : "Team B";
    return (
      <div className="flex min-h-screen flex-col">
        <Navigation />
        <div className="container mx-auto flex flex-1 flex-col items-center justify-center gap-6 px-4 py-16 text-center">
          <Trophy className="h-14 w-14 text-primary" />
          <div>
            <h2 className="text-2xl font-bold">{winner} wins!</h2>
            <p className="mt-1 text-muted-foreground">
              Series {series.seriesNumber} complete — {series.teamASeriesWins}–{series.teamBSeriesWins}
            </p>
          </div>
          <SeriesScoreSummary
            games={games}
            teamASeriesWins={series.teamASeriesWins}
            teamBSeriesWins={series.teamBSeriesWins}
            seriesFormat={session.seriesFormat}
          />
          <div className="flex gap-3">
            <Button asChild variant="outline">
              <Link href={`/pickup/${session.slug}/lineups`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Lineups
              </Link>
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!series) return null;

  const currentScore = activeGame
    ? { a: activeGame.teamAScore, b: activeGame.teamBScore }
    : { a: 0, b: 0 };

  const teamAPlayers = series.teamAPlayerIds
    .map((id) => regMap.get(id))
    .filter(Boolean) as PickupRegistration[];
  const teamBPlayers = series.teamBPlayerIds
    .map((id) => regMap.get(id))
    .filter(Boolean) as PickupRegistration[];

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      <div className="from-primary/10 via-background to-accent/10 border-b bg-gradient-to-br">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">Series {series.seriesNumber}</h1>
                <Badge variant="default">Live</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{session.title}</p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleEndSeries()}
                disabled={saving}
              >
                End Series
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-4 space-y-4">
        {error && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <SeriesScoreSummary
          games={games}
          teamASeriesWins={series.teamASeriesWins}
          teamBSeriesWins={series.teamBSeriesWins}
          seriesFormat={session.seriesFormat}
        />

        {activeGame && (
          <div className="text-center text-sm text-muted-foreground">
            Game {activeGame.gameNumber} of {gameCount}
            {completedCount > 0 && ` • ${completedCount} completed`}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <PickupScorePanel
            label="Team A"
            score={currentScore.a}
            side="A"
            onIncrement={() => handleScore("A", 1)}
            onDecrement={() => handleScore("A", -1)}
            disabled={saving || !activeGame}
          />
          <PickupScorePanel
            label="Team B"
            score={currentScore.b}
            side="B"
            onIncrement={() => handleScore("B", 1)}
            onDecrement={() => handleScore("B", -1)}
            disabled={saving || !activeGame}
          />
        </div>

        {activeGame && (
          <Button
            className="w-full"
            onClick={handleEndGame}
            disabled={saving}
          >
            End Game {activeGame.gameNumber}
          </Button>
        )}

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#9b6b6b]">
              Team A
            </p>
            <ul className="space-y-1">
              {teamAPlayers.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{r.displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatPosition(r.position)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#6b7c9b]">
              Team B
            </p>
            <ul className="space-y-1">
              {teamBPlayers.map((r) => (
                <li key={r.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{r.displayName}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatPosition(r.position)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
