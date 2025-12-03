import {
  pgTable,
  serial,
  text,
  integer,
  timestamp,
  pgEnum,
  json,
  varchar,
  unique,
  boolean,
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

export const tournamentStatusEnum = pgEnum("tournament_status", [
  "upcoming",
  "active",
  "completed",
]);

export const tournamentRoleEnum = pgEnum("tournament_role", [
  "organizer",
  "participant",
]);

// Tournaments table - supports multiple tournaments
export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // "Two Peas Dec'25"
  slug: text("slug").notNull().unique(), // "two-peas-dec-2025"
  date: timestamp("date").notNull(), // Tournament date
  location: text("location"), // "All American FieldHouse, Monroeville, PA"
  description: text("description"), // Tournament description/rules
  status: tournamentStatusEnum("status").default("upcoming").notNull(),
  maxPods: integer("max_pods").default(9).notNull(),
  registrationDeadline: timestamp("registration_deadline"),
  registrationOpenDate: timestamp("registration_open_date"),
  isPublic: boolean("is_public").default(true).notNull(),
  createdBy: text("created_by").notNull(), // User ID of tournament creator
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Pods table - stores the 9 pods (teams of 2 players)
export const pods = pgTable(
  "pods",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id")
      .notNull()
      .references(() => tournaments.id), // Link to tournament
    userId: text("user_id").notNull(), // Supabase auth.users.id (UUID as text)
    email: text("email").notNull(), // Captain's email
    name: text("name").notNull(), // e.g., "John & Sarah"
    player1: text("player1").notNull(),
    player2: text("player2").notNull(),
    teamName: text("team_name"), // Optional custom team name
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint: one pod per user per tournament
    uniqueUserTournament: unique("unique_user_tournament").on(
      table.userId,
      table.tournamentId
    ),
  })
);

// Pool matches table - stores pool play games (4 rounds)
export const poolMatches = pgTable("pool_matches", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournaments.id), // Link to tournament
  gameNumber: integer("game_number").notNull(), // 1-6 for pool play
  roundNumber: integer("round_number").notNull(), // 1-4
  scheduledTime: varchar("scheduled_time", { length: 20 }), // "10:00 AM"
  courtNumber: integer("court_number").default(1).notNull(), // Court assignment
  teamAPods: json("team_a_pods").$type<number[]>().notNull(), // Array of pod IDs
  teamBPods: json("team_b_pods").$type<number[]>().notNull(), // Array of pod IDs
  sittingPods: json("sitting_pods").$type<number[]>().notNull(), // Array of pod IDs sitting out
  teamAScore: integer("team_a_score").default(0).notNull(),
  teamBScore: integer("team_b_score").default(0).notNull(),
  status: matchStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Pool standings table - tracks statistics for each pod
export const poolStandings = pgTable("pool_standings", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournaments.id), // Link to tournament
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
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournaments.id), // Link to tournament
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
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournaments.id), // Link to tournament
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

// Tournament roles table - tracks user roles in each tournament
export const tournamentRoles = pgTable("tournament_roles", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }), // Delete roles when tournament deleted
  userId: text("user_id").notNull(), // Supabase auth user ID
  role: tournamentRoleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Organizer whitelist table - controls who can create tournaments
export const organizerWhitelist = pgTable("organizer_whitelist", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull().unique(), // Supabase auth user ID
  email: text("email").notNull(), // For reference/display
  addedBy: text("added_by").notNull(), // User ID of admin who added them
  addedAt: timestamp("added_at").defaultNow().notNull(),
  notes: text("notes"), // Optional notes about why whitelisted
});

// Type exports for use in the application
export type Tournament = typeof tournaments.$inferSelect;
export type NewTournament = typeof tournaments.$inferInsert;

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

export type TournamentRole = typeof tournamentRoles.$inferSelect;
export type NewTournamentRole = typeof tournamentRoles.$inferInsert;

export type OrganizerWhitelist = typeof organizerWhitelist.$inferSelect;
export type NewOrganizerWhitelist = typeof organizerWhitelist.$inferInsert;
