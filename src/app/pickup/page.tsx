import { Suspense } from "react";
import Link from "next/link";
import { createClient } from "@/lib/auth/server";
import { isWhitelistedOrganizer } from "@/lib/db/queries";
import { getAllPickupSessions, getPickupRegistrations } from "@/lib/db/pickup-queries";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import { PickupCard } from "@/components/pickup/pickup-card";
import { Volleyball, Plus } from "lucide-react";

async function PickupGrid({
  statusFilter,
}: {
  statusFilter?: "upcoming" | "attendance" | "active" | "completed";
}) {
  const sessions = await getAllPickupSessions(
    statusFilter ? { status: statusFilter } : undefined
  );

  const sessionData = await Promise.all(
    sessions.map(async (session) => {
      const regs = await getPickupRegistrations(session.id);
      const registeredCount = regs.filter((r) => r.status === "registered" || r.status === "attended").length;
      return { session, registeredCount };
    })
  );

  if (sessionData.length === 0) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        <p className="text-lg">No pickup sessions found.</p>
        <p className="mt-2 text-sm">
          {statusFilter ? `No ${statusFilter} sessions at this time.` : "Check back soon!"}
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {sessionData.map(({ session, registeredCount }) => (
        <PickupCard key={session.id} session={session} registeredCount={registeredCount} />
      ))}
    </div>
  );
}

const STATUS_TABS = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Active", value: "active" },
  { label: "Completed", value: "completed" },
] as const;

export default async function PickupPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const statusFilter = params.status as
    | "upcoming"
    | "attendance"
    | "active"
    | "completed"
    | undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const canCreate = user ? await isWhitelistedOrganizer(user.id) : false;

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      <div className="from-primary/10 via-background to-accent/10 border-b bg-gradient-to-br">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-3">
                <Volleyball className="text-primary h-8 w-8" />
                <h1 className="text-4xl font-bold md:text-5xl">Pickup Games</h1>
              </div>
              <p className="text-muted-foreground text-lg">
                Sign up by position, get your lineups auto-generated, and play.
              </p>
            </div>
            {canCreate && (
              <Button asChild size="lg">
                <Link href="/pickup/create">
                  <Plus className="mr-2 h-5 w-5" />
                  Create Session
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 flex gap-2 border-b">
          <Link
            href="/pickup"
            className={`border-b-2 px-4 py-2 font-medium transition-colors ${
              !statusFilter
                ? "border-primary text-primary"
                : "text-muted-foreground hover:text-foreground border-transparent"
            }`}
          >
            All
          </Link>
          {STATUS_TABS.map((tab) => (
            <Link
              key={tab.value}
              href={`/pickup?status=${tab.value}`}
              className={`border-b-2 px-4 py-2 font-medium transition-colors ${
                statusFilter === tab.value
                  ? "border-primary text-primary"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        <Suspense
          fallback={
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-48 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          }
        >
          <PickupGrid statusFilter={statusFilter} />
        </Suspense>
      </div>

      <Footer />
    </div>
  );
}
