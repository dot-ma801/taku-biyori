ALTER TABLE "game_session"."game_session_members" DROP CONSTRAINT "game_session_members_lobby_member_id_lobby_members_id_fk";
--> statement-breakpoint
ALTER TABLE "game_session"."game_sessions" DROP CONSTRAINT "game_sessions_lobby_id_lobbies_id_fk";
--> statement-breakpoint
DROP INDEX "game_session"."game_session_members_lobby_member_id_idx";--> statement-breakpoint
DROP INDEX "game_session"."game_sessions_lobby_id_idx";--> statement-breakpoint
ALTER TABLE "game_session"."game_session_members" DROP COLUMN "lobby_member_id";--> statement-breakpoint
ALTER TABLE "game_session"."game_sessions" DROP COLUMN "lobby_id";--> statement-breakpoint
ALTER TABLE "lobby"."lobbies" DROP COLUMN "closed_at";