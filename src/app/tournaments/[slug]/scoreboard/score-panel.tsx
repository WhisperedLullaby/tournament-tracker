"use client";

import { motion } from "framer-motion";
import type { ScoreboardMatchData } from "./types";

type Props = {
  data: ScoreboardMatchData;
};

export function ScorePanel({ data }: Props) {
  return (
    <div className="flex flex-1 items-center justify-center w-full px-8">
      {/* Team A */}
      <div className="flex flex-col items-center justify-center flex-1 gap-6">
        <p className="text-3xl font-semibold text-foreground/70 text-center uppercase tracking-widest leading-tight">
          {data.teamAName}
        </p>
        <motion.p
          key={data.teamAScore}
          initial={{ scale: 1.25 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="text-11xl leading-none font-bold text-primary tabular-nums select-none"
        >
          {data.teamAScore}
        </motion.p>
      </div>

      {/* Divider */}
      <div className="flex flex-col items-center justify-center gap-3 px-6 shrink-0">
        <div className="h-40 w-px bg-border/50" />
        <span className="text-xs text-muted-foreground font-medium uppercase tracking-[0.3em]">
          vs
        </span>
        <div className="h-40 w-px bg-border/50" />
      </div>

      {/* Team B */}
      <div className="flex flex-col items-center justify-center flex-1 gap-6">
        <p className="text-3xl font-semibold text-foreground/70 text-center uppercase tracking-widest leading-tight">
          {data.teamBName}
        </p>
        <motion.p
          key={data.teamBScore}
          initial={{ scale: 1.25 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="text-11xl leading-none font-bold text-primary tabular-nums select-none"
        >
          {data.teamBScore}
        </motion.p>
      </div>
    </div>
  );
}
