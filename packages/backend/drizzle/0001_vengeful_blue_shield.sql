CREATE TABLE "game_session_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_session_id" uuid NOT NULL,
	"user_id" text,
	"guest_name" text,
	"character_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_user_id" text NOT NULL,
	"title" text NOT NULL,
	"scenario_name" text,
	"description" text,
	"max_players" integer,
	"guest_link_token" text NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"open_until" date,
	"scheduled_at" date,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_session_members" ADD CONSTRAINT "game_session_members_game_session_id_game_sessions_id_fk" FOREIGN KEY ("game_session_id") REFERENCES "public"."game_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_session_members" ADD CONSTRAINT "game_session_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_sessions" ADD CONSTRAINT "game_sessions_host_user_id_user_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "auth"."user"("id") ON DELETE no action ON UPDATE no action;