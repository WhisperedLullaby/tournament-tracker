"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TriangleAlert } from "lucide-react";

interface ScoreEntryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  matchId: number;
  matchType: "pool" | "bracket";
  teamAName: string;
  teamBName: string;
  initialScoreA: number;
  initialScoreB: number;
}

export function ScoreEntryModal({
  open,
  onOpenChange,
  matchId,
  matchType,
  teamAName,
  teamBName,
  initialScoreA,
  initialScoreB,
}: ScoreEntryModalProps) {
  const [scoreA, setScoreA] = useState(String(initialScoreA));
  const [scoreB, setScoreB] = useState(String(initialScoreB));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    const teamAScore = parseInt(scoreA, 10);
    const teamBScore = parseInt(scoreB, 10);

    if (
      isNaN(teamAScore) ||
      isNaN(teamBScore) ||
      teamAScore < 0 ||
      teamBScore < 0
    ) {
      setError("Scores must be non-negative numbers.");
      return;
    }

    setSaving(true);
    setError(null);

    const endpoint =
      matchType === "pool"
        ? `/api/games/${matchId}/score`
        : `/api/bracket/games/${matchId}/score`;

    try {
      const res = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamAScore, teamBScore }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || "Failed to update score.");
        setSaving(false);
        return;
      }

      onOpenChange(false);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit score</DialogTitle>
          <DialogDescription>
            Update the current score for this match. Changes save immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label
              htmlFor="score-a"
              className="text-sm font-medium text-foreground"
            >
              {teamAName}
            </label>
            <Input
              id="score-a"
              type="number"
              inputMode="numeric"
              min={0}
              value={scoreA}
              onChange={(e) => setScoreA(e.target.value)}
              className="text-2xl font-bold tabular-nums"
            />
          </div>
          <div className="space-y-2">
            <label
              htmlFor="score-b"
              className="text-sm font-medium text-foreground"
            >
              {teamBName}
            </label>
            <Input
              id="score-b"
              type="number"
              inputMode="numeric"
              min={0}
              value={scoreB}
              onChange={(e) => setScoreB(e.target.value)}
              className="text-2xl font-bold tabular-nums"
            />
          </div>
        </div>

        {error && (
          <div className="bg-muted border-border flex items-start gap-2 rounded-lg border p-3">
            <TriangleAlert className="text-destructive mt-0.5 h-4 w-4 flex-shrink-0" />
            <p className="text-foreground text-sm">{error}</p>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
