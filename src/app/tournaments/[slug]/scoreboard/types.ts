export type ScoreboardMatchData = {
  phase: "pool" | "bracket";
  teamAName: string;
  teamBName: string;
  teamAScore: number;
  teamBScore: number;
  gameLabel: string;
  matchId: number;
};
