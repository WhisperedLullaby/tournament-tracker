"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal } from "lucide-react";
import type { BracketTeam } from "@/lib/db/schema";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: "easeOut" as const },
  },
};

interface BracketTeamCardsProps {
  teams: BracketTeam[];
  pods: Map<number, string>;
}

export function BracketTeamCards({ teams, pods }: BracketTeamCardsProps) {
  const shouldReduceMotion = useReducedMotion();

  // Sort teams by name (Team A, Team B, Team C)
  const sortedTeams = [...teams].sort((a, b) =>
    a.teamName.localeCompare(b.teamName)
  );

  // Helper to get seed number
  const getSeedNumber = (teamName: string): number => {
    if (teamName === "Team A") return 1;
    if (teamName === "Team B") return 2;
    if (teamName === "Team C") return 3;
    if (teamName === "Team D") return 4;
    return 0;
  };

  // Helper to get seed icon
  const getSeedIcon = (seed: number) => {
    if (seed === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (seed === 2) return <Medal className="h-5 w-5 text-slate-400" />;
    if (seed === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    if (seed === 4) return <Medal className="h-5 w-5 text-muted-foreground" />;
    return null;
  };

  // Helper to get ordinal suffix
  const getOrdinalSuffix = (seed: number): string => {
    if (seed === 1) return "st";
    if (seed === 2) return "nd";
    if (seed === 3) return "rd";
    return "th";
  };

  // Helper to get pod name
  const getPodName = (podId: number): string => {
    return pods.get(podId) || `Pod ${podId}`;
  };

  return (
    <div className="w-full">
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold">Team Compositions</h3>
        <p className="text-sm text-muted-foreground">
          Teams formed from final pool play standings
        </p>
      </div>

      <motion.div
        className="grid gap-4 md:grid-cols-2 lg:grid-cols-4"
        variants={shouldReduceMotion ? undefined : container}
        initial={shouldReduceMotion ? false : "hidden"}
        animate="visible"
      >
        {sortedTeams.map((team) => {
          const seed = getSeedNumber(team.teamName);
          const seedColors = {
            1: "border-yellow-500/30 bg-yellow-500/5",
            2: "border-slate-400/30 bg-slate-400/5",
            3: "border-amber-700/30 bg-amber-700/5",
            4: "border-muted-foreground/30 bg-muted/30",
          };

          return (
            <motion.div
              key={team.id}
              variants={shouldReduceMotion ? undefined : item}
              whileHover={shouldReduceMotion ? {} : { y: -3, scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
            <Card
              className={`border-2 transition-all hover:shadow-lg h-full ${
                seedColors[seed as keyof typeof seedColors] || "border-muted"
              }`}
            >
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">{team.teamName}</span>
                  <div className="flex items-center gap-2">
                    {getSeedIcon(seed)}
                    <span className="text-xs text-muted-foreground font-normal">
                      {seed}{getOrdinalSuffix(seed)} Seed
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <div className="bg-primary/20 h-2 w-2 rounded-full" />
                    <p className="text-sm font-medium">
                      {getPodName(team.pod1Id)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                    <div className="bg-primary/20 h-2 w-2 rounded-full" />
                    <p className="text-sm font-medium">
                      {getPodName(team.pod2Id)}
                    </p>
                  </div>
                  {team.pod3Id != null && (
                    <div className="flex items-center gap-2 p-2 rounded bg-muted/50">
                      <div className="bg-primary/20 h-2 w-2 rounded-full" />
                      <p className="text-sm font-medium">
                        {getPodName(team.pod3Id)}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
