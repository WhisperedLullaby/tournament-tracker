"use client";

import { Navigation } from "@/components/navigation";
import { Footer } from "@/components/footer";
import { HeroGeometric } from "@/components/hero-geometric";
import { SortableTable, ColumnDef } from "@/components/sortable-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingUp } from "lucide-react";

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
  teamAName: string;
  teamBName: string;
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
  const standingsColumns: ColumnDef<StandingsData>[] = [
    {
      key: "rank",
      label: "Rank",
      sortable: false,
      render: (_, row, index) => (
        <div className="flex items-center gap-2 font-medium">
          {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
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
        return (
          <div>
            <div className="font-medium text-foreground">
              {teamName || row.playerNames}
            </div>
            {teamName && (
              <div className="text-xs text-muted-foreground">
                {row.player1} & {row.player2}
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

        <div className="container mx-auto px-4 pb-16 space-y-8">
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
        <Card>
          <CardHeader>
            <CardTitle>Game Log</CardTitle>
          </CardHeader>
          <CardContent>
            {matchLog.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No completed matches yet. Games will appear here as they are
                played.
              </p>
            ) : (
              <div className="space-y-3">
                {matchLog.map((match) => (
                  <div
                    key={match.id}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 space-y-1 sm:space-y-0">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2 sm:mb-0">
                        <span className="font-medium">Round {match.roundNumber}</span>
                        <span>•</span>
                        <span>
                          {new Date(match.updatedAt).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              hour: "numeric",
                              minute: "2-digit",
                            }
                          )}
                        </span>
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className="flex items-center justify-between sm:justify-start gap-3 flex-1">
                          <span className="font-medium text-foreground truncate max-w-[200px]">
                            {match.teamAName}
                          </span>
                          <span
                            className={`font-bold text-lg ${
                              match.teamAScore > match.teamBScore
                                ? "text-green-600 dark:text-green-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            {match.teamAScore}
                          </span>
                        </div>
                        <span className="hidden sm:inline text-muted-foreground">
                          vs
                        </span>
                        <div className="flex items-center justify-between sm:justify-start gap-3 flex-1">
                          <span className="font-medium text-foreground truncate max-w-[200px]">
                            {match.teamBName}
                          </span>
                          <span
                            className={`font-bold text-lg ${
                              match.teamBScore > match.teamAScore
                                ? "text-green-600 dark:text-green-400"
                                : "text-muted-foreground"
                            }`}
                          >
                            {match.teamBScore}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
      <Footer />
    </>
  );
}
