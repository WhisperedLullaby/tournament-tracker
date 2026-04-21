"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { POSITION_ORDER, POSITION_LABELS, DEFAULT_POSITION_LIMITS } from "@/lib/pickup/positions";

export function PickupCreationForm({ isAdmin = false }: { isAdmin?: boolean }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [estimatedEndTime, setEstimatedEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [seriesFormat, setSeriesFormat] = useState<"best_of_3" | "best_of_5">("best_of_3");
  const [endPoints, setEndPoints] = useState(25);
  const [cap, setCap] = useState(27);
  const [winByTwo, setWinByTwo] = useState(true);
  const [isTest, setIsTest] = useState(false);
  const [positionLimits, setPositionLimits] = useState<Record<string, number>>(
    { ...DEFAULT_POSITION_LIMITS }
  );

  const totalCapacity = Object.values(positionLimits).reduce((a, b) => a + b, 0);

  function handleTitleChange(value: string) {
    setTitle(value);
    if (!slug || slug === generateSlug(title)) {
      setSlug(generateSlug(value));
    }
  }

  function generateSlug(text: string) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 60);
  }

  function setPositionLimit(position: string, value: number) {
    setPositionLimits((prev) => ({ ...prev, [position]: Math.max(0, value) }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/pickup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug,
          date,
          startTime: startTime || undefined,
          estimatedEndTime: estimatedEndTime || undefined,
          location: location || undefined,
          description: description || undefined,
          totalCapacity,
          seriesFormat,
          positionLimits,
          scoringRules: { endPoints, cap, winByTwo },
          isTest,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }

      router.push(`/pickup/${data.session.slug}`);
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-6 pb-16">
      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Monday Open Pickup"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slug">URL Slug *</Label>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="monday-open-pickup"
              pattern="[a-z0-9-]+"
              required
            />
            <p className="text-xs text-muted-foreground">
              /pickup/{slug || "…"}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="startTime">Start Time</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="estimatedEndTime">End Time</Label>
              <Input
                id="estimatedEndTime"
                type="time"
                value={estimatedEndTime}
                onChange={(e) => setEstimatedEndTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="All American FieldHouse"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Open pickup session, all levels welcome."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Position Limits</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Set how many players of each position can register. The lineup
            generator will split them evenly across both teams.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {POSITION_ORDER.map((pos) => (
              <div key={pos} className="flex items-center justify-between gap-3">
                <Label className="text-sm">{POSITION_LABELS[pos]}</Label>
                <Input
                  type="number"
                  min={0}
                  max={12}
                  value={positionLimits[pos] ?? 0}
                  onChange={(e) => setPositionLimit(pos, parseInt(e.target.value) || 0)}
                  className="w-20 text-center"
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between border-t pt-3 text-sm font-medium">
            <span>Total capacity</span>
            <span>{totalCapacity} players</span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Format &amp; Scoring</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Series Format</Label>
            <Select
              value={seriesFormat}
              onValueChange={(v) => setSeriesFormat(v as "best_of_3" | "best_of_5")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best_of_3">Best of 3</SelectItem>
                <SelectItem value="best_of_5">Best of 5</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="endPoints">Win At</Label>
              <Input
                id="endPoints"
                type="number"
                min={1}
                max={50}
                value={endPoints}
                onChange={(e) => setEndPoints(parseInt(e.target.value) || 25)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cap">Point Cap</Label>
              <Input
                id="cap"
                type="number"
                min={1}
                max={60}
                value={cap}
                onChange={(e) => setCap(parseInt(e.target.value) || 27)}
              />
            </div>
            <div className="flex flex-col justify-end space-y-1.5">
              <Label>Win by 2</Label>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={winByTwo}
                  onChange={(e) => setWinByTwo(e.target.checked)}
                  className="rounded"
                />
                Required
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-4">
            <label className="flex cursor-pointer items-center gap-3">
              <input
                type="checkbox"
                checked={isTest}
                onChange={(e) => setIsTest(e.target.checked)}
                className="rounded"
              />
              <div>
                <p className="text-sm font-medium text-amber-800">Test session</p>
                <p className="text-xs text-amber-700">
                  Hidden from all players — only visible to admins.
                </p>
              </div>
            </label>
          </CardContent>
        </Card>
      )}

      <Button type="submit" className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? "Creating…" : "Create Pickup Session"}
      </Button>
    </form>
  );
}
