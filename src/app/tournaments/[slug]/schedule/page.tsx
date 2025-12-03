import { SchedulePageClient } from "@/components/schedule-page-client";
import {
  getCurrentMatches,
  getNextPendingGame,
  getAllPoolMatches,
  isPoolPlayComplete,
  getBracketMatches,
  getBracketTeams,
  getTournamentBySlug,
} from "@/lib/db/queries";
import { db } from "@/lib/db";
import { pods, type BracketMatch, type BracketTeam } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TournamentSchedulePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tournament = await getTournamentBySlug(slug);

  if (!tournament) {
    notFound();
  }

  // Fetch all data in parallel
  const [currentMatches, nextGame, allMatches, allPods, poolComplete] =
    await Promise.all([
      getCurrentMatches(tournament.id),
      getNextPendingGame(tournament.id),
      getAllPoolMatches(tournament.id),
      db.select().from(pods).where(eq(pods.tournamentId, tournament.id)),
      isPoolPlayComplete(tournament.id),
    ]);

  // Get the current in-progress match (should only be one)
  const currentMatch = currentMatches[0] || null;

  // Fetch bracket data if pool play is complete
  let bracketMatches: BracketMatch[] = [];
  let bracketTeams: BracketTeam[] = [];

  if (poolComplete) {
    [bracketMatches, bracketTeams] = await Promise.all([
      getBracketMatches(tournament.id),
      getBracketTeams(tournament.id),
    ]);
  }

  return (
    <SchedulePageClient
      currentMatch={currentMatch}
      nextGame={nextGame}
      allMatches={allMatches}
      allPods={allPods}
      isPoolPlayComplete={poolComplete}
      bracketMatches={bracketMatches}
      bracketTeams={bracketTeams}
    />
  );
}
