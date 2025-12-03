import { TeamsPageClient } from "@/components/teams-page-client";
import { getAllPods } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  // TODO: This page will be migrated in Phase 4 to use tournament context
  // Temporarily using tournament ID 1
  const TEMP_TOURNAMENT_ID = 1;

  const podData = await getAllPods(TEMP_TOURNAMENT_ID);

  return <TeamsPageClient podData={podData} />;
}
