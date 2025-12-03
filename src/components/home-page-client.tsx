"use client";

import { useState, useEffect } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { HeroGeometric } from "@/components/hero-geometric";
import { RegistrationForm } from "@/components/registration-form";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar, MapPin, Trophy } from "lucide-react";
import Link from "next/link";
import volleyballImage from "@/app/assets/images/image.jpg";
import { GridPattern } from "@/components/ui/grid-pattern";

type RegistrationStatus = {
  isOpen: boolean;
  podCount: number;
  maxPods: number;
};

export function HomePageClient() {
  // Start optimistically assuming registration is open
  const [registrationStatus, setRegistrationStatus] =
    useState<RegistrationStatus>({ isOpen: true, podCount: 0, maxPods: 9 });

  useEffect(() => {
    async function fetchRegistrationStatus() {
      try {
        const response = await fetch("/api/registration-status");
        const data = await response.json();
        setRegistrationStatus(data);
      } catch (error) {
        console.error("Error fetching registration status:", error);
        // Default to open if there's an error
        setRegistrationStatus({ isOpen: true, podCount: 0, maxPods: 9 });
      }
    }

    fetchRegistrationStatus();
  }, []);

  const badgeText = registrationStatus.isOpen
    ? "Registration Open"
    : "Registration Closed";

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      {/* Hero Section with Registration Form */}
      <HeroGeometric
        badge={badgeText}
        title1="Two Peas"
        title2="Pod Tournament"
        description="Inviting volleyball players of all skill levels to connect, play, and compete!"
        rightContent={
          registrationStatus.isOpen ? (
            <RegistrationForm />
          ) : (
            <Card className="border-primary/20 bg-card/90 w-full max-w-md shadow-xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl">Registration Closed</CardTitle>
                <CardDescription>
                  All {registrationStatus.maxPods} spots have been filled!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Thank you for your interest. The tournament is now full with{" "}
                  {registrationStatus.podCount} registered pods.
                </p>
                <Button className="w-full" asChild>
                  <Link href="/standings">View Registered Teams</Link>
                </Button>
              </CardContent>
            </Card>
          )
        }
      />

      {/* Tournament Info Section */}
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="from-primary via-accent to-primary mb-12 bg-linear-to-r bg-clip-text text-5xl font-bold text-transparent md:text-8xl">
            Tournament Details
          </h2>

          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Date & Time Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="text-accent h-5 w-5" />
                  Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">December 13th, 2025</p>
                <p className="text-muted-foreground">10:00 AM - 4:00 PM</p>
                <p className="text-muted-foreground text-sm">6 sets minimum.</p>
              </CardContent>
            </Card>

            {/* Location Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="text-accent h-5 w-5" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">All American FieldHouse</p>
                <p className="text-muted-foreground text-sm">Champions Court</p>
                <a
                  href="https://www.google.com/maps/search/?api=1&query=1+Racquet+Ln%2C+Monroeville%2C+PA+15146"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary inline-block text-sm underline-offset-4 hover:underline"
                >
                  1 Racquet Ln, Monroeville, PA 15146
                </a>
                <p className="text-muted-foreground text-sm">
                  Click address for directions
                </p>
              </CardContent>
            </Card>

            {/* Prize Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="text-accent h-5 w-5" />
                  Winner Takes All
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">$25 Registration Fee</p>
                <p className="text-muted-foreground">
                  Winning team gets their registration fee back!
                </p>
                <p className="text-muted-foreground text-sm">
                  Play for free and bragging rights
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Format Section */}
      <section className="bg-muted/40 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto">
            <h2 className="from-primary via-accent to-primary mb-12 bg-linear-to-r bg-clip-text text-5xl font-bold text-transparent md:text-8xl">
              Tournament Format
            </h2>

            <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-3">
              {/* Pool Play Card */}
              <div className="flex flex-col justify-center">
                <h2 className="text-4xl font-bold">Pool Play (4 Rounds)</h2>
                <h3 className="text-muted-foreground text-xl">
                  Mixed pods compete for seeding
                </h3>
              </div>
              <Card>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">9 Pods of 2 Players</p>
                    <p className="text-muted-foreground text-sm">
                      18 total players divided into partnerships
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">6v6 Matches</p>
                    <p className="text-muted-foreground text-sm">
                      3 pods per side, 3 pods rest each round
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Seeding by Point Differential</p>
                    <p className="text-muted-foreground text-sm">
                      Pods ranked 1-9 after pool play
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="relative min-h-[200px] overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor:
                      "color-mix(in oklab, var(--muted) 40%, transparent)",
                    backgroundImage: `url(${volleyballImage.src})`,
                    backgroundSize: "259%",
                    backgroundPosition: "calc(100% + 110px) -86px",
                    backgroundBlendMode: "overlay",
                  }}
                />
              </Card>
            </div>
            <div className="mx-auto mt-12 grid max-w-6xl gap-12 md:grid-cols-3">
              <Card className="relative hidden min-h-[200px] overflow-hidden md:block">
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor:
                      "color-mix(in oklab, var(--muted) 40%, transparent)",
                    backgroundImage: `url(${volleyballImage.src})`,
                    backgroundSize: "259%",
                    backgroundPosition: "0 -291px",
                    backgroundBlendMode: "overlay",
                  }}
                />
              </Card>
              {/* Bracket Play Card */}
              <div className="flex flex-col justify-center text-right">
                <h2 className="text-4xl font-bold">Bracket Play</h2>
                <h3 className="text-muted-foreground text-xl">
                  Double elimination showdown
                </h3>
              </div>
              <Card>
                <CardContent className="space-y-3">
                  <div>
                    <p className="font-medium">3 Teams of 6 Players</p>
                    <p className="text-muted-foreground text-sm">
                      Seeds 1+5+9, 2+6+7, 3+4+8
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Balanced Team Formation</p>
                    <p className="text-muted-foreground text-sm">
                      Top, middle, and bottom seeds combined
                    </p>
                  </div>
                  <div>
                    <p className="font-medium">Double Elimination</p>
                    <p className="text-muted-foreground text-sm">
                      Everyone must lose twice to be eliminated
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Rules Section */}
      <section className="relative overflow-hidden py-16 md:py-24">
        {/* Grid pattern background */}
        <GridPattern
          width={80}
          height={80}
          x={-1}
          y={-1}
          className="stroke-primary/10 fill-primary/5"
        />

        {/* Gradient fade overlay */}
        <div className="from-background to-background/80 pointer-events-none absolute inset-0 bg-linear-to-t via-transparent" />

        <div className="relative z-10 container mx-auto px-4">
          <div className="mx-auto">
            <h2 className="from-primary via-accent to-primary mb-12 bg-linear-to-r bg-clip-text text-5xl font-bold text-transparent md:text-8xl">
              Tournament Rules
            </h2>
            <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-7">
              <Card className="col-span-full md:col-span-3">
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-primary mb-2 font-semibold">
                      Net Height
                    </h4>
                    <p className="text-muted-foreground">
                      Women&apos;s regulation height (7&apos;4⅛&quot;) - lower
                      net, higher fun!
                    </p>
                  </div>
                  <div>
                    <h4 className="text-primary mb-2 font-semibold">
                      Male Player Restrictions
                    </h4>
                    <ul className="text-muted-foreground list-inside list-disc space-y-1">
                      <li>Cannot attack from front row above net height</li>
                      <li>Cannot block at the net</li>
                      <li>Can attack from behind the 10-foot line</li>
                      <li>Can jump serve</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-primary mb-2 font-semibold">Scoring</h4>
                    <p className="text-muted-foreground">
                      Rally scoring to 21 points.
                    </p>
                  </div>
                </CardContent>
              </Card>
              <div className="col-span-full flex flex-col justify-center text-right md:col-span-4">
                <h2 className="text-4xl font-bold">Reverse Coed Rules</h2>
                <h3 className="text-muted-foreground text-xl">
                  No rotation required. Only rotate servers (everyone must
                  serve). Can rotate if preferred, but revco rules apply.
                </h3>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-accent text-accent-foreground py-16 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
            Ready to Compete?
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg">
            Grab your partner and register your pod for an unforgettable day of
            volleyball!
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
}
