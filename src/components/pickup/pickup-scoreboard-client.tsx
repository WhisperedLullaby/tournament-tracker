"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/auth/client";
import { ScoreCelebration } from "@/components/celebrations/score-celebration";
import { formatPosition } from "@/lib/pickup/positions";

export type ScoreboardPlayer = {
  id: number;
  displayName: string;
  position: string;
};

export type ScoreboardData = {
  sessionId: number;
  sessionTitle: string;
  status: string;
  activeSeries: {
    id: number;
    seriesNumber: number;
    teamASeriesWins: number;
    teamBSeriesWins: number;
    teamA: ScoreboardPlayer[];
    teamB: ScoreboardPlayer[];
    activeGame: {
      id: number;
      gameNumber: number;
      teamAScore: number;
      teamBScore: number;
    } | null;
  } | null;
};

const FLASH_DURATION = 2800;

type Props = {
  sessionId: number;
  initialData: ScoreboardData;
};

export function PickupScoreboardClient({ sessionId, initialData }: Props) {
  const [data, setData] = useState<ScoreboardData>(initialData);
  const [flashA, setFlashA] = useState(false);
  const [flashB, setFlashB] = useState(false);
  const prevARef = useRef(initialData.activeSeries?.activeGame?.teamAScore ?? 0);
  const prevBRef = useRef(initialData.activeSeries?.activeGame?.teamBScore ?? 0);
  const timerARef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerBRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = createClient();

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/pickup/${sessionId}/scoreboard`);
      if (res.ok) {
        const json: ScoreboardData = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error("Pickup scoreboard fetch error:", err);
    }
  }, [sessionId]);

  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchData, 500);
  }, [fetchData]);

  useEffect(() => {
    const scoreA = data.activeSeries?.activeGame?.teamAScore ?? 0;
    const scoreB = data.activeSeries?.activeGame?.teamBScore ?? 0;

    if (scoreA !== prevARef.current) {
      prevARef.current = scoreA;
      if (timerARef.current) clearTimeout(timerARef.current);
      setFlashA(true);
      timerARef.current = setTimeout(() => setFlashA(false), FLASH_DURATION);
    }

    if (scoreB !== prevBRef.current) {
      prevBRef.current = scoreB;
      if (timerBRef.current) clearTimeout(timerBRef.current);
      setFlashB(true);
      timerBRef.current = setTimeout(() => setFlashB(false), FLASH_DURATION);
    }
  }, [data]);

  useEffect(() => {
    const channel = supabase
      .channel(`pickup-scoreboard-${sessionId}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pickup_games" },
        debouncedFetch
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pickup_series" },
        debouncedFetch
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (timerARef.current) clearTimeout(timerARef.current);
      if (timerBRef.current) clearTimeout(timerBRef.current);
    };
  }, [supabase, sessionId, debouncedFetch]);

  const series = data.activeSeries;
  const activeGame = series?.activeGame ?? null;
  const scoreA = activeGame?.teamAScore ?? 0;
  const scoreB = activeGame?.teamBScore ?? 0;

  return (
    <div className="dark">
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="flex flex-col items-center pt-10 pb-2 gap-2 shrink-0">
          <h1 className="text-xl font-bold tracking-[0.2em] text-foreground/60 uppercase">
            {data.sessionTitle}
          </h1>
          <motion.div
            className="h-px w-24 mt-1"
            style={{
              background:
                "linear-gradient(to right, transparent, rgba(74,86,81,0.4) 20%, rgba(74,86,81,0.4) 80%, transparent)",
            }}
            animate={{
              filter: [
                "drop-shadow(0 0 0px rgba(200,165,70,0))",
                "drop-shadow(0 0 3px rgba(200,165,70,0.45))",
                "drop-shadow(0 0 0px rgba(200,165,70,0))",
              ],
            }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
          {series && (
            <p className="text-xs text-muted-foreground tracking-[0.3em] uppercase mt-1">
              {activeGame
                ? `Series ${series.seriesNumber} · Game ${activeGame.gameNumber}`
                : `Series ${series.seriesNumber}`}
            </p>
          )}
        </header>

        {/* Score area */}
        {series && activeGame ? (
          <>
            <div className="flex flex-1 items-center justify-center w-full px-8">
              {/* Team A */}
              <div className="relative flex flex-col items-center justify-center flex-1 gap-6 overflow-hidden">
                <AnimatePresence>
                  {flashA && (
                    <motion.div
                      key="flash-a"
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <ScoreCelebration />
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="relative z-10 text-3xl font-semibold text-foreground/70 text-center uppercase tracking-widest leading-tight">
                  Team A
                </p>
                <motion.p
                  key={scoreA}
                  initial={{ scale: 1.25 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" as const }}
                  className="relative z-10 text-11xl leading-none font-bold text-primary tabular-nums select-none"
                >
                  {scoreA}
                </motion.p>

                {/* Series wins pips */}
                <div className="relative z-10 flex gap-2">
                  {Array.from({ length: series.teamASeriesWins }).map((_, i) => (
                    <div key={i} className="h-3 w-3 rounded-full bg-primary" />
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="flex flex-col items-center justify-center gap-3 px-6 shrink-0">
                <motion.div
                  className="h-40 w-px"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent, rgba(74,86,81,0.5) 20%, rgba(74,86,81,0.5) 80%, transparent)",
                  }}
                  animate={{
                    filter: [
                      "drop-shadow(0 0 0px rgba(200,165,70,0))",
                      "drop-shadow(0 0 3px rgba(200,165,70,0.45))",
                      "drop-shadow(0 0 0px rgba(200,165,70,0))",
                    ],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-[0.3em]">
                  vs
                </span>
                <motion.div
                  className="h-40 w-px"
                  style={{
                    background:
                      "linear-gradient(to bottom, transparent, rgba(74,86,81,0.5) 20%, rgba(74,86,81,0.5) 80%, transparent)",
                  }}
                  animate={{
                    filter: [
                      "drop-shadow(0 0 0px rgba(200,165,70,0))",
                      "drop-shadow(0 0 3px rgba(200,165,70,0.45))",
                      "drop-shadow(0 0 0px rgba(200,165,70,0))",
                    ],
                  }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              {/* Team B */}
              <div className="relative flex flex-col items-center justify-center flex-1 gap-6 overflow-hidden">
                <AnimatePresence>
                  {flashB && (
                    <motion.div
                      key="flash-b"
                      className="absolute inset-0"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.35 }}
                    >
                      <ScoreCelebration />
                    </motion.div>
                  )}
                </AnimatePresence>

                <p className="relative z-10 text-3xl font-semibold text-foreground/70 text-center uppercase tracking-widest leading-tight">
                  Team B
                </p>
                <motion.p
                  key={scoreB}
                  initial={{ scale: 1.25 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.35, ease: "easeOut" as const }}
                  className="relative z-10 text-11xl leading-none font-bold text-primary tabular-nums select-none"
                >
                  {scoreB}
                </motion.p>

                {/* Series wins pips */}
                <div className="relative z-10 flex gap-2">
                  {Array.from({ length: series.teamBSeriesWins }).map((_, i) => (
                    <div key={i} className="h-3 w-3 rounded-full bg-primary" />
                  ))}
                </div>
              </div>
            </div>

            {/* Player lists */}
            <div className="grid grid-cols-2 gap-6 px-8 pb-10 max-w-2xl mx-auto w-full">
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#9b6b6b]">
                  Team A
                </p>
                <ul className="space-y-1">
                  {series.teamA.map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground/80">{p.displayName}</span>
                      <span className="text-xs text-muted-foreground">{formatPosition(p.position)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#6b7c9b]">
                  Team B
                </p>
                <ul className="space-y-1">
                  {series.teamB.map((p) => (
                    <li key={p.id} className="flex items-center justify-between text-sm">
                      <span className="font-medium text-foreground/80">{p.displayName}</span>
                      <span className="text-xs text-muted-foreground">{formatPosition(p.position)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center flex-col gap-4">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-pulse" />
            <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">
              {data.status === "completed"
                ? "Session complete"
                : "Waiting for game to start"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
