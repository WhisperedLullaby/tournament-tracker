"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  CalendarDays,
  Radio,
  Trophy,
  Users,
  Volleyball,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { HomeStats } from "./types";
import { formatEventDate, formatStartTime } from "./format";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.4 } },
};

const item = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: "easeOut" as const },
  },
};

type RowTone = "default" | "success" | "muted" | "live";

const ROW_TONE_CLASS: Record<RowTone, string> = {
  default: "text-foreground",
  success: "text-success font-medium",
  muted: "text-muted-foreground",
  live: "text-danger font-medium",
};

type ChipTone = "live" | "open" | "muted";

const CHIP_TONE_CLASS: Record<ChipTone, string> = {
  live: "border-danger/30 bg-danger/10 text-danger",
  open: "border-success/30 bg-success/10 text-success",
  muted: "border-border bg-muted text-muted-foreground",
};

interface CardRow {
  icon: LucideIcon;
  text: string;
  tone: RowTone;
}

interface PortalCardData {
  href: string;
  title: string;
  tagline: string;
  icon: LucideIcon;
  iconClass: string;
  overlayClass: string;
  chip: { label: string; tone: ChipTone };
  rows: CardRow[];
  cta: string;
}

function buildTournamentCard(stats: HomeStats["tournaments"]): PortalCardData {
  const rows: CardRow[] = [];
  let chip: PortalCardData["chip"];

  if (stats.live) {
    chip = { label: "Live now", tone: "live" };
    rows.push({
      icon: Radio,
      text: `Live now — ${stats.live.name}`,
      tone: "live",
    });
  } else if (stats.next && stats.next.openSlots > 0) {
    chip = { label: "Registration open", tone: "open" };
  } else if (stats.next) {
    chip = { label: "Full", tone: "muted" };
  } else {
    chip = { label: "Coming soon", tone: "muted" };
  }

  if (stats.next) {
    rows.push({
      icon: CalendarDays,
      text: `${stats.next.name} · ${formatEventDate(stats.next.date)}`,
      tone: "default",
    });
    rows.push(
      stats.next.openSlots > 0
        ? {
            icon: Users,
            text: `${stats.next.openSlots} of ${stats.next.maxPods} team slots open`,
            tone: "success",
          }
        : {
            icon: Users,
            text: `All ${stats.next.maxPods} team slots filled`,
            tone: "muted",
          }
    );
    if (stats.upcomingCount > 1) {
      rows.push({
        icon: CalendarDays,
        text: `+${stats.upcomingCount - 1} more upcoming`,
        tone: "muted",
      });
    }
  } else if (!stats.live) {
    rows.push({
      icon: CalendarDays,
      text: "No tournaments on the calendar yet — stay tuned.",
      tone: "muted",
    });
  }

  return {
    href: "/tournaments",
    title: "Tournaments",
    tagline:
      "Full-day pod tournaments — pool play into brackets, with live standings the whole way.",
    icon: Trophy,
    iconClass: "bg-primary/15 text-primary",
    overlayClass: "from-primary/10",
    chip,
    rows,
    cta: "Browse tournaments",
  };
}

function buildPickupCard(stats: HomeStats["pickup"]): PortalCardData {
  const rows: CardRow[] = [];
  let chip: PortalCardData["chip"];

  if (stats.live) {
    chip = { label: "Live now", tone: "live" };
    rows.push({
      icon: Radio,
      text:
        stats.live.status === "active"
          ? `Live now — ${stats.live.title}`
          : `Checking in — ${stats.live.title}`,
      tone: "live",
    });
  } else if (stats.next && stats.next.openSpots > 0) {
    chip = { label: "Spots open", tone: "open" };
  } else if (stats.next) {
    chip = { label: "Full", tone: "muted" };
  } else {
    chip = { label: "Coming soon", tone: "muted" };
  }

  if (stats.next) {
    const time = stats.next.startTime
      ? ` · ${formatStartTime(stats.next.startTime)}`
      : "";
    rows.push({
      icon: CalendarDays,
      text: `${stats.next.title} · ${formatEventDate(stats.next.date)}${time}`,
      tone: "default",
    });
    rows.push(
      stats.next.openSpots > 0
        ? {
            icon: Users,
            text: `${stats.next.openSpots} of ${stats.next.totalCapacity} spots open`,
            tone: "success",
          }
        : {
            icon: Users,
            text: "Full — waitlist open",
            tone: "muted",
          }
    );
    if (stats.upcomingCount > 1) {
      rows.push({
        icon: CalendarDays,
        text: `+${stats.upcomingCount - 1} more upcoming`,
        tone: "muted",
      });
    }
  } else if (!stats.live) {
    rows.push({
      icon: CalendarDays,
      text: "No pickup sessions on the calendar yet — stay tuned.",
      tone: "muted",
    });
  }

  return {
    href: "/pickup",
    title: "Pickup Games",
    tagline:
      "Casual play nights — claim a position, get auto-balanced lineups, and just play.",
    icon: Volleyball,
    iconClass: "bg-accent/40 text-accent-foreground",
    overlayClass: "from-accent/20",
    chip,
    rows,
    cta: "Find a game",
  };
}

function PortalCard({ card }: { card: PortalCardData }) {
  const shouldReduceMotion = useReducedMotion();
  const Icon = card.icon;

  return (
    <motion.div
      variants={item}
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              y: -6,
              boxShadow:
                "0 14px 30px -8px rgba(0,0,0,0.14), 0 6px 10px -4px rgba(0,0,0,0.07)",
            }
      }
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="h-full"
    >
      <Link
        href={card.href}
        className="group bg-card border-border relative block h-full overflow-hidden rounded-2xl border p-6 shadow-lg md:p-8"
      >
        <div
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent",
            card.overlayClass
          )}
        />

        <div className="relative flex h-full flex-col">
          <div className="mb-5 flex items-start justify-between gap-3">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-xl",
                card.iconClass
              )}
            >
              <Icon className="h-6 w-6" />
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
                CHIP_TONE_CLASS[card.chip.tone]
              )}
            >
              {card.chip.tone === "live" && (
                <span className="relative flex h-1.5 w-1.5">
                  <span className="bg-danger absolute inline-flex h-full w-full animate-ping rounded-full opacity-75" />
                  <span className="bg-danger relative inline-flex h-1.5 w-1.5 rounded-full" />
                </span>
              )}
              {card.chip.label}
            </span>
          </div>

          <h2 className="mb-2 text-2xl font-bold">{card.title}</h2>
          <p className="text-muted-foreground mb-5 text-sm leading-relaxed">
            {card.tagline}
          </p>

          <div className="bg-muted/50 mb-5 space-y-2.5 rounded-lg p-4">
            {card.rows.map((row, i) => {
              const RowIcon = row.icon;
              return (
                <p
                  key={i}
                  className={cn(
                    "flex items-start gap-2 text-sm",
                    ROW_TONE_CLASS[row.tone]
                  )}
                >
                  <RowIcon
                    className={cn(
                      "mt-0.5 h-4 w-4 shrink-0",
                      row.tone === "live" && "animate-pulse"
                    )}
                  />
                  <span className="min-w-0">{row.text}</span>
                </p>
              );
            })}
          </div>

          <div className="text-primary mt-auto flex items-center gap-2 font-semibold">
            {card.cta}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function HomePortalCards({ stats }: { stats: HomeStats }) {
  const shouldReduceMotion = useReducedMotion();
  const cards = [buildTournamentCard(stats.tournaments), buildPickupCard(stats.pickup)];

  return (
    <motion.div
      className="mx-auto grid max-w-4xl gap-6 md:grid-cols-2"
      variants={container}
      initial={shouldReduceMotion ? false : "hidden"}
      animate="visible"
    >
      {cards.map((card) => (
        <PortalCard key={card.href} card={card} />
      ))}
    </motion.div>
  );
}
