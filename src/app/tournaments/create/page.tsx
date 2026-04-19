import { TournamentCreationForm } from "@/components/tournament-creation-form";
import { createClient } from "@/lib/auth/server";
import { isWhitelistedOrganizer, isAdminUser } from "@/lib/db/queries";
import { redirect } from "next/navigation";

export default async function CreateTournamentPage() {
  // Check authentication and authorization
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/tournaments?error=auth_required");
  }

  const [isOrganizer, isAdmin] = await Promise.all([
    isWhitelistedOrganizer(user.id),
    isAdminUser(user.id),
  ]);

  if (!isOrganizer) {
    redirect("/tournaments?error=not_authorized");
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center">
        Create Tournament
      </h1>

      <TournamentCreationForm isAdmin={isAdmin} />
    </div>
  );
}
