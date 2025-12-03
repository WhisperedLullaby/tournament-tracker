"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, CheckCircle, Trophy } from "lucide-react";
import { ScoreDisplay } from "@/components/score-display";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { adaptCombinedNamesToFirstNames } from "@/lib/utils/name-adapter";
import type { PoolMatch, BracketMatch } from "@/lib/db/schema";
import { useTournament } from "@/contexts/tournament-context";

type GameMatch = PoolMatch | (BracketMatch & { isBracket: true });

export default function TournamentScorekeeperPage() {
  const router = useRouter();
  const { tournament, isLoading: tournamentLoading } = useTournament();
  const [currentGame, setCurrentGame] = useState<GameMatch | null>(null);
  const [nextGame, setNextGame] = useState<GameMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [pods, setPods] = useState<Map<number, string>>(new Map());
  const [bracketTeams, setBracketTeams] = useState<Map<number, string>>(
    new Map()
  );
  const [isBracketPlay, setIsBracketPlay] = useState(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    if (!tournament) return;

    try {
      // Check if pool play is complete
      const { data: poolMatches, error: poolCountError } = await supabase
        .from("pool_matches")
        .select("*", { count: "exact" })
        .eq("tournament_id", tournament.id)
        .eq("status", "completed");

      if (poolCountError) throw poolCountError;

      const isPoolComplete = (poolMatches?.length || 0) >= 6;
      setIsBracketPlay(isPoolComplete);

      // Fetch all pods for team names
      const { data: podsData, error: podsError } = await supabase
        .from("pods")
        .select("*")
        .eq("tournament_id", tournament.id);

      if (podsError) {
        console.error("Error fetching pods:", podsError);
        throw podsError;
      }

      if (podsData) {
        const podMap = new Map<number, string>();
        podsData.forEach((pod) => {
          const displayName = pod.team_name
            ? pod.team_name
            : adaptCombinedNamesToFirstNames(pod.name);
          podMap.set(pod.id, displayName);
        });
        setPods(podMap);
      }

      if (isPoolComplete) {
        // Fetch bracket matches
        const { data: inProgressBracket, error: bracketInProgressError } =
          await supabase
            .from("bracket_matches")
            .select("*")
            .eq("tournament_id", tournament.id)
            .eq("status", "in_progress")
            .order("game_number", { ascending: true });

        if (bracketInProgressError) throw bracketInProgressError;

        const { data: pendingBracket, error: bracketPendingError } =
          await supabase
            .from("bracket_matches")
            .select("*")
            .eq("tournament_id", tournament.id)
            .eq("status", "pending")
            .order("game_number", { ascending: true })
            .limit(1);

        if (bracketPendingError) throw bracketPendingError;

        // Fetch bracket teams
        const { data: teamsData, error: teamsError } = await supabase
          .from("bracket_teams")
          .select("*")
          .eq("tournament_id", tournament.id);

        if (teamsError) throw teamsError;

        if (teamsData) {
          const teamMap = new Map<number, string>();
          teamsData.forEach((team) => {
            teamMap.set(team.id, team.team_name);
          });
          setBracketTeams(teamMap);
        }

        setCurrentGame(
          inProgressBracket && inProgressBracket.length > 0
            ? { ...mapToBracketMatch(inProgressBracket[0]), isBracket: true }
            : null
        );
        setNextGame(
          pendingBracket && pendingBracket.length > 0
            ? { ...mapToBracketMatch(pendingBracket[0]), isBracket: true }
            : null
        );
      } else {
        // Fetch pool matches
        const { data: inProgressGames, error: inProgressError } =
          await supabase
            .from("pool_matches")
            .select("*")
            .eq("tournament_id", tournament.id)
            .eq("status", "in_progress")
            .order("game_number", { ascending: true });

        if (inProgressError) throw inProgressError;

        const { data: pendingGames, error: pendingError } = await supabase
          .from("pool_matches")
          .select("*")
          .eq("tournament_id", tournament.id)
          .eq("status", "pending")
          .order("game_number", { ascending: true })
          .limit(1);

        if (pendingError) throw pendingError;

        setCurrentGame(
          inProgressGames && inProgressGames.length > 0
            ? mapToPoolMatch(inProgressGames[0])
            : null
        );
        setNextGame(
          pendingGames && pendingGames.length > 0
            ? mapToPoolMatch(pendingGames[0])
            : null
        );
      }

      setLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load game data"
      );
      setLoading(false);
    }
  }, [tournament]);

  useEffect(() => {
    // Set a timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (loading) {
        console.error("Loading timeout - forcing completion");
        setLoading(false);
        setError("Loading timed out. Please check your connection and retry.");
      }
    }, 10000); // 10 second timeout

    fetchData();

    return () => clearTimeout(timeout);
  }, [fetchData]); // Removed loading dependency to prevent loop

  // Subscribe to real-time updates
  useEffect(() => {
    // Add debounce to prevent excessive fetching
    let timeoutId: NodeJS.Timeout | null = null;

    const debouncedFetchData = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        fetchData();
      }, 500); // Wait 500ms before refetching
    };

    const channel = supabase
      .channel(`scorekeeper-${Date.now()}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "pool_matches",
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
          table: "bracket_matches",
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
  }, [fetchData]);

  // Map database row to BracketMatch type
  const mapToBracketMatch = (row: {
    id: number;
    game_number: number;
    bracket_type: "winners" | "losers" | "championship";
    team_a_id: number | null;
    team_b_id: number | null;
    team_a_score: number;
    team_b_score: number;
    status: "pending" | "in_progress" | "completed";
    created_at: string;
    updated_at: string;
  }): BracketMatch => ({
    id: row.id,
    gameNumber: row.game_number,
    bracketType: row.bracket_type,
    teamAId: row.team_a_id,
    teamBId: row.team_b_id,
    teamAScore: row.team_a_score,
    teamBScore: row.team_b_score,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });

  // Map database row to PoolMatch type
  const mapToPoolMatch = (row: {
    id: number;
    game_number: number;
    round_number: number;
    scheduled_time: string | null;
    court_number: number;
    team_a_pods: number[];
    team_b_pods: number[];
    sitting_pods: number[];
    team_a_score: number;
    team_b_score: number;
    status: "pending" | "in_progress" | "completed";
    created_at: string;
    updated_at: string;
  }): PoolMatch => ({
    id: row.id,
    gameNumber: row.game_number,
    roundNumber: row.round_number,
    scheduledTime: row.scheduled_time,
    courtNumber: row.court_number,
    teamAPods: row.team_a_pods,
    teamBPods: row.team_b_pods,
    sittingPods: row.sitting_pods,
    teamAScore: row.team_a_score,
    teamBScore: row.team_b_score,
    status: row.status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  });

  // Format team names from pod IDs or team IDs
  const formatTeamNames = (
    podIds: number[] | null | undefined,
    teamId?: number | null
  ): string => {
    // For bracket matches, use team ID
    if (teamId !== undefined) {
      if (!teamId) return "TBD";
      return bracketTeams.get(teamId) || `Team ${teamId}`;
    }

    // For pool matches, use pod IDs
    if (!podIds || !Array.isArray(podIds) || podIds.length === 0) {
      return "TBD";
    }
    return podIds.map((id) => pods.get(id) || `Pod ${id}`).join(" • ");
  };

  // Start the next pending game
  const handleStartGame = async () => {
    if (updating) return;
    setUpdating(true);

    try {
      const endpoint = isBracketPlay
        ? "/api/bracket/games/start"
        : "/api/games/start";

      const response = await fetch(endpoint, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to start game");
        return;
      }

      // Immediately fetch the updated game state
      await fetchData();
    } catch (error) {
      console.error("Error starting game:", error);
      alert("Failed to start game");
    } finally {
      setUpdating(false);
    }
  };

  // Update score
  const handleScoreUpdate = async (
    gameId: number,
    teamAScore: number,
    teamBScore: number
  ) => {
    try {
      // Optimistic update - update local state immediately
      setCurrentGame((prev) => {
        if (!prev || prev.id !== gameId) return prev;
        return {
          ...prev,
          teamAScore,
          teamBScore,
        };
      });

      const endpoint = isBracketPlay
        ? `/api/bracket/games/${gameId}/score`
        : `/api/games/${gameId}/score`;

      const response = await fetch(endpoint, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamAScore, teamBScore }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to update score:", error);
        // Revert optimistic update on error
        fetchData();
      }
    } catch (error) {
      console.error("Error updating score:", error);
      // Revert optimistic update on error
      fetchData();
    }
  };

  // Complete the current game
  const handleCompleteGame = async () => {
    if (!currentGame || updating) return;
    setUpdating(true);

    try {
      const endpoint = isBracketPlay
        ? `/api/bracket/games/${currentGame.id}/complete`
        : `/api/games/${currentGame.id}/complete`;

      const response = await fetch(endpoint, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to complete game");
        return;
      }

      // If this was the 6th pool game, initialize bracket
      if (
        !isBracketPlay &&
        "gameNumber" in currentGame &&
        currentGame.gameNumber === 6
      ) {
        try {
          const bracketResponse = await fetch("/api/bracket/initialize", {
            method: "POST",
          });

          if (!bracketResponse.ok) {
            console.error("Failed to initialize bracket");
          }
        } catch (error) {
          console.error("Error initializing bracket:", error);
        }
      }

      // Immediately fetch the next game
      await fetchData();
    } catch (error) {
      console.error("Error completing game:", error);
      alert("Failed to complete game");
    } finally {
      setUpdating(false);
    }
  };

  // Check if game can be completed
  const canCompleteGame = (): boolean => {
    if (!currentGame) return false;
    const { teamAScore, teamBScore } = currentGame;
    const maxScore = Math.max(teamAScore, teamBScore);
    const scoreDiff = Math.abs(teamAScore - teamBScore);

    return (maxScore >= 21 && scoreDiff >= 2) || maxScore >= 25;
  };

  if (loading) {
    return (
      <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col items-center justify-center gap-4 p-4">
        <div className="text-white text-2xl">Loading...</div>
        {error && (
          <div className="text-red-400 text-center max-w-md">
            <p className="font-semibold mb-2">Error:</p>
            <p className="text-sm">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    );
  }

  const gameToDisplay = currentGame || nextGame;

  return (
    <div className="h-screen overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 relative flex flex-col">
      {/* Back Button */}
      <button
        onClick={() => router.push(`/tournaments/${tournament.slug}/schedule`)}
        className="absolute top-2 left-2 z-10 text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
        aria-label="Back to schedule"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-2 sm:px-4 py-2 sm:py-4">
        {!gameToDisplay ? (
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold mb-3">No Games Available</h1>
            <p className="text-lg text-white/70">
              All games have been completed!
            </p>
          </div>
        ) : (
          <div className="w-full max-w-5xl flex flex-col items-center gap-2 sm:gap-3">
            {/* Game Info */}
            <div className="text-center text-white">
              <div className="flex items-center justify-center gap-2 mb-2">
                {isBracketPlay && (
                  <Trophy className="w-5 h-5 text-yellow-500" />
                )}
                <h1 className="text-xl sm:text-2xl font-bold">
                  {isBracketPlay ? "Bracket" : "Pool Play"} Game{" "}
                  {gameToDisplay.gameNumber}
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-white/60">
                {"scheduledTime" in gameToDisplay
                  ? gameToDisplay.scheduledTime
                  : ""}
                {"courtNumber" in gameToDisplay
                  ? ` • Court ${gameToDisplay.courtNumber}`
                  : ""}
              </p>
              {gameToDisplay.status === "pending" && (
                <p className="text-yellow-400/80 font-medium mt-1 text-xs sm:text-sm">
                  Game Not Started
                </p>
              )}
            </div>

            {/* Score Displays */}
            <div className="w-full grid grid-cols-2 gap-4 sm:gap-8 max-w-4xl">
              {/* Team A */}
              <ScoreDisplay
                teamName={
                  isBracketPlay && "teamAId" in gameToDisplay
                    ? formatTeamNames(undefined, gameToDisplay.teamAId)
                    : "teamAPods" in gameToDisplay
                      ? formatTeamNames(gameToDisplay.teamAPods as number[])
                      : "TBD"
                }
                score={gameToDisplay.teamAScore}
                onIncrement={() =>
                  handleScoreUpdate(
                    gameToDisplay.id,
                    gameToDisplay.teamAScore + 1,
                    gameToDisplay.teamBScore
                  )
                }
                onDecrement={() =>
                  handleScoreUpdate(
                    gameToDisplay.id,
                    Math.max(0, gameToDisplay.teamAScore - 1),
                    gameToDisplay.teamBScore
                  )
                }
                color="red"
                disabled={gameToDisplay.status !== "in_progress"}
              />

              {/* Team B */}
              <ScoreDisplay
                teamName={
                  isBracketPlay && "teamBId" in gameToDisplay
                    ? formatTeamNames(undefined, gameToDisplay.teamBId)
                    : "teamBPods" in gameToDisplay
                      ? formatTeamNames(gameToDisplay.teamBPods as number[])
                      : "TBD"
                }
                score={gameToDisplay.teamBScore}
                onIncrement={() =>
                  handleScoreUpdate(
                    gameToDisplay.id,
                    gameToDisplay.teamAScore,
                    gameToDisplay.teamBScore + 1
                  )
                }
                onDecrement={() =>
                  handleScoreUpdate(
                    gameToDisplay.id,
                    gameToDisplay.teamAScore,
                    Math.max(0, gameToDisplay.teamBScore - 1)
                  )
                }
                color="blue"
                disabled={gameToDisplay.status !== "in_progress"}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-1 sm:mt-2">
              {gameToDisplay.status === "pending" && (
                <Button
                  onClick={handleStartGame}
                  disabled={updating}
                  size="lg"
                  className="bg-[#6b8a6b] hover:bg-[#5a7a5a] text-white text-base sm:text-lg px-4 sm:px-6 py-4 sm:py-5"
                >
                  <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  Start Match
                </Button>
              )}

              {gameToDisplay.status === "in_progress" && canCompleteGame() && (
                <Button
                  onClick={handleCompleteGame}
                  disabled={updating}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white text-base sm:text-lg px-4 sm:px-6 py-4 sm:py-5"
                >
                  <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                  End Match
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
