"use client";

import { useState, useEffect } from "react";
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
import { Check, ChevronLeft, ChevronRight, DollarSign } from "lucide-react";
import { createClient } from "@/lib/auth/client";
import { GoogleSignInButton } from "@/components/google-sign-in-button";
import type { User } from "@supabase/supabase-js";
import type { Tournament } from "@/lib/db/schema";

// Define the stepper with auth step first
const { useStepper } = defineStepper(
  { id: "auth", title: "Sign In" },
  { id: "confirm", title: "Confirm Details" },
  { id: "partner", title: "Add Partner" },
  { id: "team-name", title: "Name Your Team" },
  { id: "payment", title: "Payment" },
  { id: "success", title: "Success!" }
);

type FormData = {
  email: string;
  player1: string;
  player2: string;
  teamName: string;
};

export function RegistrationForm({ tournament }: { tournament: Tournament }) {
  const supabase = createClient();
  const stepper = useStepper();
  const [user, setUser] = useState<User | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [formData, setFormData] = useState<FormData>({
    email: "",
    player1: "",
    player2: "",
    teamName: "",
  });
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string>("");
  const [emailWarning, setEmailWarning] = useState<string | null>(null);

  // Check if user is already signed in
  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUser(session.user);

        // Pre-fill form data from Google account
        const metadata = session.user.user_metadata;
        const googleName =
          metadata.name || metadata.full_name || metadata.email?.split("@")[0];

        setFormData((prev) => ({
          ...prev,
          email: session.user.email ?? "",
          player1: googleName ?? "",
        }));

        // Skip to confirm step if already signed in
        stepper.goTo("confirm");
      }

      setIsCheckingAuth(false);
    };

    checkAuth();

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);

        // Pre-fill form data
        const metadata = session.user.user_metadata;
        const googleName =
          metadata.name || metadata.full_name || metadata.email?.split("@")[0];

        setFormData((prev) => ({
          ...prev,
          email: session.user.email ?? "",
          player1: prev.player1 || (googleName ?? ""),
        }));

        stepper.goTo("confirm");
      }
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateField = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateConfirm = () => {
    const newErrors: Partial<FormData> = {};
    if (!formData.player1.trim()) newErrors.player1 = "Your name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePartner = () => {
    const newErrors: Partial<FormData> = {};
    if (!formData.player2.trim())
      newErrors.player2 = "Partner name is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (stepper.current.id === "confirm" && !validateConfirm()) return;
    if (stepper.current.id === "partner" && !validatePartner()) return;

    if (stepper.current.id === "payment") {
      // Submit the form after payment step
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
          tournamentId: tournament.id,
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

      // Check if email failed to send
      if (!data.emailSent && data.emailError) {
        console.error("Email failed to send:", data.emailError);
        setEmailWarning(
          "Your registration was successful, but the confirmation email failed to send. Please check your spam folder or contact the organizer."
        );
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
        {isCheckingAuth ? (
          <div className="flex items-center justify-center py-8">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" />
          </div>
        ) : (
          stepper.switch({
            auth: () => (
              <div className="space-y-4">
                <p className="text-muted-foreground text-center text-sm">
                  Sign in with your Google account to register for the
                  tournament. This helps us keep track of participants and send
                  you updates.
                </p>
                <GoogleSignInButton />
                <p className="text-muted-foreground text-center text-xs">
                  By signing in, you agree to receive tournament-related emails
                </p>
              </div>
            ),
            confirm: () => (
              <div className="space-y-4">
                <div className="bg-muted/50 space-y-2 rounded-lg p-3 text-sm">
                  <p>
                    <strong>Signed in as:</strong>
                  </p>
                  <p className="text-muted-foreground">{user?.email}</p>
                </div>

                <div>
                  <Label htmlFor="player1">Your Name (Captain)</Label>
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
                  <p className="text-muted-foreground mt-2 text-xs">
                    This is pre-filled from your Google account, but you can
                    change it
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
            partner: () => (
              <div className="space-y-4">
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
                  Your pod will be registered as &quot;
                  {formData.player1 || "Player 1"}&{" "}
                  {formData.player2 || "Player 2"}&quot;
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
                    Give your team a custom name, or leave blank to use &quot;
                    {formData.player1} & {formData.player2}&quot;
                  </p>
                </div>
              </div>
            ),
            payment: () => (
              <div className="space-y-4">
                {/* Price Display */}
                <div className="bg-accent/20 border-accent flex items-center justify-between rounded-lg border p-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-accent flex h-12 w-12 items-center justify-center rounded-full">
                      <DollarSign className="text-accent-foreground h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-semibold">Registration Fee</p>
                      <p className="text-muted-foreground text-sm">
                        Per person
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold">$25</p>
                  </div>
                </div>

                {/* Payment Instructions */}
                <div className="bg-muted/50 space-y-3 rounded-lg p-4">
                  <h4 className="font-semibold">Payment via Venmo</h4>
                  <p className="text-muted-foreground text-sm">
                    Please send your payment to secure your spot:
                  </p>
                  <div className="bg-background flex items-center justify-between rounded-md border p-3">
                    <span className="font-mono text-lg">@sduon1</span>
                  </div>

                  {/* Venmo Button */}
                  <Button type="button" className="w-full" size="lg" asChild>
                    <a
                      href={`venmo://paycharge?txn=pay&recipients=sduon1&amount=20&note=Two Peas Tournament - ${formData.player1} & ${formData.player2}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => {
                        // Fallback to web if app doesn't open
                        setTimeout(() => {
                          window.open("https://venmo.com/u/sduon1", "_blank");
                        }, 500);
                      }}
                    >
                      Open Venmo to Pay
                    </a>
                  </Button>

                  <p className="text-muted-foreground text-center text-xs">
                    Can&apos;t open Venmo? Visit{" "}
                    <a
                      href="https://venmo.com/u/sduon1"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      venmo.com/u/sduon1
                    </a>
                  </p>
                </div>

                {/* Prize Reminder */}
                <div className="bg-primary/10 border-primary/20 rounded-lg border p-3">
                  <p className="text-sm">
                    <strong>🏆 Winner gets their $25 back!</strong>
                  </p>
                </div>

                <p className="text-muted-foreground text-center text-xs">
                  By completing registration, you confirm payment has been sent
                </p>
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
                    You&apos;re now Two Peas in a Pod!
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

                {/* Email Warning */}
                {emailWarning && (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-left dark:border-yellow-900 dark:bg-yellow-950/20">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      ⚠️ {emailWarning}
                    </p>
                  </div>
                )}

                {/* <Button className="w-full" asChild>
                <a href="/standings">View Standings</a>
              </Button> */}
              </div>
            ),
          })
        )}

        {/* Navigation buttons */}
        {stepper.current.id !== "success" && stepper.current.id !== "auth" && (
          <div className="mt-6 flex gap-2">
            <Button
              variant="outline"
              onClick={stepper.prev}
              disabled={
                stepper.isFirst ||
                isSubmitting ||
                stepper.current.id === "confirm"
              }
              className="flex-1"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Previous
            </Button>
            <Button
              onClick={handleNext}
              disabled={
                isSubmitting ||
                (stepper.current.id === "confirm" && !captchaToken)
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
