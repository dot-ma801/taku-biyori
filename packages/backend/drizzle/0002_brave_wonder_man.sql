CREATE TABLE "game_session_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"answer" text NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "game_session_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_session_id" uuid NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "game_sessions" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "game_session_answers" ADD CONSTRAINT "game_session_answers_candidate_id_game_session_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."game_session_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_session_answers" ADD CONSTRAINT "game_session_answers_member_id_game_session_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."game_session_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_session_candidates" ADD CONSTRAINT "game_session_candidates_game_session_id_game_sessions_id_fk" FOREIGN KEY ("game_session_id") REFERENCES "public"."game_sessions"("id") ON DELETE cascade ON UPDATE no action;