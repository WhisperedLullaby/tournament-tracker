"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { HeroGeometric } from "@/components/hero-geometric";
import { CurrentGame } from "@/components/current-game";
import { NextUp } from "@/components/next-up";
import { ScheduleTable } from "@/components/schedule-table";
import { BracketDisplay } from "@/components/bracket-display";
import { BracketTeamCards } from "@/components/bracket-team-cards";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { PoolMatch, Pod, BracketMatch, BracketTeam } from "@/lib/db/schema";
import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

// Tournament notes
const TOURNAMENT_NOTES = [
  "NOTE: Play times are estimates. If we are ahead of schedule, the next game is allowed to start earlier than its scheduled time!",
  "Check-in & warm-up begins at 9:30AM",
  "Pool play - Random teams, games to 21, win by 2. Each pod plays 4 sets.",
];

interface SchedulePageClientProps {
  currentMatch: PoolMatch | null;
  nextGame: PoolMatch | null;
  allMatches: PoolMatch[];
  allPods: Pod[];
  isPoolPlayComplete: boolean;
  bracketMatches?: BracketMatch[];
  bracketTeams?: BracketTeam[];
}

export function SchedulePageClient({
  currentMatch: initialCurrentMatch,
  nextGame: initialNextGame,
  allMatches: initialAllMatches,
  allPods,
  isPoolPlayComplete,
  bracketMatches = [],
  bracketTeams = [],
}: SchedulePageClientProps) {
  // State for real-time updates
  const [allMatches, setAllMatches] = useState<PoolMatch[]>(initialAllMatches);
  const [currentMatch, setCurrentMatch] = useState<PoolMatch | null>(
    initialCurrentMatch
  );
  const [nextGame, setNextGame] = useState<PoolMatch | null>(initialNextGame);

  // Ref to prevent multiple simultaneous refreshes
  const isRefreshing = useRef(false);

  // Create a map of pod ID to team name for easy lookup
  const podNames = new Map<number, string>();
  allPods.forEach((pod) => {
    const displayName = pod.teamName || pod.name;
    podNames.set(pod.id, displayName);
  });

  // Function to refresh matches from database with debounce protection
  const refreshMatches = useCallback(async () => {
    if (isRefreshing.current) return; // Prevent multiple simultaneous refreshes

    isRefreshing.current = true;
    try {
      // Fetch all matches - Supabase returns snake_case, need to map to camelCase
      const { data: matches, error } = await supabase
        .from("pool_matches")
        .select("*")
        .order("game_number", { ascending: true });

      if (error) throw error;

      if (matches) {
        // Map snake_case to camelCase to match our PoolMatch type
        const mappedMatches: PoolMatch[] = matches.map(
          (m: {
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
          }) => ({
          id: m.id,
          gameNumber: m.game_number,
          roundNumber: m.round_number,
          scheduledTime: m.scheduled_time,
          courtNumber: m.court_number,
          teamAPods: m.team_a_pods,
          teamBPods: m.team_b_pods,
          sittingPods: m.sitting_pods,
          teamAScore: m.team_a_score,
          teamBScore: m.team_b_score,
          status: m.status,
          createdAt: new Date(m.created_at),
          updatedAt: new Date(m.updated_at),
        })
        );

        setAllMatches(mappedMatches);

        // Find current in-progress match
        const current = mappedMatches.find((m) => m.status === "in_progress");
        setCurrentMatch(current || null);

        // Find next pending game
        const next = mappedMatches.find((m) => m.status === "pending");
        setNextGame(next || null);
      }
    } catch (error) {
      console.error("Error refreshing matches:", error);
    } finally {
      isRefreshing.current = false;
    }
  }, []);

  // Subscribe to real-time updates
  useEffect(() => {
    // Use a more specific channel name with timestamp to ensure uniqueness
    const channelName = `schedule-updates-${Date.now()}`;

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE", // Only listen to UPDATEs (scores, status changes)
          schema: "public",
          table: "pool_matches",
        },
        () => {
          // When any change occurs, refresh all matches
          refreshMatches();
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshMatches]);

  // Combine next game pods for the NextUp component
  const nextGamePods =
    nextGame &&
    Array.isArray(nextGame.teamAPods) &&
    Array.isArray(nextGame.teamBPods)
      ? [
          ...(nextGame.teamAPods as number[]),
          ...(nextGame.teamBPods as number[]),
        ]
      : null;

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10">
        {/* Hero Section */}
        <HeroGeometric
          badge={isPoolPlayComplete ? "TOURNAMENT" : "LIVE SCORES"}
          title1="Tournament"
          title2="Schedule"
          description={
            isPoolPlayComplete
              ? "View pool play schedule and tournament bracket."
              : "Real-time scores and upcoming matches for pool play."
          }
          className="mb-8"
        />

        <div className="container mx-auto space-y-6 px-4 pb-16">
          {isPoolPlayComplete ? (
            <Tabs defaultValue="bracket" className="w-full">
              <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
                <TabsTrigger value="pool">Pool Play</TabsTrigger>
                <TabsTrigger value="bracket">Bracket</TabsTrigger>
              </TabsList>

              <TabsContent value="pool" className="space-y-6 mt-6">
                {/* Main Layout: Current Game + Next Up */}
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* Current Game - Takes 2/3 width on large screens */}
                  <div className="lg:col-span-2">
                    <CurrentGame
                      initialMatch={currentMatch}
                      podNames={podNames}
                      scheduledTime={currentMatch?.scheduledTime || undefined}
                    />
                  </div>

                  {/* Next Up - Takes 1/3 width on large screens */}
                  <div className="lg:col-span-1">
                    <NextUp
                      nextGamePods={nextGamePods}
                      nextGameTime={nextGame?.scheduledTime || undefined}
                      podNames={podNames}
                    />
                  </div>
                </div>

                {/* Full Schedule Table - Full width */}
                <div>
                  <ScheduleTable matches={allMatches} podNames={podNames} />
                </div>

                {/* Tournament Notes Section */}
                <Card className="border-2 border-muted">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Info className="h-5 w-5" />
                      Tournament Notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {TOURNAMENT_NOTES.map((note, index) => (
                        <li
                          key={index}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-primary font-bold mt-0.5">
                            •
                          </span>
                          <span>{note}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bracket" className="space-y-6 mt-6">
                <BracketDisplay
                  matches={bracketMatches}
                  teams={bracketTeams}
                  pods={podNames}
                />
                <BracketTeamCards teams={bracketTeams} pods={podNames} />
              </TabsContent>
            </Tabs>
          ) : (
            <>
              {/* Main Layout: Current Game + Next Up */}
              <div className="grid gap-6 lg:grid-cols-3">
                {/* Current Game - Takes 2/3 width on large screens */}
                <div className="lg:col-span-2">
                  <CurrentGame
                    initialMatch={currentMatch}
                    podNames={podNames}
                    scheduledTime={currentMatch?.scheduledTime || undefined}
                  />
                </div>

                {/* Next Up - Takes 1/3 width on large screens */}
                <div className="lg:col-span-1">
                  <NextUp
                    nextGamePods={nextGamePods}
                    nextGameTime={nextGame?.scheduledTime || undefined}
                    podNames={podNames}
                  />
                </div>
              </div>

              {/* Full Schedule Table - Full width */}
              <div>
                <ScheduleTable matches={allMatches} podNames={podNames} />
              </div>

              {/* Tournament Notes Section */}
              <Card className="border-2 border-muted">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Info className="h-5 w-5" />
                    Tournament Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {TOURNAMENT_NOTES.map((note, index) => (
                      <li
                        key={index}
                        className="text-sm text-muted-foreground flex items-start gap-2"
                      >
                        <span className="text-primary font-bold mt-0.5">•</span>
                        <span>{note}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}
