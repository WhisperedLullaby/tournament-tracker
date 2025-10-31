import { SchedulePageClient } from "@/components/schedule-page-client";
import {
  getCurrentMatches,
  getNextPendingGame,
  getAllPoolMatches,
} from "@/lib/db/queries";
import { db } from "@/lib/db";
import { pods } from "@/lib/db/schema";

export const dynamic = "force-dynamic";

export default async function SchedulePage() {
  // Fetch all data in parallel
  const [currentMatches, nextGame, allMatches, allPods] = await Promise.all([
    getCurrentMatches(),
    getNextPendingGame(),
    getAllPoolMatches(),
    db.select().from(pods),
  ]);

  // Get the current in-progress match (should only be one)
  const currentMatch = currentMatches[0] || null;

  return (
    <SchedulePageClient
      currentMatch={currentMatch}
      nextGame={nextGame}
      allMatches={allMatches}
      allPods={allPods}
    />
  );
}
