"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { GridPattern } from "@/components/ui/grid-pattern";
import { ShootingStarsCanvas } from "@/components/shooting-stars-canvas";
import { cn } from "@/lib/utils";
import type { HomeStats } from "./types";
import { formatEventDate } from "./format";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: 0.15 + i * 0.15,
      ease: "easeOut" as const,
    },
  }),
};

interface StatusPill {
  key: string;
  href: string | null;
  dot: "live" | "open" | "quiet";
  label: string;
}

function buildPills(stats: HomeStats): StatusPill[] {
  const pills: StatusPill[] = [];
  const { tournaments, pickup } = stats;

  if (pickup.live) {
    pills.push({
      key: "pickup-live",
      href: `/pickup/${pickup.live.slug}`,
      dot: "live",
      label:
        pickup.live.status === "active"
          ? `Live now · ${pickup.live.title}`
          : `Check-in open · ${pickup.live.title}`,
    });
  } else if (pickup.next) {
    pills.push(
      pickup.next.openSpots > 0
        ? {
            key: "pickup-next",
            href: `/pickup/${pickup.next.slug}`,
            dot: "open",
            label: `${pickup.next.openSpots} pickup ${pickup.next.openSpots === 1 ? "spot" : "spots"} open · ${formatEventDate(pickup.next.date)}`,
          }
        : {
            key: "pickup-next",
            href: `/pickup/${pickup.next.slug}`,
            dot: "quiet",
            label: `Pickup full · waitlist open · ${formatEventDate(pickup.next.date)}`,
          }
    );
  }

  if (tournaments.live) {
    pills.push({
      key: "tournament-live",
      href: `/tournaments/${tournaments.live.slug}`,
      dot: "live",
      label: `Live now · ${tournaments.live.name}`,
    });
  } else if (tournaments.next) {
    pills.push(
      tournaments.next.openSlots > 0
        ? {
            key: "tournament-next",
            href: `/tournaments/${tournaments.next.slug}`,
            dot: "open",
            label: `Registration open · ${tournaments.next.name}`,
          }
        : {
            key: "tournament-next",
            href: `/tournaments/${tournaments.next.slug}`,
            dot: "quiet",
            label: `${tournaments.next.name} · Full`,
          }
    );
  }

  if (pills.length === 0) {
    pills.push({
      key: "nothing",
      href: null,
      dot: "quiet",
      label: "Nothing on the calendar yet — check back soon",
    });
  }

  return pills;
}

function PillDot({ dot }: { dot: StatusPill["dot"] }) {
  if (dot === "live") {
    return (
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="bg-danger absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
        <span className="bg-danger relative inline-flex h-2 w-2 rounded-full" />
      </span>
    );
  }
  if (dot === "open") {
    return <span className="bg-success h-2 w-2 shrink-0 rounded-full" />;
  }
  return (
    <span className="bg-muted-foreground/50 h-2 w-2 shrink-0 rounded-full" />
  );
}

function FloatingOrb({
  className,
  size,
  gradient,
  duration,
}: {
  className: string;
  size: number;
  gradient: string;
  duration: number;
}) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      aria-hidden="true"
      className={cn("absolute", className)}
      animate={shouldReduceMotion ? undefined : { y: [0, 18, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
      style={{ width: size, height: size }}
    >
      <div
        className={cn(
          "h-full w-full rounded-full border-2 backdrop-blur-[2px]",
          "border-primary/15 bg-gradient-to-br to-transparent",
          gradient
        )}
      />
    </motion.div>
  );
}

export function HomeHero({ stats }: { stats: HomeStats }) {
  const shouldReduceMotion = useReducedMotion();
  const pills = buildPills(stats);

  return (
    <section className="from-primary/10 via-background to-accent/20 relative overflow-hidden bg-gradient-to-br">
      {/* Volleyball-net grid */}
      <GridPattern
        width={80}
        height={80}
        x={-1}
        y={-1}
        className="stroke-primary/10 fill-primary/5"
      />

      {/* Warm gold shooting stars */}
      <div className="absolute inset-0 opacity-70">
        <ShootingStarsCanvas />
      </div>

      {/* Floating sage orbs */}
      <FloatingOrb
        className="top-[12%] left-[-4%] md:left-[3%]"
        size={210}
        gradient="from-primary/15"
        duration={11}
      />
      <FloatingOrb
        className="top-[55%] right-[-6%] md:right-[2%]"
        size={170}
        gradient="from-accent/30"
        duration={13}
      />
      <FloatingOrb
        className="bottom-[-8%] left-[22%] hidden md:block"
        size={120}
        gradient="from-secondary/30"
        duration={9}
      />

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-16 pb-36 text-center md:pt-24 md:pb-44">
        <motion.div
          custom={0}
          variants={fadeUp}
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
          className="border-primary/20 bg-card/80 mb-8 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 backdrop-blur-sm"
        >
          <Sparkles className="text-primary h-3.5 w-3.5" />
          <span className="text-muted-foreground text-sm tracking-wide">
            Your volleyball home court
          </span>
        </motion.div>

        <motion.h1
          custom={1}
          variants={fadeUp}
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
          className="mx-auto mb-6 max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl"
        >
          <span className="block">Bump. Set.</span>
          <span className="from-foreground via-primary to-accent block bg-gradient-to-r bg-clip-text pb-2 text-transparent">
            Sign up.
          </span>
        </motion.h1>

        <motion.p
          custom={2}
          variants={fadeUp}
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
          className="text-muted-foreground mx-auto mb-10 max-w-xl text-base leading-relaxed sm:text-lg md:text-xl"
        >
          Tournaments and pickup nights for the crew — live scores, standings,
          brackets, and lineups, all in one place.
        </motion.p>

        <motion.div
          custom={3}
          variants={fadeUp}
          initial={shouldReduceMotion ? false : "hidden"}
          animate="visible"
          className="flex flex-wrap items-center justify-center gap-3"
        >
          {pills.map((pill) => {
            const pillContent = (
              <>
                <PillDot dot={pill.dot} />
                <span className="text-foreground text-sm font-medium">
                  {pill.label}
                </span>
              </>
            );
            const pillClass =
              "border-border bg-card/90 inline-flex items-center gap-2.5 rounded-full border px-4 py-2 shadow-sm backdrop-blur-sm";

            return pill.href ? (
              <Link
                key={pill.key}
                href={pill.href}
                className={cn(
                  pillClass,
                  "hover:border-primary/40 transition-all hover:shadow-md"
                )}
              >
                {pillContent}
              </Link>
            ) : (
              <span key={pill.key} className={pillClass}>
                {pillContent}
              </span>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
