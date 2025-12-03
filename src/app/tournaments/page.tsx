import { getAllTournaments, getPodCount } from "@/lib/db/queries";
import Link from "next/link";
import { createClient } from "@/lib/auth/server";
import { isWhitelistedOrganizer } from "@/lib/db/queries";

export default async function TournamentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status as
    | "upcoming"
    | "active"
    | "completed"
    | undefined;

  // Get current user to check if they can create tournaments
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const canCreateTournaments = user
    ? await isWhitelistedOrganizer(user.id)
    : false;

  // Fetch tournaments with filter
  const tournaments = await getAllTournaments({
    isPublic: true,
    ...(statusFilter && { status: statusFilter }),
  });

  // Fetch pod counts for each tournament
  const tournamentData = await Promise.all(
    tournaments.map(async (tournament) => {
      const podCount = await getPodCount(tournament.id);
      return { tournament, podCount };
    })
  );

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold">Tournaments</h1>
        {canCreateTournaments && (
          <Link
            href="/tournaments/create"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create Tournament
          </Link>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <Link
          href="/tournaments"
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            !statusFilter
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          All
        </Link>
        <Link
          href="/tournaments?status=upcoming"
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            statusFilter === "upcoming"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Upcoming
        </Link>
        <Link
          href="/tournaments?status=active"
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            statusFilter === "active"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Active
        </Link>
        <Link
          href="/tournaments?status=completed"
          className={`px-4 py-2 font-medium border-b-2 transition-colors ${
            statusFilter === "completed"
              ? "border-blue-600 text-blue-600"
              : "border-transparent text-gray-600 hover:text-gray-900"
          }`}
        >
          Completed
        </Link>
      </div>

      {/* Tournament Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {tournamentData.map(({ tournament, podCount }) => (
          <Link
            key={tournament.id}
            href={`/tournaments/${tournament.slug}`}
            className="block p-6 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold">{tournament.name}</h2>
              <span
                className={`px-2 py-1 text-xs rounded font-medium ${
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

            <p className="text-sm text-gray-600 mb-2">
              {new Date(tournament.date).toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>

            {tournament.location && (
              <p className="text-sm text-gray-500 mb-3">
                📍 {tournament.location}
              </p>
            )}

            {tournament.description && (
              <p className="text-sm text-gray-700 line-clamp-2 mb-3">
                {tournament.description}
              </p>
            )}

            {/* Registration Status */}
            <div className="pt-3 border-t mt-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Teams Registered:</span>
                <span
                  className={`font-semibold ${
                    podCount >= tournament.maxPods
                      ? "text-red-600"
                      : "text-blue-600"
                  }`}
                >
                  {podCount}/{tournament.maxPods}
                </span>
              </div>
              {podCount >= tournament.maxPods && (
                <p className="text-xs text-red-600 mt-1">Full</p>
              )}
              {podCount < tournament.maxPods &&
                tournament.status === "upcoming" && (
                  <p className="text-xs text-green-600 mt-1">
                    Registration Open
                  </p>
                )}
            </div>
          </Link>
        ))}
      </div>

      {tournamentData.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg">No tournaments found.</p>
          <p className="text-sm mt-2">
            {statusFilter
              ? `No ${statusFilter} tournaments at this time.`
              : "Check back soon!"}
          </p>
        </div>
      )}
    </div>
  );
}
