"use client";

import { useTournament } from "@/contexts/tournament-context";
import { redirect } from "next/navigation";

export default function SettingsPage() {
  const { tournament, isOrganizer, isLoading } = useTournament();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isOrganizer) {
    // Only organizers can access settings
    redirect(`/tournaments/${tournament.slug}`);
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Tournament Settings</h1>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <p className="text-gray-600 mb-4">
          Settings page will be implemented in Phase 5.
        </p>

        {/* TODO: Add tournament management features
          - Edit tournament details
          - Update status (upcoming → active → completed)
          - Manage participants
          - Delete tournament (with confirmation)
        */}
      </div>
    </div>
  );
}
