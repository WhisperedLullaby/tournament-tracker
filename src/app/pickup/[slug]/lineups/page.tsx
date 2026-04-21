"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { usePickup } from "@/contexts/pickup-context";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { SeriesLineupCard } from "@/components/pickup/series-lineup-card";
import type { PickupSeries, PickupRegistration } from "@/lib/db/schema";
import { Shuffle, Play } from "lucide-react";

export default function LineupsPage() {
  const { session, isOrganizer, isLoading } = usePickup();
  const router = useRouter();

  const [seriesList, setSeriesList] = useState<PickupSeries[]>([]);
  const [registrations, setRegistrations] = useState<PickupRegistration[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [seriesRes, regsRes] = await Promise.all([
      fetch(`/api/pickup/${session.id}/series`),
      fetch(`/api/pickup/${session.id}/registrations`),
    ]);
    const seriesData = await seriesRes.json();
    const regsData = await regsRes.json();
    setSeriesList(seriesData.series ?? []);
    setRegistrations(regsData.registrations ?? []);
    setDataLoading(false);
  }, [session.id]);

  useEffect(() => {
    if (!isLoading && !isOrganizer) {
      router.replace(`/pickup/${session.slug}`);
      return;
    }
    fetchData();
  }, [isLoading, isOrganizer, session.slug, router, fetchData]);

  const currentSeries = seriesList[0]; // sorted desc, so first = latest
  const canGenerate =
    isOrganizer && ["attendance", "active"].includes(session.status);
  const canStart =
    isOrganizer && currentSeries?.status === "pending";

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch(`/api/pickup/${session.id}/series/generate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to generate lineup");
      } else {
        await fetchData();
      }
    } finally {
      setGenerating(false);
    }
  }

  async function handleStart(seriesId: number) {
    setStarting(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/pickup/${session.id}/series/${seriesId}/start`,
        { method: "POST" }
      );
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to start series");
      } else {
        await fetchData();
        router.push(`/pickup/${session.slug}/scorekeeper`);
      }
    } finally {
      setStarting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      <div className="from-primary/10 via-background to-accent/10 border-b bg-gradient-to-br">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shuffle className="h-6 w-6 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">Lineups</h1>
                <p className="text-sm text-muted-foreground">{session.title}</p>
              </div>
            </div>

            {canGenerate && (
              <Button onClick={handleGenerate} disabled={generating}>
                <Shuffle className="mr-2 h-4 w-4" />
                {generating ? "Generating…" : "Generate New Series"}
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-2xl px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {isLoading || dataLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : seriesList.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground">
            <Shuffle className="mx-auto mb-3 h-10 w-10 opacity-30" />
            <p className="font-medium">No lineups yet</p>
            {canGenerate && (
              <p className="mt-1 text-sm">
                Click &quot;Generate New Series&quot; to create the first lineup.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {canStart && currentSeries && (
              <div className="flex justify-end">
                <Button
                  onClick={() => handleStart(currentSeries.id)}
                  disabled={starting}
                  variant="default"
                >
                  <Play className="mr-2 h-4 w-4" />
                  {starting ? "Starting…" : "Start Series"}
                </Button>
              </div>
            )}
            {seriesList.map((s, i) => (
              <SeriesLineupCard
                key={s.id}
                series={s}
                registrations={registrations}
                isCurrent={i === 0}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}
