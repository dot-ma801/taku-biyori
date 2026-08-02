CREATE TABLE "game_session"."game_session_play_memos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"body" text DEFAULT '' NOT NULL,
	"shared_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "game_session_play_memos_member_id_unique" UNIQUE("member_id")
);
--> statement-breakpoint
ALTER TABLE "game_session"."game_session_play_memos" ADD CONSTRAINT "game_session_play_memos_member_id_game_session_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "game_session"."game_session_members"("id") ON DELETE cascade ON UPDATE no action;