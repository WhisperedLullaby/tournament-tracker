"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Tournament } from "@/lib/db/schema";

type FormData = {
  name: string;
  date: string;
  location: string;
  description: string;
  maxPods: number;
  registrationDeadline: string;
  registrationOpenDate: string;
  isPublic: boolean;
  status: "upcoming" | "active" | "completed";
  poolPlayDescription: string;
  bracketPlayDescription: string;
};

export function TournamentSettingsForm({
  tournament,
}: {
  tournament: Tournament;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: tournament.name,
    date: tournament.date.toISOString().split("T")[0],
    location: tournament.location || "",
    description: tournament.description || "",
    maxPods: tournament.maxPods,
    registrationDeadline: tournament.registrationDeadline
      ? tournament.registrationDeadline.toISOString().split("T")[0]
      : "",
    registrationOpenDate: tournament.registrationOpenDate
      ? tournament.registrationOpenDate.toISOString().split("T")[0]
      : "",
    isPublic: tournament.isPublic,
    status: tournament.status,
    poolPlayDescription: tournament.poolPlayDescription || "",
    bracketPlayDescription: tournament.bracketPlayDescription || "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>(
    {}
  );

  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = "Tournament name is required";
    if (!formData.date) newErrors.date = "Tournament date is required";
    if (!formData.location.trim())
      newErrors.location = "Location is required";
    if (formData.maxPods < 2)
      newErrors.maxPods = "Must allow at least 2 teams";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to update tournament");
        return;
      }

      // Success! Refresh the page to show updated data
      router.refresh();
      alert("Tournament updated successfully!");
    } catch (error) {
      console.error("Error updating tournament:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/tournaments/${tournament.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to delete tournament");
        return;
      }

      // Success! Redirect to tournaments page
      router.push("/tournaments");
      alert("Tournament deleted successfully!");
    } catch (error) {
      console.error("Error deleting tournament:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Tournament Settings</CardTitle>
        <CardDescription>
          Update your tournament details and settings
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div>
              <Label htmlFor="name">Tournament Name *</Label>
              <Input
                id="name"
                type="text"
                placeholder="e.g., Two Peas Pod - December 2025"
                value={formData.name}
                onChange={(e) => updateField("name", e.target.value)}
                className={errors.name ? "border-destructive" : ""}
              />
              {errors.name && (
                <p className="text-destructive mt-1 text-sm">{errors.name}</p>
              )}
            </div>

            <div>
              <Label>URL Slug</Label>
              <Input
                type="text"
                value={tournament.slug}
                disabled
                className="bg-muted"
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Slug cannot be changed after creation
              </p>
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Brief description of your tournament..."
                value={formData.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Date & Location */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Date & Location</h3>

            <div>
              <Label htmlFor="date">Tournament Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => updateField("date", e.target.value)}
                className={errors.date ? "border-destructive" : ""}
              />
              {errors.date && (
                <p className="text-destructive mt-1 text-sm">{errors.date}</p>
              )}
            </div>

            <div>
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                type="text"
                placeholder="e.g., All American FieldHouse, Monroeville, PA"
                value={formData.location}
                onChange={(e) => updateField("location", e.target.value)}
                className={errors.location ? "border-destructive" : ""}
              />
              {errors.location && (
                <p className="text-destructive mt-1 text-sm">
                  {errors.location}
                </p>
              )}
            </div>
          </div>

          {/* Tournament Format */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tournament Format</h3>
            <p className="text-muted-foreground text-sm">
              Customize the Pool Play and Bracket Play descriptions shown on your tournament page.
            </p>

            <div>
              <Label htmlFor="poolPlayDescription">Pool Play Description</Label>
              <Textarea
                id="poolPlayDescription"
                placeholder="Describe pool play format..."
                value={formData.poolPlayDescription}
                onChange={(e) => updateField("poolPlayDescription", e.target.value)}
                rows={5}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Leave blank to use default content based on tournament type
              </p>
            </div>

            <div>
              <Label htmlFor="bracketPlayDescription">Bracket Play Description</Label>
              <Textarea
                id="bracketPlayDescription"
                placeholder="Describe bracket play format..."
                value={formData.bracketPlayDescription}
                onChange={(e) => updateField("bracketPlayDescription", e.target.value)}
                rows={5}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Leave blank to use default content based on tournament type
              </p>
            </div>
          </div>

          {/* Registration Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Registration Settings</h3>

            <div>
              <Label htmlFor="maxPods">Maximum Teams *</Label>
              <Input
                id="maxPods"
                type="number"
                min="2"
                value={formData.maxPods}
                onChange={(e) =>
                  updateField("maxPods", parseInt(e.target.value) || 0)
                }
                className={errors.maxPods ? "border-destructive" : ""}
              />
              {errors.maxPods && (
                <p className="text-destructive mt-1 text-sm">
                  {errors.maxPods}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="registrationOpenDate">
                Registration Opens (Optional)
              </Label>
              <Input
                id="registrationOpenDate"
                type="date"
                value={formData.registrationOpenDate}
                onChange={(e) =>
                  updateField("registrationOpenDate", e.target.value)
                }
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Leave blank if registration is already open
              </p>
            </div>

            <div>
              <Label htmlFor="registrationDeadline">
                Registration Deadline (Optional)
              </Label>
              <Input
                id="registrationDeadline"
                type="date"
                value={formData.registrationDeadline}
                onChange={(e) =>
                  updateField("registrationDeadline", e.target.value)
                }
              />
            </div>
          </div>

          {/* Visibility & Status */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Visibility & Status</h3>

            <div>
              <Label htmlFor="status">Tournament Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: "upcoming" | "active" | "completed") =>
                  updateField("status", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground mt-1 text-xs">
                Change status to &quot;Active&quot; when tournament begins
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => updateField("isPublic", e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="isPublic" className="font-normal">
                Make tournament publicly visible
              </Label>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>

        {/* Danger Zone */}
        <div className="mt-8 pt-8 border-t border-destructive/30">
          <h3 className="text-lg font-semibold text-destructive mb-2">
            Danger Zone
          </h3>
          <p className="text-muted-foreground text-sm mb-4">
            Once you delete a tournament, there is no going back. All registrations,
            matches, and standings will be permanently deleted.
          </p>

          {!showDeleteConfirm ? (
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={isSubmitting || isDeleting}
            >
              Delete Tournament
            </Button>
          ) : (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <p className="font-semibold mb-3">
                Are you absolutely sure you want to delete &quot;{tournament.name}&quot;?
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                This action cannot be undone. This will permanently delete the tournament
                and all associated data.
              </p>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? "Deleting..." : "Yes, Delete Tournament"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
