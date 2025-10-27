"use client";

import { useState } from "react";
import { defineStepper } from "@stepperize/react";
import { Turnstile } from "@marsidev/react-turnstile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check, ChevronLeft, ChevronRight } from "lucide-react";

// Define the stepper
const { useStepper } = defineStepper(
  { id: "registration", title: "Start Registration" },
  { id: "pod", title: "Register Pod" },
  { id: "team-name", title: "Name Your Team" },
  { id: "success", title: "Success!" }
);

type FormData = {
  email: string;
  player1: string;
  player2: string;
  teamName: string;
};

export function RegistrationForm() {
  const stepper = useStepper();
  const [formData, setFormData] = useState<FormData>({
    email: "",
    player1: "",
    player2: "",
    teamName: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateRegistration = () => {
    const newErrors: Partial<FormData> = {};
    if (!formData.email) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePod = () => {
    const newErrors: Partial<FormData> = {};
    if (!formData.player1.trim())
      newErrors.player1 = "Captain name is required";
    if (!formData.player2.trim())
      newErrors.player2 = "Partner name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (stepper.current.id === "registration" && !validateRegistration())
      return;
    if (stepper.current.id === "pod" && !validatePod()) return;

    if (stepper.current.id === "team-name") {
      // Submit the form
      handleSubmit();
    } else {
      stepper.next();
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch("/api/register-pod", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          player1: formData.player1,
          player2: formData.player2,
          teamName: formData.teamName,
          captchaToken,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Display error message to user
        alert(data.error || "Registration failed. Please try again.");
        return;
      }

      // Success! Go to success step
      stepper.next();
    } catch (error) {
      console.error("Error submitting form:", error);
      alert(
        "An unexpected error occurred. Please check your connection and try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate current step index
  const currentStepIndex = stepper.all.findIndex(
    (step) => step.id === stepper.current.id
  );

  return (
    <Card className="border-primary/20 bg-card/90 w-full max-w-md shadow-xl backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-2xl">{stepper.current.title}</CardTitle>
        <CardDescription>
          Step {currentStepIndex + 1} of {stepper.all.length}
        </CardDescription>
        {/* Progress bar */}
        <div className="bg-muted mt-4 h-2 w-full overflow-hidden rounded-full">
          <div
            className="bg-primary h-full transition-all duration-300"
            style={{
              width: `${((currentStepIndex + 1) / stepper.all.length) * 100}%`,
            }}
          />
        </div>
      </CardHeader>

      <CardContent>
        {stepper.switch({
          registration: () => (
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  className={errors.email ? "border-destructive" : ""}
                />
                {errors.email && (
                  <p className="text-destructive mt-1 text-sm">
                    {errors.email}
                  </p>
                )}
                <p className="text-muted-foreground mt-2 text-xs">
                  We'll send your confirmation here
                </p>
              </div>

              {/* Cloudflare Turnstile CAPTCHA */}
              <div className="flex justify-center">
                <Turnstile
                  siteKey={
                    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
                    "1x00000000000000000000AA"
                  }
                  onSuccess={(token) => setCaptchaToken(token)}
                  onError={() => setCaptchaToken("")}
                  onExpire={() => setCaptchaToken("")}
                />
              </div>
            </div>
          ),
          pod: () => (
            <div className="space-y-4">
              <div>
                <Label htmlFor="player1">Captain (Player 1)</Label>
                <Input
                  id="player1"
                  type="text"
                  placeholder="Your name"
                  value={formData.player1}
                  onChange={(e) => updateField("player1", e.target.value)}
                  className={errors.player1 ? "border-destructive" : ""}
                />
                {errors.player1 && (
                  <p className="text-destructive mt-1 text-sm">
                    {errors.player1}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="player2">Partner (Player 2)</Label>
                <Input
                  id="player2"
                  type="text"
                  placeholder="Partner's name"
                  value={formData.player2}
                  onChange={(e) => updateField("player2", e.target.value)}
                  className={errors.player2 ? "border-destructive" : ""}
                />
                {errors.player2 && (
                  <p className="text-destructive mt-1 text-sm">
                    {errors.player2}
                  </p>
                )}
              </div>

              <p className="text-muted-foreground text-sm">
                Your pod will be registered as "{formData.player1 || "Player 1"}
                & {formData.player2 || "Player 2"}"
              </p>
            </div>
          ),
          "team-name": () => (
            <div className="space-y-4">
              <div>
                <Label htmlFor="teamName">Team Name (Optional)</Label>
                <Input
                  id="teamName"
                  type="text"
                  placeholder="e.g., Thunder Spikers"
                  value={formData.teamName}
                  onChange={(e) => updateField("teamName", e.target.value)}
                />
                <p className="text-muted-foreground mt-2 text-sm">
                  Give your team a custom name, or leave blank to use "
                  {formData.player1} & {formData.player2}"
                </p>
              </div>
            </div>
          ),
          success: () => (
            <div className="space-y-4 text-center">
              <div className="bg-primary/10 mx-auto flex h-16 w-16 items-center justify-center rounded-full">
                <Check className="text-primary h-8 w-8" />
              </div>
              <div>
                <h3 className="text-xl font-semibold">
                  Registration Complete!
                </h3>
                <p className="text-muted-foreground mt-2">
                  Welcome to Bonnie & Clyde Draft 2s
                </p>
              </div>
              <div className="bg-muted/50 space-y-2 rounded-lg p-4 text-left text-sm">
                <p>
                  <strong>Team:</strong>{" "}
                  {formData.teamName ||
                    `${formData.player1} & ${formData.player2}`}
                </p>
                <p>
                  <strong>Captain:</strong> {formData.player1}
                </p>
                <p>
                  <strong>Partner:</strong> {formData.player2}
                </p>
                <p>
                  <strong>Email:</strong> {formData.email}
                </p>
              </div>
              <Button className="w-full" asChild>
                <a href="/standings">View Standings</a>
              </Button>
            </div>
          ),
        })}

        {/* Navigation buttons */}
        {stepper.current.id !== "success" && (
          <div className="mt-6 flex gap-2">
            <Button
              variant="outline"
              onClick={stepper.prev}
              disabled={stepper.isFirst || isSubmitting}
              className="flex-1"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                isSubmitting ||
                (stepper.current.id === "registration" && !captchaToken)
              }
              className="flex-1"
            >
              {isSubmitting
                ? "Submitting..."
                : stepper.isLast
                  ? "Submit"
                  : "Next"}
              {!stepper.isLast && <ChevronRight className="ml-2 h-4 w-4" />}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
