import Link from "next/link";

interface QuickActionsSubFooterProps {
  tournamentSlug: string;
  tournamentStatus: "upcoming" | "active" | "completed";
  userRole?: "organizer" | "participant" | null;
}

export function QuickActionsSubFooter({
  tournamentSlug,
  tournamentStatus,
  userRole,
}: QuickActionsSubFooterProps) {
  return (
    <section className="bg-muted/20 py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-2xl font-bold">Quick Links</h2>
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href={`/tournaments/${tournamentSlug}/standings`}
            className="p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="font-semibold">Standings</h3>
            <p className="text-sm text-gray-600 mt-1">View current rankings</p>
          </Link>

          <Link
            href={`/tournaments/${tournamentSlug}/schedule`}
            className="p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-semibold">Schedule</h3>
            <p className="text-sm text-gray-600 mt-1">View match schedule</p>
          </Link>

          {tournamentStatus !== "upcoming" && (
            <Link
              href={`/tournaments/${tournamentSlug}/bracket`}
              className="p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold">Bracket</h3>
              <p className="text-sm text-gray-600 mt-1">
                View elimination bracket
              </p>
            </Link>
          )}

          {tournamentStatus === "upcoming" && !userRole && (
            <Link
              href={`/tournaments/${tournamentSlug}/register`}
              className="p-6 bg-blue-50 border-2 border-blue-500 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className="text-3xl mb-2">✍️</div>
              <h3 className="font-semibold text-blue-900">Register</h3>
              <p className="text-sm text-blue-700 mt-1">Sign up your team</p>
            </Link>
          )}

          {userRole === "organizer" && (
            <>
              <Link
                href={`/tournaments/${tournamentSlug}/scorekeeper`}
                className="p-6 bg-purple-50 border-2 border-purple-500 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <div className="text-3xl mb-2">📊</div>
                <h3 className="font-semibold text-purple-900">Scorekeeper</h3>
                <p className="text-sm text-purple-700 mt-1">Manage scores</p>
              </Link>

              <Link
                href={`/tournaments/${tournamentSlug}/settings`}
                className="p-6 bg-green-50 border-2 border-green-500 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
              >
                <div className="text-3xl mb-2">⚙️</div>
                <h3 className="font-semibold text-green-900">Settings</h3>
                <p className="text-sm text-green-700 mt-1">Manage tournament</p>
              </Link>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
