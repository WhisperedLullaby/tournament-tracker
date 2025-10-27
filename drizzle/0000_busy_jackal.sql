CREATE TYPE "public"."bracket_type" AS ENUM('winners', 'losers', 'championship');--> statement-breakpoint
CREATE TYPE "public"."match_status" AS ENUM('pending', 'in_progress', 'completed');--> statement-breakpoint
CREATE TABLE "bracket_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"game_number" integer NOT NULL,
	"bracket_type" "bracket_type" NOT NULL,
	"team_a_id" integer,
	"team_b_id" integer,
	"team_a_score" integer DEFAULT 0 NOT NULL,
	"team_b_score" integer DEFAULT 0 NOT NULL,
	"status" "match_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "bracket_teams" (
	"id" serial PRIMARY KEY NOT NULL,
	"team_name" text NOT NULL,
	"pod1_id" integer NOT NULL,
	"pod2_id" integer NOT NULL,
	"pod3_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pods" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"player1" text NOT NULL,
	"player2" text NOT NULL,
	"team_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pool_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"round_number" integer NOT NULL,
	"team_a_pods" json NOT NULL,
	"team_b_pods" json NOT NULL,
	"team_a_score" integer DEFAULT 0 NOT NULL,
	"team_b_score" integer DEFAULT 0 NOT NULL,
	"status" "match_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "pool_standings" (
	"id" serial PRIMARY KEY NOT NULL,
	"pod_id" integer NOT NULL,
	"wins" integer DEFAULT 0 NOT NULL,
	"losses" integer DEFAULT 0 NOT NULL,
	"points_for" integer DEFAULT 0 NOT NULL,
	"points_against" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_team_a_id_bracket_teams_id_fk" FOREIGN KEY ("team_a_id") REFERENCES "public"."bracket_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_team_b_id_bracket_teams_id_fk" FOREIGN KEY ("team_b_id") REFERENCES "public"."bracket_teams"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_teams" ADD CONSTRAINT "bracket_teams_pod1_id_pods_id_fk" FOREIGN KEY ("pod1_id") REFERENCES "public"."pods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_teams" ADD CONSTRAINT "bracket_teams_pod2_id_pods_id_fk" FOREIGN KEY ("pod2_id") REFERENCES "public"."pods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bracket_teams" ADD CONSTRAINT "bracket_teams_pod3_id_pods_id_fk" FOREIGN KEY ("pod3_id") REFERENCES "public"."pods"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pool_standings" ADD CONSTRAINT "pool_standings_pod_id_pods_id_fk" FOREIGN KEY ("pod_id") REFERENCES "public"."pods"("id") ON DELETE no action ON UPDATE no action;