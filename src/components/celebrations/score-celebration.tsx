"use client";

import { useState } from "react";
import { ShootingStarsCanvas } from "@/components/shooting-stars-canvas";
import { FireworksCanvas } from "./fireworks";
import { RisingEmbersCanvas } from "./rising-embers";
import { SparkleFieldCanvas } from "./sparkle-field";

const CELEBRATIONS = [
  "shooting-stars",
  "fireworks",
  "embers",
  "sparkles",
] as const;

type CelebrationType = (typeof CELEBRATIONS)[number];

export function ScoreCelebration() {
  // Picked once on mount — fresh random every time a score changes
  // (AnimatePresence in score-panel unmounts/remounts this component each time)
  const [type] = useState<CelebrationType>(
    () => CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)]
  );

  if (type === "shooting-stars") return <ShootingStarsCanvas />;
  if (type === "fireworks") return <FireworksCanvas />;
  if (type === "embers") return <RisingEmbersCanvas />;
  return <SparkleFieldCanvas />;
}
