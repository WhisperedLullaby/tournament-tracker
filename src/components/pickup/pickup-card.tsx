"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import type { PickupSession } from "@/lib/db/schema";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, MapPin, Users } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Upcoming",
  attendance: "Starting Soon",
  active: "In Progress",
  completed: "Completed",
};

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  upcoming: "default",
  attendance: "secondary",
  active: "destructive",
  completed: "outline",
};

interface PickupCardProps {
  session: PickupSession;
  registeredCount: number;
}

const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
};

export function PickupCard({ session, registeredCount }: PickupCardProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      variants={item}
      whileHover={shouldReduceMotion ? {} : { y: -4, boxShadow: "0 10px 25px -5px rgba(0,0,0,0.12)" }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
    >
      <Link
        href={`/pickup/${session.slug}`}
        className="block rounded-lg border bg-card p-6 shadow-sm h-full"
      >
        <div className="mb-2 flex items-start justify-between gap-2">
          <h2 className="text-lg font-semibold leading-tight">{session.title}</h2>
          <Badge variant={STATUS_VARIANT[session.status]} className="shrink-0 text-xs">
            {STATUS_LABELS[session.status]}
          </Badge>
        </div>

        <div className="mb-3 space-y-1.5">
          <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {new Date(session.date).toLocaleDateString("en-US", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
              timeZone: "UTC",
            })}
            {session.startTime && ` · ${formatTime(session.startTime)}`}
            {session.estimatedEndTime && ` – ${formatTime(session.estimatedEndTime)}`}
          </p>
          {session.location && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {session.location}
            </p>
          )}
        </div>

        {session.description && (
          <p className="mb-3 text-sm text-muted-foreground line-clamp-2">
            {session.description}
          </p>
        )}

        <div className="flex items-center gap-1.5 border-t pt-3 text-sm">
          <Users className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-muted-foreground">
            {registeredCount}/{session.totalCapacity} registered
          </span>
          {registeredCount >= session.totalCapacity && (
            <Badge variant="secondary" className="ml-auto text-xs">Full</Badge>
          )}
          {registeredCount < session.totalCapacity && session.status === "upcoming" && (
            <Badge variant="default" className="ml-auto text-xs">Open</Badge>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}
