"use client";

import { useState } from "react";
import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { HeroGeometric } from "@/components/hero-geometric";
import { SortableTable, ColumnDef } from "@/components/sortable-table";
import { GameLog } from "@/components/game-log";
import { TrendingUp, ChevronDown, ChevronRight } from "lucide-react";

type StandingsData = {
  podId: number;
  teamName: string | null;
  playerNames: string;
  player1: string;
  player2: string;
  wins: number;
  losses: number;
  pointsFor: number;
  pointsAgainst: number;
  pointDifferential: number;
  gamesPlayed: number;
};

type MatchLogData = {
  id: number;
  roundNumber: number;
  teamAPods: number[];
  teamBPods: number[];
  teamAScore: number;
  teamBScore: number;
  updatedAt: Date;
};

interface StandingsPageClientProps {
  standings: StandingsData[];
  matchLog: MatchLogData[];
}

export function StandingsPageClient({
  standings,
  matchLog,
}: StandingsPageClientProps) {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  const toggleRow = (podId: number) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(podId)) {
        newSet.delete(podId);
      } else {
        newSet.add(podId);
      }
      return newSet;
    });
  };

  const standingsColumns: ColumnDef<StandingsData>[] = [
    {
      key: "rank",
      label: "Rank",
      sortable: false,
      render: (_, row, index) => (
        <div className="flex items-center gap-2 font-medium">
          <span>{index + 1}</span>
        </div>
      ),
      className: "font-medium",
    },
    {
      key: "teamName",
      label: "Team",
      sticky: true,
      render: (value, row) => {
        const teamName = value as string | null;
        const isExpanded = expandedRows.has(row.podId);
        return (
          <div>
            <button
              onClick={() => toggleRow(row.podId)}
              className="hover:text-primary flex items-center gap-2 text-left transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 flex-shrink-0" />
              ) : (
                <ChevronRight className="h-4 w-4 flex-shrink-0" />
              )}
              <span className="text-foreground font-medium">
                {teamName || row.playerNames}
              </span>
            </button>
            {isExpanded && (
              <div className="text-muted-foreground mt-1 ml-6 space-y-0.5 text-xs">
                <div>{row.player1}</div>
                <div>{row.player2}</div>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "gamesPlayed",
      label: "GP",
      headerClassName: "text-center",
      className: "text-center",
    },
    {
      key: "wins",
      label: "W",
      headerClassName: "text-center",
      className: "text-center font-medium text-green-600 dark:text-green-400",
    },
    {
      key: "losses",
      label: "L",
      headerClassName: "text-center",
      className: "text-center text-muted-foreground",
    },
    {
      key: "pointsFor",
      label: "PF",
      headerClassName: "text-center",
      className: "text-center",
    },
    {
      key: "pointsAgainst",
      label: "PA",
      headerClassName: "text-center",
      className: "text-center",
    },
    {
      key: "pointDifferential",
      label: "+/-",
      render: (value) => {
        const diff = value as number;
        return (
          <div
            className={`flex items-center justify-center gap-1 font-bold ${
              diff > 0
                ? "text-green-600 dark:text-green-400"
                : diff < 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-muted-foreground"
            }`}
          >
            {diff > 0 && <TrendingUp className="h-4 w-4" />}
            {diff > 0 ? "+" : ""}
            {diff}
          </div>
        );
      },
      headerClassName: "text-center",
      className: "text-center",
    },
  ];

  return (
    <>
      <Navigation />
      <div className="min-h-screen">
        {/* Hero Section */}
        <HeroGeometric
          badge="POOL PLAY"
          title1="Tournament"
          title2="Standings"
          description="Live standings updated after each match. Teams ranked by point differential."
          className="mb-12"
        />

        <div className="container mx-auto space-y-8 px-4 pb-16">
          {/* Standings Table */}
          <SortableTable
            title="Pool Play Standings"
            columns={standingsColumns}
            data={standings}
            defaultSortKey="pointDifferential"
            defaultSortDirection="desc"
            emptyMessage="No standings available yet. Matches will appear here once pool play begins."
          />

          {/* Game Log */}
          <GameLog matchLog={matchLog} standings={standings} />
        </div>
      </div>
      <Footer />
    </>
  );
}
