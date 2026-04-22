import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAllTournaments, getPodCount } from "@/lib/db/queries";
import Link from "next/link";
import { createClient } from "@/lib/auth/server";
import { isWhitelistedOrganizer, isAdminUser } from "@/lib/db/queries";
import { TournamentGridSkeleton } from "@/components/skeletons";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { TournamentCardGrid } from "@/components/tournament-card-grid";
import { Trophy, Plus } from "lucide-react";

// Server component that fetches tournament data
async function TournamentGrid({
  statusFilter,
  isAdmin,
}: {
  statusFilter?: "upcoming" | "active" | "completed";
  isAdmin: boolean;
}) {
  // Fetch tournaments with filter
  const tournaments = await getAllTournaments({
    isPublic: true,
    includeTest: isAdmin,
    ...(statusFilter && { status: statusFilter }),
  });

  // Fetch pod counts for each tournament
  const tournamentData = await Promise.all(
    tournaments.map(async (tournament) => {
      const podCount = await getPodCount(tournament.id);
      return { tournament, podCount };
    })
  );

  if (tournamentData.length === 0) {
    return (
      <div className="py-12 text-center text-gray-500">
        <p className="text-lg">No tournaments found.</p>
        <p className="mt-2 text-sm">
          {statusFilter
            ? `No ${statusFilter} tournaments at this time.`
            : "Check back soon!"}
        </p>
      </div>
    );
  }

  return <TournamentCardGrid data={tournamentData} />;
}

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
  const [canCreateTournaments, isAdmin] = user
    ? await Promise.all([isWhitelistedOrganizer(user.id), isAdminUser(user.id)])
    : [false, false];

  // Smart default: redirect to the most relevant status tab
  if (!statusFilter) {
    const baseFilter = { isPublic: true, includeTest: isAdmin };
    const [upcoming, active] = await Promise.all([
      getAllTournaments({ ...baseFilter, status: "upcoming" }),
      getAllTournaments({ ...baseFilter, status: "active" }),
    ]);
    if (upcoming.length > 0) redirect("/tournaments?status=upcoming");
    else if (active.length > 0) redirect("/tournaments?status=active");
    else redirect("/tournaments?status=completed");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      {/* Page Header */}
      <div className="from-primary/10 via-background to-accent/10 border-b bg-gradient-to-br">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <Trophy className="text-primary h-8 w-8" />
                <h1 className="text-4xl font-bold md:text-5xl">Tournaments</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Hewwo Pwincess, these are all the past, present and future
                tournaments
              </p>
            </div>
            {canCreateTournaments && (
              <Button asChild size="lg">
                <Link href="/tournaments/create">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Tournament
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="mb-8 flex gap-2 border-b">
          <Link
            href="/tournaments"
            className={`border-b-2 px-4 py-2 font-medium transition-colors ${
              !statusFilter
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            All
          </Link>
          <Link
            href="/tournaments?status=upcoming"
            className={`border-b-2 px-4 py-2 font-medium transition-colors ${
              statusFilter === "upcoming"
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            Upcoming
          </Link>
          <Link
            href="/tournaments?status=active"
            className={`border-b-2 px-4 py-2 font-medium transition-colors ${
              statusFilter === "active"
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            Active
          </Link>
          <Link
            href="/tournaments?status=completed"
            className={`border-b-2 px-4 py-2 font-medium transition-colors ${
              statusFilter === "completed"
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            Completed
          </Link>
        </div>

        {/* Tournament Grid with Suspense */}
        <Suspense fallback={<TournamentGridSkeleton count={6} />}>
          <TournamentGrid statusFilter={statusFilter} isAdmin={isAdmin} />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}
