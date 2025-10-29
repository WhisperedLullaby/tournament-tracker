import { StandingsPageClient } from "@/components/standings-page-client";
import { getPoolStandings, getPoolMatchesLog } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const [standings, matchLog] = await Promise.all([
    getPoolStandings(),
    getPoolMatchesLog(),
  ]);

  return <StandingsPageClient standings={standings} matchLog={matchLog} />;
}
