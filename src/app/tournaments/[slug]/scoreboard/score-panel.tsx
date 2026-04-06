"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ScoreCelebration } from "@/components/celebrations/score-celebration";
import type { ScoreboardMatchData } from "./types";

// How long the stars play after a score change (ms)
const FLASH_DURATION = 2800;

type Props = {
  data: ScoreboardMatchData;
};

export function ScorePanel({ data }: Props) {
  const [flashA, setFlashA] = useState(false);
  const [flashB, setFlashB] = useState(false);
  const prevARef = useRef(data.teamAScore);
  const prevBRef = useRef(data.teamBScore);
  const timerARef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerBRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (data.teamAScore !== prevARef.current) {
      prevARef.current = data.teamAScore;
      if (timerARef.current) clearTimeout(timerARef.current);
      setFlashA(true);
      timerARef.current = setTimeout(() => setFlashA(false), FLASH_DURATION);
    }
  }, [data.teamAScore]);

  useEffect(() => {
    if (data.teamBScore !== prevBRef.current) {
      prevBRef.current = data.teamBScore;
      if (timerBRef.current) clearTimeout(timerBRef.current);
      setFlashB(true);
      timerBRef.current = setTimeout(() => setFlashB(false), FLASH_DURATION);
    }
  }, [data.teamBScore]);

  useEffect(() => {
    return () => {
      if (timerARef.current) clearTimeout(timerARef.current);
      if (timerBRef.current) clearTimeout(timerBRef.current);
    };
  }, []);

  return (
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
          {data.teamAName}
        </p>
        <motion.p
          key={data.teamAScore}
          initial={{ scale: 1.25 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative z-10 text-11xl leading-none font-bold text-primary tabular-nums select-none"
        >
          {data.teamAScore}
        </motion.p>
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
          {data.teamBName}
        </p>
        <motion.p
          key={data.teamBScore}
          initial={{ scale: 1.25 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="relative z-10 text-11xl leading-none font-bold text-primary tabular-nums select-none"
        >
          {data.teamBScore}
        </motion.p>
      </div>
    </div>
  );
}
