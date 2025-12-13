import { notFound } from "next/navigation";
import { getTournamentBySlug } from "@/lib/db/queries";
import { TournamentProvider } from "@/contexts/tournament-context";
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
      {children}
    </TournamentProvider>
  );
}
