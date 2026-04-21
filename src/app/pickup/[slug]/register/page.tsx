"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePickup } from "@/contexts/pickup-context";
import { useAuth } from "@/contexts/auth-context";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PositionSelector } from "@/components/pickup/position-selector";
import { ArrowLeft } from "lucide-react";

function GoogleSignInButton({ redirectPath }: { redirectPath: string }) {
  const { signIn } = useAuth();
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full"
      onClick={() => signIn(redirectPath)}
    >
      <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Sign in with Google
    </Button>
  );
}

export default function PickupRegisterPage() {
  const { session, userRegistration, isLoading } = usePickup();
  const { user } = useAuth();
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [position, setPosition] = useState("");
  const [registeredCounts, setRegisteredCounts] = useState<Record<string, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Pre-fill from auth user
  useEffect(() => {
    if (user) {
      setEmail(user.email ?? "");
      const name = user.user_metadata?.full_name ?? user.user_metadata?.name ?? "";
      setDisplayName(name);
    }
  }, [user]);

  // Fetch current registered counts per position
  useEffect(() => {
    fetch(`/api/pickup/${session.id}/registrations`)
      .then((r) => r.json())
      .then((d) => {
        const counts: Record<string, number> = {};
        for (const reg of d.registrations ?? []) {
          if (reg.status === "registered") {
            counts[reg.position] = (counts[reg.position] ?? 0) + 1;
          }
        }
        setRegisteredCounts(counts);
      });
  }, [session.id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!position) {
      setError("Please select a position.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/pickup/${session.id}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, displayName, position }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Registration failed.");
        return;
      }

      setSuccess(data.message);
      setTimeout(() => router.push(`/pickup/${session.slug}`), 1800);
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  }

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

  if (session.status !== "upcoming") {
    return (
      <>
        <Navigation />
        <div className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-4 px-4">
          <p className="text-lg font-medium">Registration is closed for this session.</p>
          <Button asChild variant="outline">
            <Link href={`/pickup/${session.slug}`}>Back to Session</Link>
          </Button>
        </div>
        <Footer />
      </>
    );
  }

  if (userRegistration) {
    return (
      <>
        <Navigation />
        <div className="container mx-auto flex min-h-screen flex-col items-center justify-center gap-4 px-4">
          <div className="rounded-lg border bg-green-50 p-6 text-center">
            <p className="text-lg font-semibold text-green-800">You&apos;re already registered!</p>
            <p className="mt-1 text-sm text-green-700">
              Position: {userRegistration.position.replace(/_/g, " ")}
              {userRegistration.status === "waitlisted" &&
                ` · Waitlist #${userRegistration.waitlistPosition}`}
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href={`/pickup/${session.slug}`}>Back to Session</Link>
          </Button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      <div className="container mx-auto max-w-lg px-4 py-10">
        <Link
          href={`/pickup/${session.slug}`}
          className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to {session.title}
        </Link>

        <h1 className="mb-1 text-2xl font-bold">Sign Up</h1>
        <p className="mb-6 text-muted-foreground text-sm">{session.title}</p>

        {/* Google sign-in prompt for guests */}
        {!user && (
          <div className="mb-6 rounded-lg border bg-muted/40 p-4">
            <p className="text-sm font-medium mb-1">Want stats on your profile?</p>
            <p className="text-xs text-muted-foreground mb-3">
              Sign in with Google to link this session to your account.
            </p>
            <GoogleSignInButton redirectPath={`/pickup/${session.slug}/register`} />
            <p className="mt-3 text-xs text-center text-muted-foreground">
              or continue as a guest below
            </p>
          </div>
        )}

        {success ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
            <p className="font-medium text-green-800">{success}</p>
            <p className="mt-1 text-sm text-green-600">Redirecting you back…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="displayName">Your Name *</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Jane Smith"
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                readOnly={!!user}
              />
              {user && (
                <p className="text-xs text-muted-foreground">Using your signed-in account.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label>Position *</Label>
              <PositionSelector
                positionLimits={session.positionLimits}
                registeredCounts={registeredCounts}
                value={position}
                onChange={setPosition}
              />
              {position && (
                <p className="text-xs text-muted-foreground">
                  Selected: {position.replace(/_/g, " ")}
                  {(registeredCounts[position] ?? 0) >= (session.positionLimits[position] ?? 0) &&
                    " · This position is full — you will be waitlisted."}
                </p>
              )}
            </div>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isSubmitting || !position}
            >
              {isSubmitting ? "Registering…" : "Sign Up"}
            </Button>
          </form>
        )}
      </div>

      <Footer />
    </div>
  );
}
