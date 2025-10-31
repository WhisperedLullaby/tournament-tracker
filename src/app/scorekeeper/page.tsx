"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Play, CheckCircle } from "lucide-react";
import { ScoreDisplay } from "@/components/score-display";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import type { PoolMatch } from "@/lib/db/schema";

export default function ScorekeeperPage() {
  const router = useRouter();
  const [currentGame, setCurrentGame] = useState<PoolMatch | null>(null);
  const [nextGame, setNextGame] = useState<PoolMatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);
  const [pods, setPods] = useState<Map<number, string>>(new Map());

  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      console.log("Fetching scorekeeper data...");

      // Fetch current in-progress game
      const { data: inProgressGames, error: inProgressError } = await supabase
        .from("pool_matches")
        .select("*")
        .eq("status", "in_progress")
        .order("game_number", { ascending: true });

      if (inProgressError) {
        console.error("Error fetching in-progress games:", inProgressError);
        throw inProgressError;
      }

      // Fetch next pending game
      const { data: pendingGames, error: pendingError } = await supabase
        .from("pool_matches")
        .select("*")
        .eq("status", "pending")
        .order("game_number", { ascending: true })
        .limit(1);

      if (pendingError) {
        console.error("Error fetching pending games:", pendingError);
        throw pendingError;
      }

      // Fetch all pods for team names
      const { data: podsData, error: podsError } = await supabase
        .from("pods")
        .select("*");

      if (podsError) {
        console.error("Error fetching pods:", podsError);
        throw podsError;
      }

      if (podsData) {
        const podMap = new Map<number, string>();
        podsData.forEach((pod) => {
          podMap.set(pod.id, pod.team_name || pod.name);
        });
        setPods(podMap);
      }

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
      setLoading(false);
      console.log("Data loaded successfully");
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(
        error instanceof Error ? error.message : "Failed to load game data"
      );
      setLoading(false);
    }
  }, []);

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
  }, [fetchData, loading]);

  // Subscribe to real-time updates
  useEffect(() => {
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
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

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

  // Format team names from pod IDs
  const formatTeamNames = (podIds: number[] | null | undefined): string => {
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
      const response = await fetch("/api/games/start", {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to start game");
      }
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
      const response = await fetch(`/api/games/${gameId}/score`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teamAScore, teamBScore }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Failed to update score:", error);
      }
    } catch (error) {
      console.error("Error updating score:", error);
    }
  };

  // Complete the current game
  const handleCompleteGame = async () => {
    if (!currentGame || updating) return;
    setUpdating(true);

    try {
      const response = await fetch(`/api/games/${currentGame.id}/complete`, {
        method: "POST",
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || "Failed to complete game");
      }
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
        onClick={() => router.push("/schedule")}
        className="absolute top-2 left-2 z-10 text-white/60 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/10"
        aria-label="Back to schedule"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4">
        {!gameToDisplay ? (
          <div className="text-center text-white">
            <h1 className="text-3xl font-bold mb-3">No Games Available</h1>
            <p className="text-lg text-white/70">
              All games have been completed!
            </p>
          </div>
        ) : (
          <div className="w-full max-w-5xl flex flex-col items-center gap-3">
            {/* Game Info */}
            <div className="text-center text-white">
              <h1 className="text-2xl font-bold mb-1">
                Game {gameToDisplay.gameNumber}
              </h1>
              <p className="text-sm text-white/60">
                {gameToDisplay.scheduledTime || "TBD"} • Court{" "}
                {gameToDisplay.courtNumber}
              </p>
              {gameToDisplay.status === "pending" && (
                <p className="text-yellow-400/80 font-medium mt-1 text-sm">
                  Game Not Started
                </p>
              )}
            </div>

            {/* Score Displays */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl">
              {/* Team A */}
              <ScoreDisplay
                teamName={formatTeamNames(gameToDisplay.teamAPods as number[])}
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
                teamName={formatTeamNames(gameToDisplay.teamBPods as number[])}
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
            <div className="flex gap-3 mt-2">
              {gameToDisplay.status === "pending" && (
                <Button
                  onClick={handleStartGame}
                  disabled={updating}
                  size="lg"
                  className="bg-[#6b8a6b] hover:bg-[#5a7a5a] text-white text-lg px-6 py-5"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Match
                </Button>
              )}

              {gameToDisplay.status === "in_progress" && canCompleteGame() && (
                <Button
                  onClick={handleCompleteGame}
                  disabled={updating}
                  size="lg"
                  className="bg-primary hover:bg-primary/90 text-white text-lg px-6 py-5"
                >
                  <CheckCircle className="w-5 h-5 mr-2" />
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
