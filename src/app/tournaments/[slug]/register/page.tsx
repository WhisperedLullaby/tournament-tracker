"use client";

import { useTournament } from "@/contexts/tournament-context";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { HeroGeometric } from "@/components/hero-geometric";
import { RegistrationForm } from "@/components/registration-form";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  const { tournament, userRole, hasRegisteredTeam, isLoading } = useTournament();

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

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
        {/* Hero Section */}
        <HeroGeometric
          badge="REGISTRATION"
          title1="Team"
          title2="Registration"
          description={`Sign up your team for ${tournament.name}`}
          className="mb-12"
        />

        <div className="container mx-auto px-4 pb-16">
          {/* Back Link */}
          <Link
            href={`/tournaments/${tournament.slug}`}
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-8"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Tournament Overview
          </Link>

          {hasRegisteredTeam ? (
            <div className="max-w-2xl mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-2">Already Registered</h2>
                <p className="text-gray-700">
                  You have already registered a team for this tournament.
                  {userRole === "organizer" && " As an organizer, you can view your team in the Teams page."}
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <RegistrationForm tournament={tournament} />
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
