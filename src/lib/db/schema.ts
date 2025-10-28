import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  pgEnum,
  json,
} from "drizzle-orm/pg-core";

// Enums for match status
export const matchStatusEnum = pgEnum("match_status", [
  "pending",
  "in_progress",
  "completed",
]);

export const bracketTypeEnum = pgEnum("bracket_type", [
  "winners",
  "losers",
  "championship",
]);

// Pods table - stores the 9 pods (teams of 2 players)
export const pods = pgTable("pods", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(), // Captain's email, must be unique
  name: text("name").notNull(), // e.g., "John & Sarah"
  player1: text("player1").notNull(),
  player2: text("player2").notNull(),
  teamName: text("team_name"), // Optional custom team name
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Pool matches table - stores pool play games (4 rounds)
export const poolMatches = pgTable("pool_matches", {
  id: serial("id").primaryKey(),
  roundNumber: integer("round_number").notNull(), // 1-4
  teamAPods: json("team_a_pods").$type<number[]>().notNull(), // Array of pod IDs
  teamBPods: json("team_b_pods").$type<number[]>().notNull(), // Array of pod IDs
  teamAScore: integer("team_a_score").default(0).notNull(),
  teamBScore: integer("team_b_score").default(0).notNull(),
  status: matchStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Pool standings table - tracks statistics for each pod
export const poolStandings = pgTable("pool_standings", {
  id: serial("id").primaryKey(),
  podId: integer("pod_id")
    .notNull()
    .references(() => pods.id),
  wins: integer("wins").default(0).notNull(),
  losses: integer("losses").default(0).notNull(),
  pointsFor: integer("points_for").default(0).notNull(),
  pointsAgainst: integer("points_against").default(0).notNull(),
  // Point differential is calculated as pointsFor - pointsAgainst
});

// Bracket teams table - the 3 teams formed after pool play
export const bracketTeams = pgTable("bracket_teams", {
  id: serial("id").primaryKey(),
  teamName: text("team_name").notNull(), // "A", "B", "C"
  pod1Id: integer("pod1_id")
    .notNull()
    .references(() => pods.id), // Top/Middle/Bottom tier
  pod2Id: integer("pod2_id")
    .notNull()
    .references(() => pods.id),
  pod3Id: integer("pod3_id")
    .notNull()
    .references(() => pods.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bracket matches table - stores bracket play games (up to 5 games)
export const bracketMatches = pgTable("bracket_matches", {
  id: serial("id").primaryKey(),
  gameNumber: integer("game_number").notNull(), // 1-5
  bracketType: bracketTypeEnum("bracket_type").notNull(),
  teamAId: integer("team_a_id").references(() => bracketTeams.id),
  teamBId: integer("team_b_id").references(() => bracketTeams.id),
  teamAScore: integer("team_a_score").default(0).notNull(),
  teamBScore: integer("team_b_score").default(0).notNull(),
  status: matchStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Type exports for use in the application
export type Pod = typeof pods.$inferSelect;
export type NewPod = typeof pods.$inferInsert;

export type PoolMatch = typeof poolMatches.$inferSelect;
export type NewPoolMatch = typeof poolMatches.$inferInsert;

export type PoolStanding = typeof poolStandings.$inferSelect;
export type NewPoolStanding = typeof poolStandings.$inferInsert;

export type BracketTeam = typeof bracketTeams.$inferSelect;
export type NewBracketTeam = typeof bracketTeams.$inferInsert;

export type BracketMatch = typeof bracketMatches.$inferSelect;
export type NewBracketMatch = typeof bracketMatches.$inferInsert;
