"use client";

import { useTournament } from "@/contexts/tournament-context";
import { TournamentSettingsForm } from "@/components/tournament-settings-form";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function SettingsPage() {
  const router = useRouter();
  const { tournament, isOrganizer, isLoading } = useTournament();

  useEffect(() => {
    // Redirect non-organizers
    if (!isLoading && !isOrganizer) {
      router.push(`/tournaments/${tournament.slug}`);
    }
  }, [isLoading, isOrganizer, tournament.slug, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!isOrganizer) {
    return null; // Will redirect via useEffect
  }

  return (
    <div className="max-w-3xl mx-auto">
      <TournamentSettingsForm tournament={tournament} />
    </div>
  );
}
