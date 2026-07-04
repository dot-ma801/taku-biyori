CREATE SCHEMA "game_session";
--> statement-breakpoint
ALTER TYPE "public"."availability_date_answer" SET SCHEMA "game_session";--> statement-breakpoint
ALTER TABLE "public"."game_session_answers" SET SCHEMA "game_session";
--> statement-breakpoint
ALTER TABLE "public"."game_session_candidates" SET SCHEMA "game_session";
--> statement-breakpoint
ALTER TABLE "public"."game_session_members" SET SCHEMA "game_session";
--> statement-breakpoint
ALTER TABLE "public"."game_sessions" SET SCHEMA "game_session";
