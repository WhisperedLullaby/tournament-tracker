"use client";

import { useTournament } from "@/contexts/tournament-context";
import { RegistrationForm } from "@/components/registration-form";

export default function RegisterPage() {
  const { tournament, userRole, isLoading } = useTournament();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (userRole) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Already Registered</h2>
          <p className="text-gray-700">
            You are already registered for this tournament as a{" "}
            {userRole === "organizer" ? "tournament organizer" : "participant"}.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[calc(100vh-200px)] py-8">
      <RegistrationForm tournament={tournament} />
    </div>
  );
}
