"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePickup } from "@/contexts/pickup-context";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PositionRoster } from "@/components/pickup/position-roster";
import type { PickupRegistration } from "@/lib/db/schema";
import { CalendarDays, MapPin, Users, Clock, Settings } from "lucide-react";
import { formatPosition } from "@/lib/pickup/positions";

const STATUS_LABELS: Record<string, string> = {
  upcoming: "Upcoming",
  attendance: "Starting Soon",
  active: "In Progress",
  completed: "Completed",
};

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

export default function PickupSessionPage() {
  const { session, isOrganizer, userRegistration, isLoading } = usePickup();
  const [registrations, setRegistrations] = useState<PickupRegistration[]>([]);
  const [regsLoading, setRegsLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/pickup/${session.id}/registrations`)
      .then((r) => r.json())
      .then((d) => setRegistrations(d.registrations ?? []))
      .finally(() => setRegsLoading(false));
  }, [session.id]);

  const canRegister =
    session.status === "upcoming" && !userRegistration;

  const registeredTotal = registrations.filter(
    (r) => r.status === "registered"
  ).length;

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      {/* Header */}
      <div className="from-primary/10 via-background to-accent/10 border-b bg-gradient-to-br">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{STATUS_LABELS[session.status]}</Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {session.seriesFormat.replace(/_/g, " ")}
                </Badge>
              </div>
              <h1 className="mb-3 text-3xl font-bold md:text-4xl">{session.title}</h1>

              <div className="space-y-1.5 text-sm text-muted-foreground">
                <p className="flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 shrink-0" />
                  {new Date(session.date).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    timeZone: "UTC",
                  })}
                </p>
                {(session.startTime || session.estimatedEndTime) && (
                  <p className="flex items-center gap-2">
                    <Clock className="h-4 w-4 shrink-0" />
                    {session.startTime ? formatTime(session.startTime) : ""}
                    {session.startTime && session.estimatedEndTime && " – "}
                    {session.estimatedEndTime ? formatTime(session.estimatedEndTime) : ""}
                  </p>
                )}
                {session.location && (
                  <p className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0" />
                    {session.location}
                  </p>
                )}
                <p className="flex items-center gap-2">
                  <Users className="h-4 w-4 shrink-0" />
                  {registeredTotal}/{session.totalCapacity} registered
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              {isOrganizer && (
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/pickup/${session.slug}/settings`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Manage Session
                  </Link>
                </Button>
              )}
              {isOrganizer &&
                (session.status === "upcoming" || session.status === "attendance") && (
                  <Button size="sm" asChild>
                    <Link href={`/pickup/${session.slug}/attendance`}>
                      Take Attendance
                    </Link>
                  </Button>
                )}
              {canRegister && (
                <Button asChild size="lg">
                  <Link href={`/pickup/${session.slug}/register`}>
                    Sign Up
                  </Link>
                </Button>
              )}
              {userRegistration && (
                <div className="rounded-md border bg-green-50 px-4 py-2 text-sm text-green-800">
                  {userRegistration.status === "waitlisted"
                    ? `You're on the waitlist (#${userRegistration.waitlistPosition}) as ${formatPosition(userRegistration.position)}`
                    : `You're registered as ${formatPosition(userRegistration.position)}`}
                </div>
              )}
              {session.status === "active" && (
                <Button variant="outline" asChild>
                  <Link href={`/pickup/${session.slug}/scoreboard`}>
                    Live Scoreboard
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {session.description && (
            <p className="mt-4 max-w-2xl text-muted-foreground">
              {session.description}
            </p>
          )}
        </div>
      </div>

      {/* Roster */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="mb-4 text-xl font-semibold">Player Roster</h2>
        {regsLoading || isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : (
          <PositionRoster
            positionLimits={session.positionLimits}
            registrations={registrations}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}
