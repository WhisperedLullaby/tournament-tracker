"use client";

import { useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Clock, Pencil } from "lucide-react";
import { useTournament } from "@/contexts/tournament-context";
import { ScoreEntryModal } from "@/components/score-entry-modal";
import type { BracketMatch, BracketTeam } from "@/lib/db/schema";

interface BracketDisplayProps {
  matches: BracketMatch[];
  teams: BracketTeam[];
  pods: Map<number, string>;
}

export function BracketDisplay({ matches, teams, pods }: BracketDisplayProps) {
  const shouldReduceMotion = useReducedMotion();
  const { isOrganizer } = useTournament();
  const [editMatch, setEditMatch] = useState<BracketMatch | null>(null);

  // Helper to get team name by ID
  const getTeamName = (teamId: number | null): string => {
    if (!teamId) return "TBD";
    const team = teams.find((t) => t.id === teamId);
    return team?.teamName || "TBD";
  };

  // Helper to get team display with pods
  const getTeamDisplay = (teamId: number | null): string => {
    if (!teamId) return "TBD";
    const team = teams.find((t) => t.id === teamId);
    if (!team) return "TBD";

    const pod1 = pods.get(team.pod1Id) || `Pod ${team.pod1Id}`;
    const pod2 = pods.get(team.pod2Id) || `Pod ${team.pod2Id}`;
    const pod3 = team.pod3Id != null ? (pods.get(team.pod3Id) || `Pod ${team.pod3Id}`) : null;

    return [pod1, pod2, pod3].filter(Boolean).join(" • ");
  };

  // Get matches by game number
  const getMatch = (gameNum: number) =>
    matches.find((m) => m.gameNumber === gameNum);

  const teamCount = teams.length;

  // Match card component
  const MatchCard = ({
    match,
    label,
    className = "",
  }: {
    match?: BracketMatch;
    label: string;
    className?: string;
  }) => {
    if (!match) {
      return (
        <Card className={`border-muted border-2 border-dashed ${className}`}>
          <CardContent className="p-3">
            <div className="text-muted-foreground mb-2 text-center text-xs font-medium">
              {label}
            </div>
            <div className="text-muted-foreground py-4 text-center text-sm">
              Conditional
            </div>
          </CardContent>
        </Card>
      );
    }

    const isComplete = match.status === "completed";
    const isInProgress = match.status === "in_progress";
    const isPending = match.status === "pending";

    const teamAName = getTeamName(match.teamAId);
    const teamBName = getTeamName(match.teamBId);
    const teamAWon = isComplete && match.teamAScore > match.teamBScore;
    const teamBWon = isComplete && match.teamBScore > match.teamAScore;

    return (
      <Card
        className={`border-2 transition-all ${
          isInProgress
            ? "border-primary bg-primary/5 shadow-lg"
            : isComplete
              ? "border-primary/30 bg-primary/5"
              : "border-muted"
        } ${className}`}
      >
        <CardContent className="p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="text-muted-foreground text-xs font-medium">
              {label}
            </div>
            <div className="flex items-center gap-1">
              {isInProgress && (
                <motion.div
                  animate={shouldReduceMotion ? {} : { rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                >
                  <Clock className="text-primary h-3 w-3" />
                </motion.div>
              )}
              {isComplete && <Trophy className="text-primary h-3 w-3" />}
              {isOrganizer && !isPending && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => setEditMatch(match)}
                  aria-label="Edit score"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Team A */}
          <div
            className={`flex items-center justify-between rounded-t border-b p-2 ${
              teamAWon
                ? "border-primary/30 bg-primary/10"
                : isPending && !match.teamAId
                  ? "bg-muted/30 border-muted"
                  : "bg-background border-muted"
            }`}
            title={match.teamAId ? getTeamDisplay(match.teamAId) : undefined}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={`team-a-${match.teamAId ?? "tbd"}`}
                initial={shouldReduceMotion ? {} : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? {} : { opacity: 0, x: 6 }}
                transition={{ duration: 0.2 }}
                className={`truncate text-sm font-medium ${
                  teamAWon ? "text-primary" : ""
                } ${!match.teamAId ? "text-muted-foreground italic" : ""}`}
              >
                {teamAName}
              </motion.span>
            </AnimatePresence>
            <motion.span
              key={`score-a-${match.id}-${match.teamAScore}`}
              initial={shouldReduceMotion ? {} : { scale: 1.3, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className={`ml-2 text-sm font-bold ${
                teamAWon ? "text-primary" : ""
              }`}
            >
              {match.teamAScore}
            </motion.span>
          </div>

          {/* Team B */}
          <div
            className={`flex items-center justify-between rounded-b p-2 ${
              teamBWon
                ? "border-primary/30 bg-primary/10"
                : isPending && !match.teamBId
                  ? "bg-muted/30 border-muted"
                  : "bg-background border-muted"
            }`}
            title={match.teamBId ? getTeamDisplay(match.teamBId) : undefined}
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={`team-b-${match.teamBId ?? "tbd"}`}
                initial={shouldReduceMotion ? {} : { opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? {} : { opacity: 0, x: 6 }}
                transition={{ duration: 0.2 }}
                className={`truncate text-sm font-medium ${
                  teamBWon ? "text-primary" : ""
                } ${!match.teamBId ? "text-muted-foreground italic" : ""}`}
              >
                {teamBName}
              </motion.span>
            </AnimatePresence>
            <motion.span
              key={`score-b-${match.id}-${match.teamBScore}`}
              initial={shouldReduceMotion ? {} : { scale: 1.3, opacity: 0.6 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.35 }}
              className={`ml-2 text-sm font-bold ${
                teamBWon ? "text-primary" : ""
              }`}
            >
              {match.teamBScore}
            </motion.span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ToFinals = ({ color, gameNum }: { color: "yellow" | "blue"; gameNum: number }) => (
    <div
      className={`flex items-center justify-center rounded-lg border-2 border-dashed p-4 ${
        color === "yellow"
          ? "border-primary/30 bg-primary/5"
          : "border-muted-foreground/30 bg-muted/30"
      }`}
    >
      <span className="text-muted-foreground text-xs">
        Winner → Game {gameNum}
      </span>
    </div>
  );

  const Legend = () => (
    <div className="text-muted-foreground mt-6 flex items-center justify-center gap-6 text-xs">
      <div className="flex items-center gap-2">
        <div className="border-primary bg-primary/5 h-3 w-3 rounded border-2" />
        <span>In Progress</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded border-2 border-primary/30 bg-primary/5" />
        <span>Completed</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="border-muted h-3 w-3 rounded border-2 border-dashed" />
        <span>Conditional</span>
      </div>
    </div>
  );

  const mobileGroups =
    teamCount <= 4
      ? [
          { heading: "Winner's Bracket · Round 1", games: [1, 2] },
          { heading: "Loser's Bracket · Round 1", games: [3] },
          { heading: "Winner's Final", games: [4] },
          { heading: "Loser's Final", games: [5] },
          { heading: "Championship", games: [6, 7] },
        ]
      : [
          { heading: "Winner's Bracket · Round 1", games: [1, 2, 3] },
          { heading: "Loser's Bracket · Round 1", games: [4, 6] },
          { heading: "Winner's Semifinal", games: [5] },
          { heading: "Loser's Quarterfinal", games: [8] },
          { heading: "Winner's Final", games: [7] },
          { heading: "Loser's Final", games: [9] },
          { heading: "Championship", games: [10, 11] },
        ];

  const gameLabels: Record<number, string> =
    teamCount <= 4
      ? {
          1: "Game 1 · 1st vs 3rd",
          2: "Game 2 · 2nd vs 4th",
          3: "Game 3 · Losers R1",
          4: "Game 4 · Winners Final",
          5: "Game 5 · Losers Final",
          6: "Game 6 · Grand Finals",
          7: "Game 7 · Finals Reset (If Needed)",
        }
      : {
          1: "Game 1 · 1st vs 6th",
          2: "Game 2 · 2nd vs 5th",
          3: "Game 3 · 3rd vs 4th",
          4: "Game 4 · Losers R1",
          5: "Game 5 · Winners SF",
          6: "Game 6 · Losers R1b",
          7: "Game 7 · Winners Final",
          8: "Game 8 · Losers QF",
          9: "Game 9 · Losers Final",
          10: "Game 10 · Grand Finals",
          11: "Game 11 · Finals Reset (If Needed)",
        };

  return (
    <div className="w-full">
      {/* Mobile vertical list */}
      <div className="md:hidden p-4">
        <div className="mb-6 text-center">
          <h2 className="mb-1 text-2xl font-bold">Tournament Bracket</h2>
          <p className="text-muted-foreground text-sm">
            Double Elimination Format
          </p>
        </div>
        <div className="space-y-6">
          {mobileGroups.map((group) => (
            <div key={group.heading}>
              <h3 className="text-muted-foreground mb-2 text-center text-xs font-semibold uppercase tracking-wide">
                {group.heading}
              </h3>
              <div className="space-y-3">
                {group.games.map((gameNum) => (
                  <MatchCard
                    key={gameNum}
                    match={getMatch(gameNum)}
                    label={gameLabels[gameNum]}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <Legend />
      </div>

      {/* Desktop bracket grid */}
      <div className="hidden md:block w-full overflow-x-auto">
      <div className="min-w-[800px] p-4">
        {/* Header */}
        <div className="mb-6 text-center">
          <h2 className="mb-1 text-2xl font-bold">Tournament Bracket</h2>
          <p className="text-muted-foreground text-sm">
            Double Elimination Format
          </p>
        </div>

        {teamCount <= 4 ? (
          /* ─── 4-TEAM DOUBLE ELIMINATION ─────────────────────────────── */
          <div className="space-y-8">
            {/* Winner's Bracket */}
            <div>
              <h3 className="mb-4 text-center text-lg font-semibold text-primary">
                Winner&apos;s Bracket
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">ROUND 1</div>
                  <MatchCard match={getMatch(1)} label="Game 1 · 1st vs 3rd" />
                  <MatchCard match={getMatch(2)} label="Game 2 · 2nd vs 4th" />
                </div>
                <div className="space-y-4">
                  <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">WINNER&apos;S FINAL</div>
                  <div className="h-12" />
                  <MatchCard match={getMatch(4)} label="Game 4 · Winners Final" />
                </div>
                <div className="space-y-4">
                  <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">TO FINALS</div>
                  <div className="h-12" />
                  <ToFinals color="yellow" gameNum={6} />
                </div>
              </div>
            </div>

            {/* Loser's Bracket */}
            <div>
              <h3 className="mb-4 text-center text-lg font-semibold text-muted-foreground">
                Loser&apos;s Bracket
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-4">
                  <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">ROUND 1</div>
                  <div className="h-12" />
                  <MatchCard match={getMatch(3)} label="Game 3 · Losers R1" />
                </div>
                <div className="space-y-4">
                  <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">LOSER&apos;S FINAL</div>
                  <div className="h-12" />
                  <MatchCard match={getMatch(5)} label="Game 5 · Losers Final" />
                </div>
                <div className="space-y-4">
                  <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">TO FINALS</div>
                  <div className="h-12" />
                  <ToFinals color="blue" gameNum={6} />
                </div>
              </div>
            </div>

            {/* Championship */}
            <div>
              <h3 className="mb-4 text-center text-lg font-semibold text-accent-foreground">
                Championship
              </h3>
              <div className="mx-auto grid max-w-2xl grid-cols-2 gap-6">
                <MatchCard match={getMatch(6)} label="Game 6 · Grand Finals" />
                <MatchCard match={getMatch(7)} label="Game 7 · Finals Reset (If Needed)" />
              </div>
            </div>
          </div>
        ) : (
          /* ─── 6-TEAM DOUBLE ELIMINATION ─────────────────────────────── */
          <div className="space-y-8">
            {/* Winner's Bracket */}
            <div>
              <h3 className="mb-4 text-center text-lg font-semibold text-primary">
                Winner&apos;s Bracket
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-4">
                  <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">ROUND 1</div>
                  <MatchCard match={getMatch(1)} label="Game 1 · 1st vs 6th" />
                  <MatchCard match={getMatch(2)} label="Game 2 · 2nd vs 5th" />
                  <MatchCard match={getMatch(3)} label="Game 3 · 3rd vs 4th" />
                </div>
                <div className="space-y-4">
                  <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">SEMIFINAL</div>
                  <div className="h-12" />
                  <MatchCard match={getMatch(5)} label="Game 5 · Winners SF" />
                </div>
                <div className="space-y-4">
                  <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">WINNER&apos;S FINAL</div>
                  <div className="h-20" />
                  <MatchCard match={getMatch(7)} label="Game 7 · Winners Final" />
                </div>
                <div className="space-y-4">
                  <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">TO FINALS</div>
                  <div className="h-20" />
                  <ToFinals color="yellow" gameNum={10} />
                </div>
              </div>
            </div>

            {/* Loser's Bracket */}
            <div>
              <h3 className="mb-4 text-center text-lg font-semibold text-muted-foreground">
                Loser&apos;s Bracket
              </h3>
              <div className="grid grid-cols-4 gap-4">
                <div className="space-y-4">
                  <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">ROUND 1</div>
                  <MatchCard match={getMatch(4)} label="Game 4 · Losers R1" />
                  <MatchCard match={getMatch(6)} label="Game 6 · Losers R1b" />
                </div>
                <div className="space-y-4">
                  <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">QUARTERFINAL</div>
                  <div className="h-12" />
                  <MatchCard match={getMatch(8)} label="Game 8 · Losers QF" />
                </div>
                <div className="space-y-4">
                  <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">LOSER&apos;S FINAL</div>
                  <div className="h-20" />
                  <MatchCard match={getMatch(9)} label="Game 9 · Losers Final" />
                </div>
                <div className="space-y-4">
                  <div className="text-muted-foreground mb-2 text-center text-xs font-semibold">TO FINALS</div>
                  <div className="h-20" />
                  <ToFinals color="blue" gameNum={10} />
                </div>
              </div>
            </div>

            {/* Championship */}
            <div>
              <h3 className="mb-4 text-center text-lg font-semibold text-accent-foreground">
                Championship
              </h3>
              <div className="mx-auto grid max-w-2xl grid-cols-2 gap-6">
                <MatchCard match={getMatch(10)} label="Game 10 · Grand Finals" />
                <MatchCard match={getMatch(11)} label="Game 11 · Finals Reset (If Needed)" />
              </div>
            </div>
          </div>
        )}

        <Legend />
      </div>
      </div>
      {isOrganizer && editMatch && (
        <ScoreEntryModal
          open={editMatch !== null}
          onOpenChange={(open) => {
            if (!open) setEditMatch(null);
          }}
          matchId={editMatch.id}
          matchType="bracket"
          teamAName={getTeamName(editMatch.teamAId)}
          teamBName={getTeamName(editMatch.teamBId)}
          initialScoreA={editMatch.teamAScore}
          initialScoreB={editMatch.teamBScore}
        />
      )}
    </div>
  );
}
