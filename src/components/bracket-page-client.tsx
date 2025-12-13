"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { BracketDisplay } from "@/components/bracket-display";
import { BracketTeamCards } from "@/components/bracket-team-cards";
import type { BracketMatch, BracketTeam } from "@/lib/db/schema";

interface BracketPageClientProps {
  tournamentId: number;
  initialMatches: BracketMatch[];
  initialTeams: BracketTeam[];
  pods: Map<number, string>;
}

export function BracketPageClient({
  tournamentId,
  initialMatches,
  initialTeams,
  pods,
}: BracketPageClientProps) {
  const [matches, setMatches] = useState<BracketMatch[]>(initialMatches);
  const [teams, setTeams] = useState<BracketTeam[]>(initialTeams);

  // Fetch fresh data
  const fetchData = useCallback(async () => {
    try {
      const { data: matchesData, error: matchesError } = await supabase
        .from("bracket_matches")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("game_number", { ascending: true });

      if (matchesError) throw matchesError;

      if (matchesData) {
        setMatches(
          matchesData.map((match) => ({
            id: match.id,
            tournamentId: match.tournament_id,
            gameNumber: match.game_number,
            bracketType: match.bracket_type,
            teamAId: match.team_a_id,
            teamBId: match.team_b_id,
            teamAScore: match.team_a_score,
            teamBScore: match.team_b_score,
            status: match.status,
            createdAt: new Date(match.created_at),
            updatedAt: new Date(match.updated_at),
          }))
        );
      }

      const { data: teamsData, error: teamsError } = await supabase
        .from("bracket_teams")
        .select("*")
        .eq("tournament_id", tournamentId)
        .order("team_name", { ascending: true });

      if (teamsError) throw teamsError;

      if (teamsData) {
        setTeams(
          teamsData.map((team) => ({
            id: team.id,
            tournamentId: team.tournament_id,
            teamName: team.team_name,
            pod1Id: team.pod1_id,
            pod2Id: team.pod2_id,
            pod3Id: team.pod3_id,
            createdAt: new Date(team.created_at),
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching bracket data:", error);
    }
  }, [tournamentId]);

  // Subscribe to real-time updates
  useEffect(() => {
    // Add debounce to prevent excessive fetching
    let timeoutId: NodeJS.Timeout | null = null;

    const debouncedFetchData = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchData();
      }, 500);
    };

    const channel = supabase
      .channel(`bracket-${tournamentId}-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bracket_matches",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          debouncedFetchData();
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "bracket_teams",
          filter: `tournament_id=eq.${tournamentId}`,
        },
        () => {
          debouncedFetchData();
        }
      )
      .subscribe();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      supabase.removeChannel(channel);
    };
  }, [fetchData, tournamentId]);

  return (
    <div className="container mx-auto space-y-8 px-4 pb-16">
      {teams.length > 0 && (
        <BracketTeamCards teams={teams} pods={pods} />
      )}
      {matches.length > 0 ? (
        <BracketDisplay matches={matches} teams={teams} pods={pods} />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Bracket matches will appear here once pool play is complete.
          </p>
        </div>
      )}
    </div>
  );
}
