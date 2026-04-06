"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { createClient } from "@/lib/auth/client";
import type { Tournament } from "@/lib/db/schema";
import type { ScoreboardMatchData } from "./types";
import { ScorePanel } from "./score-panel";
import { FullscreenButton } from "./fullscreen-button";

type Props = {
  tournament: Tournament;
  initialData: ScoreboardMatchData | null;
};

export function ScoreboardClient({ tournament, initialData }: Props) {
  const [data, setData] = useState<ScoreboardMatchData | null>(initialData);
  const supabase = createClient();
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournament.id}/scoreboard`);
      const json: ScoreboardMatchData | null = await res.json();
      setData(json);
    } catch (err) {
      console.error("Scoreboard fetch error:", err);
    }
  }, [tournament.id]);

  const debouncedFetch = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchData, 500);
  }, [fetchData]);

  useEffect(() => {
    const channel = supabase
      .channel(`scoreboard-${tournament.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "pool_matches" },
        debouncedFetch
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "bracket_matches" },
        debouncedFetch
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [supabase, tournament.id, debouncedFetch]);

  return (
    <div className="dark">
      <div className="flex flex-col min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="flex flex-col items-center pt-10 pb-2 gap-2 shrink-0">
          <h1 className="text-xl font-bold tracking-[0.2em] text-foreground/60 uppercase">
            {tournament.name}
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
          {data && (
            <p className="text-xs text-muted-foreground tracking-[0.3em] uppercase mt-1">
              {data.gameLabel}
            </p>
          )}
        </header>

        {/* Score area */}
        {data ? (
          <ScorePanel data={data} />
        ) : (
          <div className="flex flex-1 items-center justify-center flex-col gap-4">
            <div className="h-2 w-2 rounded-full bg-muted-foreground/40 animate-pulse" />
            <p className="text-muted-foreground text-sm tracking-[0.3em] uppercase">
              Waiting for game to start
            </p>
          </div>
        )}

        <FullscreenButton />
      </div>
    </div>
  );
}
