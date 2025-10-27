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
import { Calendar, MapPin, Trophy, Users } from "lucide-react";
import Link from "next/link";

type RegistrationStatus = {
  isOpen: boolean;
  podCount: number;
  maxPods: number;
};

export function HomePageClient() {
  // Start optimistically assuming registration is open
  const [registrationStatus, setRegistrationStatus] =
    useState<RegistrationStatus>({ isOpen: true, podCount: 0, maxPods: 9 });
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
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
        title1="Bonnie & Clyde"
        title2="Draft 2s Tournament"
        description="Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."
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
          <h2 className="text-primary mb-12 text-5xl font-bold sm:text-7xl">
            Tournament Information
          </h2>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Date & Time Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="text-accent h-5 w-5" />
                  Date & Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="font-medium">November 1st, 2025</p>
                <p className="text-muted-foreground">10:00 AM - 2:00 PM</p>
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
                <p className="font-medium">Registration Refund</p>
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
      <section className="bg-muted/30 py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto">
            <h2 className="text-primary mb-8 text-right text-5xl font-bold sm:text-7xl">
              Tournament Format
            </h2>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Pool Play Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Pool Play (4 Rounds)</CardTitle>
                  <CardDescription>
                    Mixed pods compete for seeding
                  </CardDescription>
                </CardHeader>
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

              {/* Bracket Play Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Bracket Play</CardTitle>
                  <CardDescription>Double elimination showdown</CardDescription>
                </CardHeader>
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
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto">
            <h2 className="text-primary mb-12 text-5xl font-bold sm:text-7xl">
              Tournament Rules
            </h2>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-2xl">
                  <Users className="text-accent h-6 w-6" />
                  Reverse Coed Rules
                </CardTitle>
                <CardDescription>
                  No rotation required. Only rotate servers (everyone must
                  serve). Can rotate if preferred, but revco rules apply.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-primary mb-2 font-semibold">
                    Net Height
                  </h4>
                  <p className="text-muted-foreground">
                    Women's regulation height (7'4⅛") - lower net, higher fun!
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
          <Button
            size="lg"
            variant="secondary"
            className="text-base"
            asChild
            disabled={!registrationStatus.isOpen}
          >
            <Link href={registrationStatus.isOpen ? "#" : "/standings"}>
              {registrationStatus.isOpen
                ? "Register Now"
                : "View Registered Teams"}
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
