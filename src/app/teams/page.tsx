import { TeamsPageClient } from "@/components/teams-page-client";
import { getAllPods } from "@/lib/db/queries";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const podData = await getAllPods();

  return <TeamsPageClient podData={podData} />;
}
