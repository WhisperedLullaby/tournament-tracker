import { notFound } from "next/navigation";
import { getTournamentBySlug } from "@/lib/db/queries";
import { TournamentProvider } from "@/contexts/tournament-context";
import { TournamentNav } from "@/components/tournament-nav";
import { createClient } from "@/lib/auth/server";

export default async function TournamentLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await getTournamentBySlug(slug);

  if (!tournament) {
    notFound();
  }

  // Get current user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <TournamentProvider tournament={tournament} userId={user?.id}>
      <div className="min-h-screen bg-gray-50">
        {/* Tournament Header */}
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-6">
            <h1 className="text-3xl font-bold mb-2">{tournament.name}</h1>
            <div className="flex gap-4 text-sm text-gray-600">
              <span>
                📅{" "}
                {new Date(tournament.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              {tournament.location && <span>📍 {tournament.location}</span>}
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium ${
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
          </div>

          {/* Tournament Navigation */}
          <TournamentNav />
        </div>

        {/* Page Content */}
        <div className="container mx-auto px-4 py-8">{children}</div>
      </div>
    </TournamentProvider>
  );
}
