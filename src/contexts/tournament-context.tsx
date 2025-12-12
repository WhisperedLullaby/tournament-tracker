"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import type { Tournament } from "@/lib/db/schema";

/**
 * Tournament context type
 * Provides tournament data and user's role within the tournament
 */
interface TournamentContextType {
  tournament: Tournament;
  userRole: "organizer" | "participant" | null;
  isOrganizer: boolean;
  isParticipant: boolean;
  hasRegisteredTeam: boolean;
  isLoading: boolean;
}

const TournamentContext = createContext<TournamentContextType | undefined>(
  undefined
);

/**
 * Tournament Provider Component
 * Wraps tournament-specific pages to provide tournament context
 *
 * @param tournament - The tournament data (fetched server-side)
 * @param userId - The current user's ID (optional, from auth)
 * @param children - Child components
 */
export function TournamentProvider({
  tournament,
  userId,
  children,
}: {
  tournament: Tournament;
  userId?: string | null;
  children: React.ReactNode;
}) {
  const [userRole, setUserRole] = useState<
    "organizer" | "participant" | null
  >(null);
  const [hasRegisteredTeam, setHasRegisteredTeam] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUserRole() {
      if (!userId) {
        setUserRole(null);
        setHasRegisteredTeam(false);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/tournaments/${tournament.id}/role?userId=${userId}`
        );
        if (response.ok) {
          const data = await response.json();
          setUserRole(data.role || null);
          setHasRegisteredTeam(data.hasRegisteredTeam || false);
        } else {
          setUserRole(null);
          setHasRegisteredTeam(false);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setUserRole(null);
        setHasRegisteredTeam(false);
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserRole();
  }, [tournament.id, userId]);

  const contextValue: TournamentContextType = {
    tournament,
    userRole,
    isOrganizer: userRole === "organizer",
    isParticipant: userRole === "participant",
    hasRegisteredTeam,
    isLoading,
  };

  return (
    <TournamentContext.Provider value={contextValue}>
      {children}
    </TournamentContext.Provider>
  );
}

/**
 * Hook to access tournament context
 * Must be used within a TournamentProvider
 *
 * @throws Error if used outside TournamentProvider
 * @returns Tournament context
 */
export function useTournament() {
  const context = useContext(TournamentContext);
  if (context === undefined) {
    throw new Error("useTournament must be used within a TournamentProvider");
  }
  return context;
}
