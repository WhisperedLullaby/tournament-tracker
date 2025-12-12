"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getTemplateForType, type TournamentType } from "@/lib/tournament-templates";
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

  // Tournament Configuration
  tournamentType: "pod_2" | "pod_3" | "set_teams";
  bracketStyle: "single_elimination" | "double_elimination";
  level: "c" | "b" | "a" | "open";
  maxPods: number;
  maxTeams: number;

  // Scoring Rules
  startPoints: number;
  endPoints: number;
  winByTwo: boolean;
  cap: number | null;
  game3EndPoints: number | null;

  // Dynamic Content
  poolPlayDescription: string;
  bracketPlayDescription: string;
  rulesDescription: string;
  prizeInfo: string;

  // Registration & Visibility
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

    // Tournament Configuration - Sensible defaults
    tournamentType: "pod_2",
    bracketStyle: "single_elimination",
    level: "open",
    maxPods: 9,
    maxTeams: 9,

    // Scoring Rules - Standard volleyball scoring
    startPoints: 0,
    endPoints: 21,
    winByTwo: true,
    cap: null,
    game3EndPoints: null,

    // Dynamic Content - Empty by default
    poolPlayDescription: "",
    bracketPlayDescription: "",
    rulesDescription: "",
    prizeInfo: "",

    // Registration & Visibility
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

    // Auto-fill pool/bracket descriptions when tournament type changes
    if (field === "tournamentType" && typeof value === "string") {
      const template = getTemplateForType(value as TournamentType);
      setFormData((prev) => ({
        ...prev,
        poolPlayDescription: template.poolPlay,
        bracketPlayDescription: template.bracketPlay,
      }));
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

          {/* Tournament Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tournament Configuration</h3>

            <div>
              <Label htmlFor="tournamentType">Tournament Type *</Label>
              <Select
                value={formData.tournamentType}
                onValueChange={(value: "pod_2" | "pod_3" | "set_teams") =>
                  updateField("tournamentType", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pod_2">2-Player Pods</SelectItem>
                  <SelectItem value="pod_3">3-Player Pods</SelectItem>
                  <SelectItem value="set_teams">Set Teams (Captain + up to 8 players)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground mt-1 text-xs">
                Choose how teams are formed for this tournament
              </p>
            </div>

            <div>
              <Label htmlFor="bracketStyle">Bracket Style *</Label>
              <Select
                value={formData.bracketStyle}
                onValueChange={(value: "single_elimination" | "double_elimination") =>
                  updateField("bracketStyle", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_elimination">Single Elimination</SelectItem>
                  <SelectItem value="double_elimination">Double Elimination</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground mt-1 text-xs">
                Single elimination: One loss and you&apos;re out | Double: Must lose twice
              </p>
            </div>

            <div>
              <Label htmlFor="level">Skill Level</Label>
              <Select
                value={formData.level}
                onValueChange={(value: "c" | "b" | "a" | "open") =>
                  updateField("level", value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="c">C Level (Recreational)</SelectItem>
                  <SelectItem value="b">B Level (Intermediate)</SelectItem>
                  <SelectItem value="a">A Level (Advanced)</SelectItem>
                  <SelectItem value="open">Open (All Levels)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-muted-foreground mt-1 text-xs">
                Skill level designation (display only)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="maxPods">Max Pods/Teams *</Label>
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
                <Label htmlFor="maxTeams">Max Teams (Alt) *</Label>
                <Input
                  id="maxTeams"
                  type="number"
                  min="2"
                  value={formData.maxTeams}
                  onChange={(e) =>
                    updateField("maxTeams", parseInt(e.target.value) || 0)
                  }
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  For set team tournaments
                </p>
              </div>
            </div>
          </div>

          {/* Scoring Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Scoring Rules</h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startPoints">Start Points *</Label>
                <Input
                  id="startPoints"
                  type="number"
                  min="0"
                  value={formData.startPoints}
                  onChange={(e) =>
                    updateField("startPoints", parseInt(e.target.value) || 0)
                  }
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Usually 0 or 4
                </p>
              </div>

              <div>
                <Label htmlFor="endPoints">End Points *</Label>
                <Input
                  id="endPoints"
                  type="number"
                  min="1"
                  value={formData.endPoints}
                  onChange={(e) =>
                    updateField("endPoints", parseInt(e.target.value) || 0)
                  }
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Usually 21 or 25
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="winByTwo"
                checked={formData.winByTwo}
                onChange={(e) => updateField("winByTwo", e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="winByTwo" className="font-normal">
                Must win by 2 points
              </Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cap">Cap (Optional)</Label>
                <Input
                  id="cap"
                  type="number"
                  min="1"
                  placeholder="e.g., 27"
                  value={formData.cap ?? ""}
                  onChange={(e) =>
                    updateField("cap", e.target.value ? parseInt(e.target.value) : null)
                  }
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Max score (for time limits)
                </p>
              </div>

              <div>
                <Label htmlFor="game3EndPoints">Game 3 End Points (Optional)</Label>
                <Input
                  id="game3EndPoints"
                  type="number"
                  min="1"
                  placeholder="e.g., 15"
                  value={formData.game3EndPoints ?? ""}
                  onChange={(e) =>
                    updateField("game3EndPoints", e.target.value ? parseInt(e.target.value) : null)
                  }
                />
                <p className="text-muted-foreground mt-1 text-xs">
                  Different end point for game 3
                </p>
              </div>
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

          {/* Tournament Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Tournament Details (Optional)</h3>
            <p className="text-muted-foreground text-sm">
              Describe your tournament format. These will appear in the structured Pool Play and Bracket Play sections on your tournament page.
            </p>

            <div>
              <Label htmlFor="poolPlayDescription">Pool Play Description</Label>
              <Textarea
                id="poolPlayDescription"
                placeholder={`Example:\n9 Pods of 2 Players\n18 total players divided into partnerships\n\n6v6 Matches\n3 pods per side, 3 pods rest each round\n\nSeeding by Point Differential\nPods ranked 1-9 after pool play`}
                value={formData.poolPlayDescription}
                onChange={(e) => updateField("poolPlayDescription", e.target.value)}
                rows={6}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Describe how pool play works. Content will appear in the Pool Play card.
              </p>
            </div>

            <div>
              <Label htmlFor="bracketPlayDescription">Bracket Play Description</Label>
              <Textarea
                id="bracketPlayDescription"
                placeholder={`Example:\n3 Teams of 6 Players\nSeeds 1+5+9, 2+6+7, 3+4+8\n\nBalanced Team Formation\nTop, middle, and bottom seeds combined\n\nDouble Elimination\nEveryone must lose twice to be eliminated`}
                value={formData.bracketPlayDescription}
                onChange={(e) => updateField("bracketPlayDescription", e.target.value)}
                rows={6}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Describe how bracket play works. Content will appear in the Bracket Play card.
              </p>
            </div>

            <div>
              <Label htmlFor="rulesDescription">Rules Description</Label>
              <Textarea
                id="rulesDescription"
                placeholder="Example: Women&apos;s net height (7&apos;4⅛&quot;). Reverse coed rules apply. Rally scoring to 21 points, win by 2."
                value={formData.rulesDescription}
                onChange={(e) => updateField("rulesDescription", e.target.value)}
                rows={6}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                List your tournament rules. Use **Header** for section titles (optional).
              </p>
            </div>

            <div>
              <Label htmlFor="prizeInfo">Prize Information</Label>
              <Textarea
                id="prizeInfo"
                placeholder="Example: $20 registration fee. Winning team gets entry fee back. Runner-up receives medals."
                value={formData.prizeInfo}
                onChange={(e) => updateField("prizeInfo", e.target.value)}
                rows={4}
              />
              <p className="text-muted-foreground mt-1 text-xs">
                Describe registration fees and prizes. Use **Bold** text with **Header** for emphasis (optional).
              </p>
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
