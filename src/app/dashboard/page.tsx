import { createClient } from "@/lib/auth/server";
import { getOrganizerTournaments, getPodCount } from "@/lib/db/queries";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Settings, Users, Calendar, MapPin } from "lucide-react";

export default async function DashboardPage() {
  // Check authentication
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/tournaments?error=auth_required");
  }

  // Get tournaments where user is organizer
  const tournaments = await getOrganizerTournaments(user.id);

  // Get pod counts for each tournament
  const tournamentsWithCounts = await Promise.all(
    tournaments.map(async (tournament) => {
      const podCount = await getPodCount(tournament.id);
      return { ...tournament, podCount };
    })
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold">Organizer Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Manage your tournaments and participants
          </p>
        </div>
        <Link
          href="/tournaments/create"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Create Tournament
        </Link>
      </div>

      {tournamentsWithCounts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm">
          <h2 className="text-2xl font-semibold mb-4">No tournaments yet</h2>
          <p className="text-gray-600 mb-6">
            Create your first tournament to get started
          </p>
          <Link
            href="/tournaments/create"
            className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Create Tournament
          </Link>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournamentsWithCounts.map((tournament) => (
            <div
              key={tournament.id}
              className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
            >
              {/* Header with status */}
              <div className="p-6 pb-4">
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-semibold flex-1 mr-2">
                    {tournament.name}
                  </h2>
                  <span
                    className={`px-2 py-1 text-xs rounded font-medium whitespace-nowrap ${
                      tournament.status === "upcoming"
                        ? "bg-blue-100 text-blue-800"
                        : tournament.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {tournament.status}
                  </span>
                </div>

                {/* Tournament info */}
                <div className="space-y-2 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {new Date(tournament.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                  {tournament.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {tournament.location}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    <span
                      className={
                        tournament.podCount >= tournament.maxPods
                          ? "text-red-600 font-semibold"
                          : "text-gray-600"
                      }
                    >
                      {tournament.podCount}/{tournament.maxPods} teams
                      registered
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 py-3 bg-gray-50 border-t flex gap-2">
                <Link
                  href={`/tournaments/${tournament.slug}`}
                  className="flex-1 text-center px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  View
                </Link>
                <Link
                  href={`/tournaments/${tournament.slug}/settings`}
                  className="flex items-center gap-1 px-3 py-2 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors text-sm font-medium"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
