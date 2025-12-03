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

type FormData = {
  name: string;
  slug: string;
  date: string;
  location: string;
  description: string;
  maxPods: number;
  registrationDeadline: string;
  registrationOpenDate: string;
  isPublic: boolean;
  status: "upcoming" | "active" | "completed";
};

export function TournamentCreationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    slug: "",
    date: "",
    location: "",
    description: "",
    maxPods: 9,
    registrationDeadline: "",
    registrationOpenDate: "",
    isPublic: true,
    status: "upcoming",
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

    // Auto-generate slug from name
    if (field === "name" && typeof value === "string") {
      const autoSlug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setFormData((prev) => ({ ...prev, slug: autoSlug }));
    }
  };

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof FormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = "Tournament name is required";
    if (!formData.slug.trim()) newErrors.slug = "URL slug is required";
    if (!/^[a-z0-9-]+$/.test(formData.slug))
      newErrors.slug = "Slug must be lowercase letters, numbers, and hyphens";
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
      const response = await fetch("/api/tournaments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to create tournament");
        return;
      }

      // Success! Navigate to the new tournament
      router.push(`/tournaments/${data.tournament.slug}`);
    } catch (error) {
      console.error("Error creating tournament:", error);
      alert("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl">Create New Tournament</CardTitle>
        <CardDescription>
          Fill in the details to create your tournament
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
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                type="text"
                placeholder="two-peas-dec-2025"
                value={formData.slug}
                onChange={(e) => updateField("slug", e.target.value)}
                className={errors.slug ? "border-destructive" : ""}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                This will be used in the URL: /tournaments/{formData.slug || "..."}
              </p>
              {errors.slug && (
                <p className="text-destructive mt-1 text-sm">{errors.slug}</p>
              )}
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
                Leave blank to open registration immediately
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
                Most tournaments start as &quot;Upcoming&quot;
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
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Creating..." : "Create Tournament"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
