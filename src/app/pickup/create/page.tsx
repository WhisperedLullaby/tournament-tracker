import { createClient } from "@/lib/auth/server";
import { isWhitelistedOrganizer, isAdminUser } from "@/lib/db/queries";
import { redirect } from "next/navigation";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { PickupCreationForm } from "@/components/pickup/pickup-creation-form";

export default async function CreatePickupPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/pickup?error=auth_required");
  }

  const [isOrganizer, isAdmin] = await Promise.all([
    isWhitelistedOrganizer(user.id),
    isAdminUser(user.id),
  ]);
  if (!isOrganizer) {
    redirect("/pickup?error=not_authorized");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />
      <div className="container mx-auto px-4 py-10">
        <h1 className="mb-2 text-4xl font-bold text-center">
          Create Pickup Session
        </h1>
        <p className="mb-10 text-center text-muted-foreground">
          Set up a pickup game — players sign up by position, lineups are
          auto-generated before each series.
        </p>
        <PickupCreationForm isAdmin={isAdmin} />
      </div>
      <Footer />
    </div>
  );
}
