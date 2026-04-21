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

export const tournamentTypeEnum = pgEnum("tournament_type", [
  "pod_2", // 2-player pods (current default)
  "pod_3", // 3-player pods
  "set_teams", // Pre-formed teams (captain + up to 8 players)
]);

export const tournamentBracketStyleEnum = pgEnum("tournament_bracket_style", [
  "single_elimination",
  "double_elimination",
]);

export const tournamentLevelEnum = pgEnum("tournament_level", [
  "c",
  "b",
  "a",
  "open",
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

  // Tournament configuration
  tournamentType: tournamentTypeEnum("tournament_type").default("pod_2").notNull(),
  bracketStyle: tournamentBracketStyleEnum("bracket_style").default("single_elimination").notNull(),
  level: tournamentLevelEnum("level").default("open"),
  maxPods: integer("max_pods").default(9).notNull(), // For pod tournaments
  maxTeams: integer("max_teams").default(9).notNull(), // For set team tournaments

  // Scoring configuration - stores { startPoints: 0, endPoints: 21, winByTwo: true, cap?: 27, game3EndPoints?: 15 }
  scoringRules: json("scoring_rules").$type<{
    startPoints: number;
    endPoints: number;
    winByTwo: boolean;
    cap?: number;
    game3EndPoints?: number;
  }>(),

  // Dynamic content sections (replaces hardcoded sections)
  poolPlayDescription: text("pool_play_description"), // Pool play format details
  bracketPlayDescription: text("bracket_play_description"), // Bracket play format details
  rulesDescription: text("rules_description"), // Tournament-specific rules
  prizeInfo: text("prize_info"), // Prize information
  entryFee: integer("entry_fee"), // Registration fee in dollars (null = free)
  paymentHandle: text("payment_handle"), // Venmo handle or payment instructions (null = pay in person)
  startTime: text("start_time"), // "HH:MM" 24h format, e.g. "10:00"
  estimatedEndTime: text("estimated_end_time"), // "HH:MM" 24h format, e.g. "14:00"

  registrationDeadline: timestamp("registration_deadline"),
  registrationOpenDate: timestamp("registration_open_date"),
  isPublic: boolean("is_public").default(true).notNull(),
  isTest: boolean("is_test").default(false).notNull(),
  requireAuth: boolean("require_auth").default(true).notNull(), // Require authentication to register
  createdBy: text("created_by").notNull(), // User ID of tournament creator
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Pods/Teams table - stores pods (2-3 players) or set teams (captain + up to 8 players)
export const pods = pgTable(
  "pods",
  {
    id: serial("id").primaryKey(),
    tournamentId: integer("tournament_id")
      .notNull()
      .references(() => tournaments.id, { onDelete: "cascade" }), // Link to tournament
    userId: text("user_id"), // Supabase auth.users.id (UUID as text) - captain (nullable for non-auth tournaments)
    email: text("email").notNull(), // Captain's email
    name: text("name").notNull(), // e.g., "John & Sarah" or team name
    player1: text("player1").notNull(), // Required for all tournament types
    player2: text("player2"), // Required for 2-pod, optional for set teams (players added later)
    player3: text("player3"), // For 3-pod tournaments
    teamName: text("team_name"), // Optional custom team name
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // Unique constraint: one pod per user per tournament (only applies when userId is not null)
    // Note: For non-auth tournaments, duplicate prevention is handled by email validation in API
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
    .references(() => tournaments.id, { onDelete: "cascade" }), // Link to tournament
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
    .references(() => tournaments.id, { onDelete: "cascade" }), // Link to tournament
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
    .references(() => tournaments.id, { onDelete: "cascade" }), // Link to tournament
  teamName: text("team_name").notNull(), // "A", "B", "C"
  pod1Id: integer("pod1_id")
    .notNull()
    .references(() => pods.id), // Top/Middle/Bottom tier
  pod2Id: integer("pod2_id")
    .notNull()
    .references(() => pods.id),
  pod3Id: integer("pod3_id")
    .references(() => pods.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bracket matches table - stores bracket play games (up to 5 games)
export const bracketMatches = pgTable("bracket_matches", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id")
    .notNull()
    .references(() => tournaments.id, { onDelete: "cascade" }), // Link to tournament
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
  isAdmin: boolean("is_admin").default(false).notNull(),
});

// ─── Pickup Games ─────────────────────────────────────────────────────────────

export const pickupStatusEnum = pgEnum("pickup_status", [
  "upcoming",
  "attendance",
  "active",
  "completed",
]);

export const pickupRegistrationStatusEnum = pgEnum(
  "pickup_registration_status",
  ["registered", "waitlisted", "attended", "no_show"]
);

export const volleyballPositionEnum = pgEnum("volleyball_position", [
  "setter",
  "outside_hitter",
  "middle_blocker",
  "opposite",
  "libero",
  "defensive_specialist",
]);

export const pickupSeriesFormatEnum = pgEnum("pickup_series_format", [
  "best_of_3",
  "best_of_5",
]);

export const pickupSessions = pgTable("pickup_sessions", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  date: timestamp("date").notNull(),
  startTime: text("start_time"),
  estimatedEndTime: text("estimated_end_time"),
  location: text("location"),
  description: text("description"),
  status: pickupStatusEnum("status").default("upcoming").notNull(),
  totalCapacity: integer("total_capacity").notNull(),
  seriesFormat: pickupSeriesFormatEnum("series_format")
    .default("best_of_3")
    .notNull(),
  positionLimits: json("position_limits")
    .$type<Record<string, number>>()
    .notNull(),
  scoringRules: json("scoring_rules").$type<{
    endPoints: number;
    cap: number;
    winByTwo: boolean;
  }>().notNull(),
  currentSeriesNumber: integer("current_series_number").default(0).notNull(),
  isTest: boolean("is_test").default(false).notNull(),
  createdBy: text("created_by").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pickupRegistrations = pgTable(
  "pickup_registrations",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => pickupSessions.id, { onDelete: "cascade" }),
    userId: text("user_id"), // null for guests
    email: text("email").notNull(),
    displayName: text("display_name").notNull(),
    position: volleyballPositionEnum("position").notNull(),
    status: pickupRegistrationStatusEnum("status")
      .default("registered")
      .notNull(),
    waitlistPosition: integer("waitlist_position"), // null = confirmed spot; 1 = first in line
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    // One registration per authenticated user per session
    uniqueUserSession: unique("unique_user_pickup_session").on(
      table.userId,
      table.sessionId
    ),
  })
);

export const pickupSeries = pgTable("pickup_series", {
  id: serial("id").primaryKey(),
  sessionId: integer("session_id")
    .notNull()
    .references(() => pickupSessions.id, { onDelete: "cascade" }),
  seriesNumber: integer("series_number").notNull(),
  status: matchStatusEnum("status").default("pending").notNull(),
  teamAPlayerIds: json("team_a_player_ids").$type<number[]>().notNull(),
  teamBPlayerIds: json("team_b_player_ids").$type<number[]>().notNull(),
  benchPlayerIds: json("bench_player_ids").$type<number[]>().notNull(),
  teamASeriesWins: integer("team_a_series_wins").default(0).notNull(),
  teamBSeriesWins: integer("team_b_series_wins").default(0).notNull(),
  winningSide: text("winning_side"), // "A" | "B" | null
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pickupGames = pgTable("pickup_games", {
  id: serial("id").primaryKey(),
  seriesId: integer("series_id")
    .notNull()
    .references(() => pickupSeries.id, { onDelete: "cascade" }),
  sessionId: integer("session_id")
    .notNull()
    .references(() => pickupSessions.id, { onDelete: "cascade" }),
  gameNumber: integer("game_number").notNull(),
  teamAScore: integer("team_a_score").default(0).notNull(),
  teamBScore: integer("team_b_score").default(0).notNull(),
  status: matchStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const pickupPlayerStats = pgTable(
  "pickup_player_stats",
  {
    id: serial("id").primaryKey(),
    sessionId: integer("session_id")
      .notNull()
      .references(() => pickupSessions.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    position: volleyballPositionEnum("position").notNull(),
    seriesWins: integer("series_wins").default(0).notNull(),
    seriesLosses: integer("series_losses").default(0).notNull(),
    pointsFor: integer("points_for").default(0).notNull(),
    pointsAgainst: integer("points_against").default(0).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => ({
    uniquePlayerSession: unique("unique_player_pickup_stats").on(
      table.userId,
      table.sessionId
    ),
  })
);

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

export type PickupSession = typeof pickupSessions.$inferSelect;
export type NewPickupSession = typeof pickupSessions.$inferInsert;

export type PickupRegistration = typeof pickupRegistrations.$inferSelect;
export type NewPickupRegistration = typeof pickupRegistrations.$inferInsert;

export type PickupSeries = typeof pickupSeries.$inferSelect;
export type NewPickupSeries = typeof pickupSeries.$inferInsert;

export type PickupGame = typeof pickupGames.$inferSelect;
export type NewPickupGame = typeof pickupGames.$inferInsert;

export type PickupPlayerStats = typeof pickupPlayerStats.$inferSelect;
export type NewPickupPlayerStats = typeof pickupPlayerStats.$inferInsert;
