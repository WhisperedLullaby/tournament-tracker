import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/auth/server";
import { getUserTournamentStats } from "@/lib/db/queries";
import type { TournamentHistoryEntry } from "@/lib/db/queries";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { Badge } from "@/components/ui/badge";
import { TournamentStatusBadge } from "@/components/status-badges";
import { User, Trophy, Calendar, MapPin, Users } from "lucide-react";

export const dynamic = "force-dynamic";

// ─── Bracket Finish Badge ─────────────────────────────────────────────────────

function BracketFinishBadge({ finish }: { finish: string }) {
  const config: Record<string, { label: string; className: string }> = {
    Champions: { label: "Champions", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
    "Runner-up": { label: "Runner-up", className: "bg-gray-200 text-gray-700 hover:bg-gray-200" },
    "3rd Place": { label: "3rd Place", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
    "Lost in Bracket": { label: "Lost in Bracket", className: "bg-gray-100 text-gray-500 hover:bg-gray-100" },
  };
  const cfg = config[finish] ?? config["Lost in Bracket"];
  return (
    <Badge variant="secondary" className={cfg.className}>
      {finish === "Champions" && <span className="mr-1">🏆</span>}
      {finish === "Runner-up" && <span className="mr-1">🥈</span>}
      {finish === "3rd Place" && <span className="mr-1">🥉</span>}
      {cfg.label}
    </Badge>
  );
}

// ─── Level Badge ──────────────────────────────────────────────────────────────

function LevelBadge({ level }: { level: string }) {
  const labels: Record<string, string> = { c: "C", b: "B", a: "A", open: "Open" };
  return (
    <Badge variant="outline" className="text-xs font-mono uppercase">
      {labels[level] ?? level}
    </Badge>
  );
}

// ─── Tournament Card ──────────────────────────────────────────────────────────

function TournamentCard({ entry }: { entry: TournamentHistoryEntry }) {
  const { tournament, role, pod, poolRecord, bracketFinish } = entry;
  const isOrganizerOnly = role === "organizer" && !pod;

  const teamDisplay = pod
    ? pod.teamName
      ? pod.teamName
      : [pod.player1, pod.player2, pod.player3].filter(Boolean).join(" & ")
    : null;

  return (
    <div className="rounded-lg border bg-card p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3 mb-3">
        <Link
          href={`/tournaments/${tournament.slug}`}
          className="text-base font-semibold hover:text-primary transition-colors leading-tight"
        >
          {tournament.name}
        </Link>
        <div className="flex items-center gap-1.5 shrink-0">
          {tournament.level && <LevelBadge level={tournament.level} />}
          <TournamentStatusBadge
            status={tournament.status as "upcoming" | "active" | "completed"}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(tournament.date).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: "UTC",
          })}
        </div>
        {tournament.location && (
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {tournament.location}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {isOrganizerOnly ? (
          <Badge variant="secondary" className="bg-indigo-100 text-indigo-800 hover:bg-indigo-100">
            Organized
          </Badge>
        ) : (
          <>
            {teamDisplay && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{teamDisplay}</span>
              </div>
            )}
            {poolRecord ? (
              <Badge variant="secondary" className="font-mono">
                {poolRecord.wins}W – {poolRecord.losses}L
              </Badge>
            ) : (
              tournament.status !== "upcoming" && (
                <Badge variant="outline" className="text-muted-foreground">
                  No games yet
                </Badge>
              )
            )}
            {bracketFinish && <BracketFinishBadge finish={bracketFinish} />}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Stats Banner ─────────────────────────────────────────────────────────────

function StatsBanner({
  aggregates,
}: {
  aggregates: {
    tournamentsPlayed: number;
    totalWins: number;
    totalLosses: number;
    winPercentage: number;
  };
}) {
  const { tournamentsPlayed, totalWins, totalLosses, winPercentage } = aggregates;
  const hasGames = totalWins + totalLosses > 0;

  const tiles = [
    { label: "Tournaments Played", value: tournamentsPlayed },
    { label: "Pool Wins", value: hasGames ? totalWins : "—" },
    { label: "Pool Losses", value: hasGames ? totalLosses : "—" },
    { label: "Win %", value: hasGames ? `${winPercentage}%` : "—" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
      {tiles.map((tile) => (
        <div
          key={tile.label}
          className="rounded-lg border bg-card p-4 text-center shadow-sm"
        >
          <div className="text-2xl font-bold text-primary">{tile.value}</div>
          <div className="text-xs text-muted-foreground mt-1">{tile.label}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/signin");
  }

  const stats = await getUserTournamentStats(user.id);

  const displayName =
    (user.user_metadata?.name as string | undefined) ?? user.email ?? "Player";
  const avatarUrl = (user.user_metadata?.avatar_url as string | undefined) ?? null;
  const memberSince = new Date(user.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const upcoming = stats.history.filter(
    (e) => e.tournament.status === "upcoming" || e.tournament.status === "active"
  );
  const past = stats.history.filter((e) => e.tournament.status === "completed");

  return (
    <div className="flex min-h-screen flex-col">
      <Navigation />

      {/* Profile Header */}
      <div className="border-b bg-gradient-to-br from-primary/10 via-background to-accent/10">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="flex items-center gap-5">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-20 w-20 rounded-full border-2 border-primary/30 shadow"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 border-2 border-primary/30">
                <User className="h-10 w-10 text-primary" />
              </div>
            )}
            <div>
              <h1 className="text-3xl font-bold md:text-4xl">{displayName}</h1>
              <p className="text-muted-foreground text-sm mt-1">{user.email}</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                Member since {memberSince}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 flex-1">
        <StatsBanner aggregates={stats.aggregates} />

        {/* Upcoming / Active */}
        {upcoming.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Upcoming Tournaments
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {upcoming.map((entry) => (
                <TournamentCard key={entry.tournament.id} entry={entry} />
              ))}
            </div>
          </section>
        )}

        {/* Past */}
        {past.length > 0 ? (
          <section>
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Tournament History
            </h2>
            <div className="grid gap-4 md:grid-cols-2">
              {past.map((entry) => (
                <TournamentCard key={entry.tournament.id} entry={entry} />
              ))}
            </div>
          </section>
        ) : (
          upcoming.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p className="text-lg font-medium">No tournaments yet</p>
              <p className="text-sm mt-1">
                <Link href="/tournaments" className="text-primary hover:underline">
                  Browse tournaments
                </Link>{" "}
                to get started.
              </p>
            </div>
          )
        )}
      </main>

      <Footer />
    </div>
  );
}
