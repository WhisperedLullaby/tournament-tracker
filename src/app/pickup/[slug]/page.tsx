"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePickup } from "@/contexts/pickup-context";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PositionRoster } from "@/components/pickup/position-roster";
import type { PublicPickupRegistration, PickupPaymentInfo } from "@/lib/db/schema";
import { CalendarDays, MapPin, Users, Clock, Settings, Wallet, ClipboardList } from "lucide-react";
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

function PaymentInfo({
  paymentInfo,
}: {
  paymentInfo: PickupPaymentInfo | null;
}) {
  if (!paymentInfo) return null;

  const { amountPerPerson, cash, venmo, zelle } = paymentInfo;
  const hasMethod = cash || !!venmo || !!zelle;
  if (amountPerPerson == null && !hasMethod) return null;

  return (
    <div className="mt-4 flex max-w-2xl flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-card px-4 py-3 text-sm">
      <span className="flex items-center gap-1.5 font-semibold">
        <Wallet className="h-4 w-4 text-muted-foreground" />
        {amountPerPerson != null ? `$${amountPerPerson} per player` : "Payment"}
      </span>
      {hasMethod && (
        <div className="flex flex-wrap items-center gap-2 text-muted-foreground">
          {cash && <Badge variant="secondary">Cash</Badge>}
          {venmo && <Badge variant="secondary">Venmo {venmo}</Badge>}
          {zelle && <Badge variant="secondary">Zelle: {zelle}</Badge>}
        </div>
      )}
    </div>
  );
}

export default function PickupSessionPage() {
  const { session, isOrganizer, userRegistration, isLoading, refreshRegistration } =
    usePickup();
  const [registrations, setRegistrations] = useState<PublicPickupRegistration[]>([]);
  const [regsLoading, setRegsLoading] = useState(true);
  const [removeError, setRemoveError] = useState<string | null>(null);
  const [confirmingWithdraw, setConfirmingWithdraw] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const fetchRegistrations = useCallback(async () => {
    const r = await fetch(`/api/pickup/${session.id}/registrations`);
    const d = await r.json();
    setRegistrations(d.registrations ?? []);
  }, [session.id]);

  useEffect(() => {
    fetchRegistrations().finally(() => setRegsLoading(false));
  }, [fetchRegistrations]);

  // Registration stays open through the attendance phase (the API only
  // rejects active/completed) so a player who withdraws during check-in —
  // or a walk-up — can still sign up.
  const canRegister =
    (session.status === "upcoming" || session.status === "attendance") &&
    !userRegistration;

  // Removal is allowed until the session actually starts — the API rejects
  // active/completed sessions, so mirror that here.
  const removalOpen =
    session.status === "upcoming" || session.status === "attendance";

  const handleRemove = useCallback(
    async (reg: PublicPickupRegistration) => {
      setRemoveError(null);
      // Own registration goes through the self-cancel route; anyone else
      // through the organizer route.
      const isSelf = userRegistration?.id === reg.id;
      const res = await fetch(
        isSelf
          ? `/api/pickup/${session.id}/register`
          : `/api/pickup/${session.id}/registrations/${reg.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setRemoveError(data.error ?? "Removal failed. Please try again.");
        return;
      }
      await Promise.all([fetchRegistrations(), refreshRegistration()]);
    },
    [session.id, userRegistration?.id, fetchRegistrations, refreshRegistration]
  );

  async function handleWithdraw() {
    if (!userRegistration) return;
    setIsWithdrawing(true);
    try {
      await handleRemove(userRegistration);
      setConfirmingWithdraw(false);
    } finally {
      setIsWithdrawing(false);
    }
  }

  const registeredTotal = registrations.filter(
    (r) => r.status === "registered" || r.status === "attended"
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
              {isOrganizer &&
                (session.status === "attendance" || session.status === "active") && (
                  <Button size="sm" asChild>
                    <Link href={`/pickup/${session.slug}/scorekeeper`}>
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Open Scorekeeper
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
              {userRegistration && removalOpen && !confirmingWithdraw && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => setConfirmingWithdraw(true)}
                >
                  Can&apos;t make it? Withdraw
                </Button>
              )}
              {userRegistration && removalOpen && confirmingWithdraw && (
                <div className="flex items-center gap-2 rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2">
                  <span className="text-sm font-medium text-destructive">
                    Withdraw from this session?
                  </span>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={isWithdrawing}
                    onClick={handleWithdraw}
                  >
                    {isWithdrawing ? "Withdrawing…" : "Withdraw"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isWithdrawing}
                    onClick={() => setConfirmingWithdraw(false)}
                  >
                    Cancel
                  </Button>
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

          <PaymentInfo paymentInfo={session.paymentInfo} />
        </div>
      </div>

      {/* Roster */}
      <div className="container mx-auto px-4 py-8">
        <h2 className="mb-4 text-xl font-semibold">Player Roster</h2>
        {removeError && (
          <div className="mb-4 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {removeError}
          </div>
        )}
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
            canRemove={(reg) =>
              removalOpen &&
              (isOrganizer || (!!userRegistration && reg.id === userRegistration.id))
            }
            onRemove={handleRemove}
          />
        )}
      </div>

      <Footer />
    </div>
  );
}
