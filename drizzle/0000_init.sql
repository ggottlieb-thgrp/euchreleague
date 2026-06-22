CREATE TYPE "public"."availability_source" AS ENUM('manual', 'outlook');--> statement-breakpoint
CREATE TYPE "public"."league" AS ENUM('competitive', 'casual');--> statement-breakpoint
CREATE TYPE "public"."notification_category" AS ENUM('pairings', 'schedule', 'score_reminders', 'game_reminders', 'auth');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('sent', 'failed');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('player', 'admin');--> statement-breakpoint
CREATE TYPE "public"."schedule_status" AS ENUM('unscheduled', 'proposed', 'confirmed');--> statement-breakpoint
CREATE TYPE "public"."week_status" AS ENUM('pending', 'preview', 'published', 'completed');--> statement-breakpoint
CREATE TABLE "accounts" (
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "accounts_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"author_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "availability_overrides" (
	"user_id" uuid NOT NULL,
	"week_id" integer NOT NULL,
	"slot_key" text NOT NULL,
	"is_free" boolean NOT NULL,
	"source" "availability_source" DEFAULT 'manual' NOT NULL,
	CONSTRAINT "availability_overrides_user_id_week_id_slot_key_pk" PRIMARY KEY("user_id","week_id","slot_key")
);
--> statement-breakpoint
CREATE TABLE "availability_recurring" (
	"user_id" uuid NOT NULL,
	"weekday" smallint NOT NULL,
	"slot_index" smallint NOT NULL,
	"source" "availability_source" DEFAULT 'manual' NOT NULL,
	CONSTRAINT "availability_recurring_user_id_weekday_slot_index_pk" PRIMARY KEY("user_id","weekday","slot_index")
);
--> statement-breakpoint
CREATE TABLE "game_scores" (
	"game_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"points" integer NOT NULL,
	"team" smallint NOT NULL,
	CONSTRAINT "game_scores_game_id_user_id_pk" PRIMARY KEY("game_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" serial PRIMARY KEY NOT NULL,
	"matchup_id" integer NOT NULL,
	"game_num" smallint NOT NULL,
	"combo_index" smallint,
	"winner_team" smallint,
	"submitted_at" timestamp,
	"submitted_by" uuid
);
--> statement-breakpoint
CREATE TABLE "locations" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"building" text,
	"floor" text,
	"capacity" integer,
	"notes" text,
	"timezone" text DEFAULT 'America/Indiana/Indianapolis' NOT NULL,
	"active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "matchup_players" (
	"matchup_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"seat" smallint NOT NULL,
	CONSTRAINT "matchup_players_matchup_id_user_id_pk" PRIMARY KEY("matchup_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "matchups" (
	"id" serial PRIMARY KEY NOT NULL,
	"week_id" integer NOT NULL,
	"league" "league" NOT NULL,
	"location_id" integer,
	"is_bye" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notification_prefs" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"pairings" boolean DEFAULT true NOT NULL,
	"schedule" boolean DEFAULT true NOT NULL,
	"score_reminders" boolean DEFAULT true NOT NULL,
	"game_reminders" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" uuid,
	"category" "notification_category" NOT NULL,
	"subject" text,
	"status" "notification_status" NOT NULL,
	"error" text,
	"sent_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "opt_ins" (
	"user_id" uuid NOT NULL,
	"week_id" integer NOT NULL,
	"opted_in" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "opt_ins_user_id_week_id_pk" PRIMARY KEY("user_id","week_id")
);
--> statement-breakpoint
CREATE TABLE "profiles" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"display_name" text,
	"bio" text,
	"avatar_url" text,
	"prefs" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "scheduled_games" (
	"id" serial PRIMARY KEY NOT NULL,
	"matchup_id" integer NOT NULL,
	"location_id" integer,
	"starts_at" timestamp with time zone,
	"duration_min" integer DEFAULT 90 NOT NULL,
	"status" "schedule_status" DEFAULT 'unscheduled' NOT NULL,
	"proposed_by" uuid,
	"confirmed_at" timestamp,
	CONSTRAINT "scheduled_games_matchup_id_unique" UNIQUE("matchup_id")
);
--> statement-breakpoint
CREATE TABLE "seasons" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"league" "league" NOT NULL,
	"start_date" date,
	"num_weeks" integer DEFAULT 4 NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text,
	"league" "league" DEFAULT 'competitive' NOT NULL,
	"role" "role" DEFAULT 'player' NOT NULL,
	"home_location_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "weeks" (
	"id" serial PRIMARY KEY NOT NULL,
	"season_id" integer NOT NULL,
	"week_number" integer NOT NULL,
	"starts_on" date,
	"pairings_lock_at" timestamp,
	"scores_due_at" timestamp,
	"status" "week_status" DEFAULT 'pending' NOT NULL,
	"generated_at" timestamp,
	"published_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_users_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_overrides" ADD CONSTRAINT "availability_overrides_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_overrides" ADD CONSTRAINT "availability_overrides_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "availability_recurring" ADD CONSTRAINT "availability_recurring_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_scores" ADD CONSTRAINT "game_scores_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_matchup_id_matchups_id_fk" FOREIGN KEY ("matchup_id") REFERENCES "public"."matchups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_submitted_by_users_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchup_players" ADD CONSTRAINT "matchup_players_matchup_id_matchups_id_fk" FOREIGN KEY ("matchup_id") REFERENCES "public"."matchups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchup_players" ADD CONSTRAINT "matchup_players_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchups" ADD CONSTRAINT "matchups_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "matchups" ADD CONSTRAINT "matchups_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notification_prefs" ADD CONSTRAINT "notification_prefs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opt_ins" ADD CONSTRAINT "opt_ins_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "opt_ins" ADD CONSTRAINT "opt_ins_week_id_weeks_id_fk" FOREIGN KEY ("week_id") REFERENCES "public"."weeks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_games" ADD CONSTRAINT "scheduled_games_matchup_id_matchups_id_fk" FOREIGN KEY ("matchup_id") REFERENCES "public"."matchups"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_games" ADD CONSTRAINT "scheduled_games_location_id_locations_id_fk" FOREIGN KEY ("location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scheduled_games" ADD CONSTRAINT "scheduled_games_proposed_by_users_id_fk" FOREIGN KEY ("proposed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_home_location_id_locations_id_fk" FOREIGN KEY ("home_location_id") REFERENCES "public"."locations"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "weeks" ADD CONSTRAINT "weeks_season_id_seasons_id_fk" FOREIGN KEY ("season_id") REFERENCES "public"."seasons"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "games_matchup_num_uq" ON "games" USING btree ("matchup_id","game_num");--> statement-breakpoint
CREATE UNIQUE INDEX "matchup_players_seat_uq" ON "matchup_players" USING btree ("matchup_id","seat");--> statement-breakpoint
CREATE INDEX "matchups_week_idx" ON "matchups" USING btree ("week_id");--> statement-breakpoint
CREATE UNIQUE INDEX "weeks_season_number_uq" ON "weeks" USING btree ("season_id","week_number");