/**
 * Tournament Format Templates
 * Default content for pool play and bracket play based on tournament type
 */

export const TOURNAMENT_TEMPLATES = {
  pod_2: {
    poolPlay: `9 Pods of 2 Players
18 total players divided into partnerships

6v6 Matches
3 pods per side, 3 pods rest each round

Seeding by Point Differential
Pods ranked 1-9 after pool play`,
    bracketPlay: `3 Teams of 6 Players
Seeds 1+5+9, 2+6+7, 3+4+8

Balanced Team Formation
Top, middle, and bottom seeds combined

Double Elimination
Everyone must lose twice to be eliminated`,
  },
  pod_3: {
    poolPlay: `Pods of 3 Players
Players form partnerships for pool play

6v6 Matches
Multiple pods per side, rotating through rounds

Seeding by Point Differential
Pods ranked after pool play`,
    bracketPlay: `Teams Formed from Pods
Balanced by pool play seeding

Best of 3 Format
Games to 25, Game 3 to 15

Double Elimination
Everyone must lose twice to be eliminated`,
  },
  set_teams: {
    poolPlay: `Pool Play Format
2 games per round, 4 rounds total

6v6 Matches
Libero allowed, no typewriting

Seeding System
By record, then point differential, then strength of schedule`,
    bracketPlay: `Best of 3 Format
Games to 25 points, win by 2

Game 3 Tiebreaker
First to 15 points

Double Elimination Bracket
Teams must lose twice to be eliminated`,
  },
} as const;

export type TournamentType = keyof typeof TOURNAMENT_TEMPLATES;

export function getTemplateForType(type: TournamentType) {
  return TOURNAMENT_TEMPLATES[type];
}
