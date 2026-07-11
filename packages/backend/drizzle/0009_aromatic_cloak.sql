ALTER TABLE "game_session"."game_session_members" ADD COLUMN "lobby_member_id" uuid;--> statement-breakpoint
ALTER TABLE "game_session"."game_sessions" ADD COLUMN "cancelled_at" timestamp;--> statement-breakpoint
ALTER TABLE "game_session"."game_sessions" ADD COLUMN "lobby_id" uuid;--> statement-breakpoint
ALTER TABLE "game_session"."game_session_members" ADD CONSTRAINT "game_session_members_lobby_member_id_lobby_members_id_fk" FOREIGN KEY ("lobby_member_id") REFERENCES "lobby"."lobby_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_session"."game_sessions" ADD CONSTRAINT "game_sessions_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobby"."lobbies"("id") ON DELETE set null ON UPDATE no action;