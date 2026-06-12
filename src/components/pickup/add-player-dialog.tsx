"use client";

import { useState } from "react";
import type { PublicPickupRegistration } from "@/lib/db/schema";
import { POSITION_ORDER, POSITION_LABELS } from "@/lib/pickup/positions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserPlus } from "lucide-react";

interface AddPlayerDialogProps {
  sessionId: number;
  positionLimits: Record<string, number>;
  registrations: PublicPickupRegistration[];
  onAdded: () => Promise<void> | void;
}

// Organizer-only: manually register a player who doesn't have an account
// (or can't manage the sign-in themselves). Creates a guest registration
// via POST /api/pickup/[sessionId]/registrations.
export function AddPlayerDialog({
  sessionId,
  positionLimits,
  registrations,
  onAdded,
}: AddPlayerDialogProps) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [position, setPosition] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activePositions = POSITION_ORDER.filter(
    (pos) => (positionLimits[pos] ?? 0) > 0
  );

  // "attended" still holds a spot once attendance has been taken — same
  // counting rule as the roster and the server-side capacity check.
  function filledCount(pos: string) {
    return registrations.filter(
      (r) =>
        r.position === pos &&
        (r.status === "registered" || r.status === "attended")
    ).length;
  }

  function resetForm() {
    setDisplayName("");
    setPosition("");
    setEmail("");
    setError(null);
  }

  async function handleSubmit() {
    if (!displayName.trim() || !position) {
      setError("Name and position are required.");
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/pickup/${sessionId}/registrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName: displayName.trim(),
          position,
          ...(email.trim() ? { email: email.trim() } : {}),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Failed to add player. Please try again.");
        return;
      }
      await onAdded();
      setOpen(false);
      resetForm();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-2 h-4 w-4" />
          Add Player
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add a player</DialogTitle>
          <DialogDescription>
            Register someone who can&apos;t sign up themselves. They won&apos;t
            have an account, so you&apos;ll manage their spot for them.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="add-player-name">Name</Label>
            <Input
              id="add-player-name"
              value={displayName}
              maxLength={80}
              placeholder="Player name"
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Position</Label>
            <Select value={position} onValueChange={setPosition}>
              <SelectTrigger>
                <SelectValue placeholder="Select a position" />
              </SelectTrigger>
              <SelectContent>
                {activePositions.map((pos) => {
                  const limit = positionLimits[pos] ?? 0;
                  const filled = filledCount(pos);
                  const full = filled >= limit;
                  return (
                    <SelectItem key={pos} value={pos}>
                      {POSITION_LABELS[pos]} ({filled}/{limit}
                      {full ? " — joins waitlist" : ""})
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-player-email">Email (optional)</Label>
            <Input
              id="add-player-email"
              type="email"
              value={email}
              placeholder="For your records only"
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {error && (
            <p className="rounded-md border border-destructive/50 bg-destructive/10 p-2 text-sm text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            disabled={isSubmitting}
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
          <Button disabled={isSubmitting} onClick={handleSubmit}>
            {isSubmitting ? "Adding…" : "Add Player"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
