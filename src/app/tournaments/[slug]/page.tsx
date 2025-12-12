"use client";

import { useTournament } from "@/contexts/tournament-context";
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
import Link from "next/link";
import { TournamentDetailsSection } from "@/components/sections/tournament-details-section";
import { TournamentFormatSection } from "@/components/sections/tournament-format-section";
import { TournamentRulesSection } from "@/components/sections/tournament-rules-section";
import { TournamentCTASection } from "@/components/sections/tournament-cta-section";
import { QuickActionsSubFooter } from "@/components/sections/quick-actions-subfooter";
import { useState, useEffect } from "react";

export default function TournamentPage() {
  const { tournament, userRole, isLoading } = useTournament();
  const [registrationStatus, setRegistrationStatus] = useState<{
    isOpen: boolean;
    podCount: number;
  }>({ isOpen: true, podCount: 0 });

  useEffect(() => {
    if (tournament) {
      // Fetch pod count from API for this tournament
      fetch(`/api/tournaments/${tournament.id}/pods-count`)
        .then(res => res.json())
        .then(data => {
          setRegistrationStatus({
            isOpen: data.count < tournament.maxPods && tournament.status === "upcoming",
            podCount: data.count,
          });
        })
        .catch(() => {
          // Fallback: assume registration is based on status only
          setRegistrationStatus({
            isOpen: tournament.status === "upcoming",
            podCount: 0,
          });
        });
    }
  }, [tournament]);

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="flex items-center justify-center min-h-screen">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
        <Footer />
      </>
    );
  }

  const badgeText = registrationStatus.isOpen
    ? "Registration Open"
    : "Registration Closed";

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      {/* Hero Section with Registration Form */}
      <HeroGeometric
        badge={badgeText}
        title1={tournament.name}
        title2=""
        description={
          tournament.description ||
          "Inviting volleyball players of all skill levels to connect, play, and compete!"
        }
        rightContent={
          registrationStatus.isOpen && !userRole ? (
            <RegistrationForm tournament={tournament} />
          ) : (
            <Card className="border-primary/20 bg-card/90 w-full max-w-md shadow-xl backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-2xl">
                  {userRole ? "You're Registered!" : "Registration Closed"}
                </CardTitle>
                <CardDescription>
                  {userRole
                    ? "You're all set for the tournament!"
                    : `All ${tournament.maxPods} spots have been filled!`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  {userRole
                    ? "Check the schedule and standings to prepare for tournament day."
                    : `Thank you for your interest. The tournament is now full with ${registrationStatus.podCount} registered pods.`}
                </p>
                <Button className="w-full" asChild>
                  <Link
                    href={`/tournaments/${tournament.slug}/${userRole ? "schedule" : "standings"}`}
                  >
                    {userRole ? "View Schedule" : "View Registered Teams"}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        }
      />

      {/* Tournament Details Section */}
      <TournamentDetailsSection
        date={tournament.date}
        location={tournament.location}
        maxPods={tournament.maxPods}
        registrationDeadline={tournament.registrationDeadline}
        prizeInfo={tournament.prizeInfo}
      />

      {/* Tournament Format Section */}
      <TournamentFormatSection
        poolPlayDescription={tournament.poolPlayDescription}
        bracketPlayDescription={tournament.bracketPlayDescription}
        tournamentType={tournament.tournamentType}
      />

      {/* Tournament Rules Section */}
      <TournamentRulesSection rulesDescription={tournament.rulesDescription} />

      {/* CTA Section */}
      <TournamentCTASection
        tournamentSlug={tournament.slug}
        tournamentStatus={tournament.status as "upcoming" | "active" | "completed"}
        userRole={userRole}
      />

      {/* Quick Actions Sub-Footer */}
      <QuickActionsSubFooter
        tournamentSlug={tournament.slug}
        tournamentStatus={tournament.status as "upcoming" | "active" | "completed"}
        userRole={userRole}
      />

      <Footer />
    </div>
  );
}
