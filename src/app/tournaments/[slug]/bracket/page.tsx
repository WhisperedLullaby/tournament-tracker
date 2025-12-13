import { BracketPageClient } from "@/components/bracket-page-client";
import {
  getAllPods,
  getTournamentBySlug,
  getBracketMatches,
  getBracketTeams,
} from "@/lib/db/queries";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TournamentBracketPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await getTournamentBySlug(slug);

  if (!tournament) {
    notFound();
  }

  if (tournament.status === "upcoming") {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-2">Bracket Not Available</h2>
          <p className="text-gray-700">
            The elimination bracket will be available once pool play is
            complete.
          </p>
        </div>
      </div>
    );
  }

  const podData = await getAllPods(tournament.id);
  const pods = new Map(
    podData.map((pod) => [
      pod.podId,
      pod.teamName || pod.playerNames,
    ])
  );

  const matches = await getBracketMatches(tournament.id);
  const teams = await getBracketTeams(tournament.id);

  return (
    <BracketPageClient
      tournamentId={tournament.id}
      initialMatches={matches}
      initialTeams={teams}
      pods={pods}
    />
  );
}
