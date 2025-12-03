"use client";

import { useTournament } from "@/contexts/tournament-context";
import Link from "next/link";

export default function TournamentPage() {
  const { tournament, userRole, isLoading } = useTournament();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Tournament Description */}
      {tournament.description && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold mb-3">About This Tournament</h2>
          <p className="text-gray-700">{tournament.description}</p>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-6">
        <Link
          href={`/tournaments/${tournament.slug}/standings`}
          className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <div className="text-3xl mb-2">🏆</div>
          <h3 className="font-semibold">Standings</h3>
          <p className="text-sm text-gray-600 mt-1">View current rankings</p>
        </Link>

        <Link
          href={`/tournaments/${tournament.slug}/schedule`}
          className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
        >
          <div className="text-3xl mb-2">📅</div>
          <h3 className="font-semibold">Schedule</h3>
          <p className="text-sm text-gray-600 mt-1">View match schedule</p>
        </Link>

        {tournament.status !== "upcoming" && (
          <Link
            href={`/tournaments/${tournament.slug}/bracket`}
            className="p-6 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <div className="text-3xl mb-2">🎯</div>
            <h3 className="font-semibold">Bracket</h3>
            <p className="text-sm text-gray-600 mt-1">
              View elimination bracket
            </p>
          </Link>
        )}

        {tournament.status === "upcoming" && !userRole && (
          <Link
            href={`/tournaments/${tournament.slug}/register`}
            className="p-6 bg-blue-50 border-2 border-blue-500 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <div className="text-3xl mb-2">✍️</div>
            <h3 className="font-semibold text-blue-900">Register</h3>
            <p className="text-sm text-blue-700 mt-1">Sign up your team</p>
          </Link>
        )}

        {userRole === "organizer" && (
          <Link
            href={`/tournaments/${tournament.slug}/scorekeeper`}
            className="p-6 bg-purple-50 border-2 border-purple-500 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-purple-900">Scorekeeper</h3>
            <p className="text-sm text-purple-700 mt-1">Manage scores</p>
          </Link>
        )}
      </div>

      {/* User Status */}
      {userRole && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-blue-900">
            <strong>Your Role:</strong>{" "}
            {userRole === "organizer" ? "Tournament Organizer" : "Participant"}
          </p>
        </div>
      )}

      {/* Registration Info */}
      {tournament.status === "upcoming" && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-3">Registration</h2>
          {tournament.registrationOpenDate && (
            <p className="text-gray-700 mb-2">
              <strong>Opens:</strong>{" "}
              {new Date(tournament.registrationOpenDate).toLocaleDateString()}
            </p>
          )}
          {tournament.registrationDeadline && (
            <p className="text-gray-700 mb-2">
              <strong>Deadline:</strong>{" "}
              {new Date(tournament.registrationDeadline).toLocaleDateString()}
            </p>
          )}
          <p className="text-gray-600 mt-4">
            Maximum {tournament.maxPods} teams can register for this tournament.
          </p>
        </div>
      )}
    </div>
  );
}
