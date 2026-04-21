"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { PickupRegistration } from "@/lib/db/schema";
import { POSITION_ORDER, POSITION_LABELS } from "@/lib/pickup/positions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, X, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type AttendanceStatus = "registered" | "waitlisted" | "attended" | "no_show";

interface AttendanceChecklistProps {
  sessionId: number;
  slug: string;
  registrations: PickupRegistration[];
}

export function AttendanceChecklist({
  sessionId,
  slug,
  registrations,
}: AttendanceChecklistProps) {
  const router = useRouter();

  // Local state: map regId → status (only registered/waitlisted eligible)
  const eligible = registrations.filter(
    (r) => r.status === "registered" || r.status === "waitlisted" || r.status === "attended" || r.status === "no_show"
  );

  const [marks, setMarks] = useState<Record<number, AttendanceStatus>>(() => {
    const init: Record<number, AttendanceStatus> = {};
    for (const r of eligible) {
      init[r.id] = r.status as AttendanceStatus;
    }
    return init;
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(regId: number) {
    setMarks((prev) => {
      const current = prev[regId];
      if (current === "attended") return { ...prev, [regId]: "no_show" };
      if (current === "no_show") return { ...prev, [regId]: "attended" };
      // registered / waitlisted default: mark as attended on first click
      return { ...prev, [regId]: "attended" };
    });
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const attendance: Record<number, "attended" | "no_show"> = {};
      for (const [id, status] of Object.entries(marks)) {
        if (status === "attended" || status === "no_show") {
          attendance[Number(id)] = status;
        }
      }

      const res = await fetch(`/api/pickup/${sessionId}/attendance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attendance }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to save attendance");
        return;
      }

      router.push(`/pickup/${slug}/lineups`);
      router.refresh();
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  const byPosition = POSITION_ORDER.filter((pos) =>
    eligible.some((r) => r.position === pos)
  );

  const attendedCount = Object.values(marks).filter((s) => s === "attended").length;
  const totalEligible = eligible.filter(
    (r) => r.status === "registered" || r.status === "attended" || r.status === "no_show"
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Tap a player to toggle attended / no-show. Submit when done to generate lineups.
        </p>
        <Badge variant="secondary" className="shrink-0">
          {attendedCount} / {totalEligible} attending
        </Badge>
      </div>

      {byPosition.map((position) => {
        const group = eligible.filter((r) => r.position === position);
        if (group.length === 0) return null;

        const confirmed = group.filter(
          (r) => r.status === "registered" || r.status === "attended" || r.status === "no_show"
        );
        const waitlisted = group.filter((r) => r.status === "waitlisted");

        return (
          <div key={position}>
            <h3 className="mb-2 text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              {POSITION_LABELS[position]}
            </h3>
            <div className="space-y-2">
              {confirmed.map((reg) => {
                const status = marks[reg.id];
                const isAttended = status === "attended";
                const isNoShow = status === "no_show";

                return (
                  <button
                    key={reg.id}
                    type="button"
                    onClick={() => toggle(reg.id)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors",
                      isAttended &&
                        "border-green-300 bg-green-50 dark:border-green-700 dark:bg-green-950/30",
                      isNoShow &&
                        "border-red-200 bg-red-50 text-muted-foreground dark:border-red-800 dark:bg-red-950/30",
                      !isAttended &&
                        !isNoShow &&
                        "border-border bg-card hover:bg-accent/40"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2",
                        isAttended &&
                          "border-green-500 bg-green-500 text-white",
                        isNoShow && "border-red-400 bg-red-400 text-white",
                        !isAttended &&
                          !isNoShow &&
                          "border-muted-foreground/40"
                      )}
                    >
                      {isAttended && <Check className="h-3.5 w-3.5" />}
                      {isNoShow && <X className="h-3.5 w-3.5" />}
                    </div>
                    <span className="flex-1 text-sm font-medium">
                      {reg.displayName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {isAttended ? "Here" : isNoShow ? "No-show" : "Tap to mark"}
                    </span>
                  </button>
                );
              })}

              {waitlisted.length > 0 && (
                <div className="mt-1 space-y-1.5 pl-1">
                  <p className="text-xs font-medium text-amber-600">
                    Waitlist — promoted if no-shows open spots
                  </p>
                  {waitlisted
                    .sort(
                      (a, b) =>
                        (a.waitlistPosition ?? 0) - (b.waitlistPosition ?? 0)
                    )
                    .map((reg) => (
                      <div
                        key={reg.id}
                        className="flex items-center gap-2 text-xs text-amber-700"
                      >
                        <span className="font-mono text-amber-500">
                          #{reg.waitlistPosition}
                        </span>
                        <span>{reg.displayName}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {eligible.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
          <Users className="h-8 w-8 opacity-40" />
          <p className="text-sm">No registrations yet.</p>
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <Button
        onClick={handleSubmit}
        disabled={submitting || attendedCount === 0}
        className="w-full"
        size="lg"
      >
        {submitting ? "Saving..." : "Save Attendance & Generate Lineups"}
      </Button>
    </div>
  );
}
