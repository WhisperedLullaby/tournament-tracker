"use client";

import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useState } from "react";

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
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(window.location.pathname)}`,
        },
      });
      if (error) {
        console.error("Sign in error:", error);
        alert("Failed to sign in. Please try again.");
        setSigningIn(false);
      }
    } catch (error) {
      console.error("Sign in error:", error);
      alert("Failed to sign in. Please try again.");
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      window.location.reload();
    } catch (error) {
      console.error("Sign out error:", error);
      alert("Failed to sign out. Please try again.");
    }
  };
  return (
    <section className="bg-muted/20 py-12 md:py-16">
      <div className="container mx-auto px-4">
        <h2 className="mb-8 text-center text-2xl font-bold">Quick Links</h2>
        <div className="mx-auto grid max-w-5xl gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Link
            href={`/tournaments/${tournamentSlug}/standings`}
            className="p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <div className="text-3xl mb-2">🏆</div>
            <h3 className="font-semibold">Standings</h3>
            <p className="text-sm text-gray-600 mt-1">View current rankings</p>
          </Link>

          <Link
            href={`/tournaments/${tournamentSlug}/schedule`}
            className="p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <div className="text-3xl mb-2">📅</div>
            <h3 className="font-semibold">Schedule</h3>
            <p className="text-sm text-gray-600 mt-1">View match schedule</p>
          </Link>

          {tournamentStatus !== "upcoming" && (
            <Link
              href={`/tournaments/${tournamentSlug}/bracket`}
              className="p-6 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className="text-3xl mb-2">🎯</div>
              <h3 className="font-semibold">Bracket</h3>
              <p className="text-sm text-gray-600 mt-1">
                View elimination bracket
              </p>
            </Link>
          )}

          {tournamentStatus === "upcoming" && !userRole && (
            <Link
              href={`/tournaments/${tournamentSlug}/register`}
              className="p-6 bg-blue-50 border-2 border-blue-500 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className="text-3xl mb-2">✍️</div>
              <h3 className="font-semibold text-blue-900">Register</h3>
              <p className="text-sm text-blue-700 mt-1">Sign up your team</p>
            </Link>
          )}

          <Link
            href={`/tournaments/${tournamentSlug}/scorekeeper`}
            className="p-6 bg-purple-50 border-2 border-purple-500 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
          >
            <div className="text-3xl mb-2">📊</div>
            <h3 className="font-semibold text-purple-900">Scorekeeper</h3>
            <p className="text-sm text-purple-700 mt-1">Manage scores</p>
          </Link>

          {userRole === "organizer" && (
            <Link
              href={`/tournaments/${tournamentSlug}/settings`}
              className="p-6 bg-green-50 border-2 border-green-500 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className="text-3xl mb-2">⚙️</div>
              <h3 className="font-semibold text-green-900">Settings</h3>
              <p className="text-sm text-green-700 mt-1">Manage tournament</p>
            </Link>
          )}

          {!userRole && (
            <button
              onClick={handleSignIn}
              disabled={signingIn}
              className="p-6 bg-yellow-50 border-2 border-yellow-500 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-3xl mb-2">🔑</div>
              <h3 className="font-semibold text-yellow-900">
                {signingIn ? "Signing In..." : "Sign In"}
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Sign in with Google
              </p>
            </button>
          )}

          {userRole && (
            <button
              onClick={handleSignOut}
              className="p-6 bg-red-50 border-2 border-red-500 rounded-lg shadow-sm hover:shadow-md transition-shadow text-center"
            >
              <div className="text-3xl mb-2">🚪</div>
              <h3 className="font-semibold text-red-900">Sign Out</h3>
              <p className="text-sm text-red-700 mt-1">
                Log out of account
              </p>
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
