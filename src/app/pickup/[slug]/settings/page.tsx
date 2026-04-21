"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePickup } from "@/contexts/pickup-context";
import { useAuth } from "@/contexts/auth-context";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
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
import { ArrowLeft, Trash2 } from "lucide-react";
import { POSITION_ORDER, POSITION_LABELS } from "@/lib/pickup/positions";

export default function PickupSettingsPage() {
  const { session, isOrganizer, isLoading } = usePickup();
  const { user } = useAuth();
  const router = useRouter();

  const [title, setTitle] = useState(session.title);
  const [location, setLocation] = useState(session.location ?? "");
  const [description, setDescription] = useState(session.description ?? "");
  const [startTime, setStartTime] = useState(session.startTime ?? "");
  const [estimatedEndTime, setEstimatedEndTime] = useState(session.estimatedEndTime ?? "");
  const [seriesFormat, setSeriesFormat] = useState<"best_of_3" | "best_of_5">(session.seriesFormat);
  const [endPoints, setEndPoints] = useState(session.scoringRules.endPoints);
  const [cap, setCap] = useState(session.scoringRules.cap);
  const [winByTwo, setWinByTwo] = useState(session.scoringRules.winByTwo);
  const [positionLimits, setPositionLimits] = useState<Record<string, number>>(
    { ...session.positionLimits }
  );

  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  function setPositionLimit(position: string, value: number) {
    setPositionLimits((prev) => ({ ...prev, [position]: Math.max(0, value) }));
  }

  const totalCapacity = Object.values(positionLimits).reduce((a, b) => a + b, 0);

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="flex min-h-screen items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
        <Footer />
      </>
    );
  }

  if (!user || !isOrganizer) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-4 px-4">
          <p className="text-lg font-medium">You don&apos;t have permission to manage this session.</p>
          <Button asChild variant="outline">
            <Link href={`/pickup/${session.slug}`}>Back to Session</Link>
          </Button>
        </div>
        <Footer />
      </>
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const res = await fetch(`/api/pickup/${session.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          location: location || null,
          description: description || null,
          startTime: startTime || null,
          estimatedEndTime: estimatedEndTime || null,
          seriesFormat,
          positionLimits,
          totalCapacity,
          scoringRules: { endPoints, cap, winByTwo },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error ?? "Save failed.");
        return;
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
      setSaveError("An unexpected error occurred.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete() {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/pickup/${session.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setSaveError(data.error ?? "Delete failed.");
        setShowDeleteConfirm(false);
        return;
      }
      router.push("/pickup");
    } catch {
      setSaveError("An unexpected error occurred.");
      setIsDeleting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      <div className="container mx-auto max-w-2xl px-4 py-10">
        <Link
          href={`/pickup/${session.slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {session.title}
        </Link>

        <h1 className="mb-8 text-3xl font-bold">Session Settings</h1>

        {saveError && (
          <div className="mb-6 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {saveError}
          </div>
        )}
        {saveSuccess && (
          <div className="mb-6 rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
            Settings saved successfully.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-6">
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
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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

          <Button type="submit" className="w-full" size="lg" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save Changes"}
          </Button>
        </form>

        {/* Danger Zone */}
        <div className="mt-10">
          <Card className="border-destructive/40">
            <CardHeader>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
            </CardHeader>
            <CardContent>
              {!showDeleteConfirm ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Delete this session</p>
                    <p className="text-xs text-muted-foreground">
                      Permanently removes the session, all registrations, lineups, and scores.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteConfirm(true)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-destructive">
                    Are you sure? This cannot be undone.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleDelete}
                      disabled={isDeleting}
                    >
                      {isDeleting ? "Deleting…" : "Yes, delete session"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={isDeleting}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
