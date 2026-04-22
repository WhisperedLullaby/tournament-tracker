"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";

interface QuickActionsSubFooterProps {
  tournamentSlug: string;
  tournamentStatus: "upcoming" | "active" | "completed";
  userRole?: "organizer" | "participant" | null;
}

export function QuickActionsSubFooter({
  tournamentSlug,
  tournamentStatus,
  userRole,
}: QuickActionsSubFooterProps) {
  const { signIn, signOut } = useAuth();

  const handleSignIn = () => {
    signIn(window.location.pathname);
  };

  const handleSignOut = () => {
    signOut();
  };

  const cardClass =
    "p-6 bg-card text-card-foreground border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow text-center";
  const descClass = "text-sm text-muted-foreground mt-1";

  return (
    <section className="bg-muted/20 py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-2xl font-bold">Quick Links</h2>
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href={`/tournaments/${tournamentSlug}/standings`}
            className={cardClass}
          >
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="font-semibold">Standings</h3>
            <p className={descClass}>View current rankings</p>
          </Link>

          <Link
            href={`/tournaments/${tournamentSlug}/schedule`}
            className={cardClass}
          >
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-semibold">Schedule</h3>
            <p className={descClass}>View match schedule</p>
          </Link>

          {tournamentStatus !== "upcoming" && (
            <Link
              href={`/tournaments/${tournamentSlug}/scoreboard`}
              className={cardClass}
            >
              <div className="text-3xl mb-2">🏐</div>
              <h3 className="font-semibold">Scoreboard</h3>
              <p className={descClass}>Live scores</p>
            </Link>
          )}

          {tournamentStatus !== "upcoming" && (
            <Link
              href={`/tournaments/${tournamentSlug}/bracket`}
              className={cardClass}
            >
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold">Bracket</h3>
              <p className={descClass}>View elimination bracket</p>
            </Link>
          )}

          {tournamentStatus === "upcoming" && !userRole && (
            <Link
              href={`/tournaments/${tournamentSlug}/register`}
              className={cardClass}
            >
              <div className="text-3xl mb-2">✍️</div>
              <h3 className="font-semibold">Register</h3>
              <p className={descClass}>Sign up your team</p>
            </Link>
          )}

          <Link
            href={`/tournaments/${tournamentSlug}/scorekeeper`}
            className={cardClass}
          >
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold">Scorekeeper</h3>
            <p className={descClass}>Manage scores</p>
          </Link>

          {userRole === "organizer" && (
            <Link
              href={`/tournaments/${tournamentSlug}/settings`}
              className={cardClass}
            >
              <div className="text-3xl mb-2">⚙️</div>
              <h3 className="font-semibold">Settings</h3>
              <p className={descClass}>Manage tournament</p>
            </Link>
          )}

          {!userRole && (
            <button onClick={handleSignIn} className={cardClass}>
              <div className="text-3xl mb-2">🔑</div>
              <h3 className="font-semibold">Sign In</h3>
              <p className={descClass}>Sign in with Google</p>
            </button>
          )}

          {userRole && (
            <button onClick={handleSignOut} className={cardClass}>
              <div className="text-3xl mb-2">🚪</div>
              <h3 className="font-semibold">Sign Out</h3>
              <p className={descClass}>Log out of account</p>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
