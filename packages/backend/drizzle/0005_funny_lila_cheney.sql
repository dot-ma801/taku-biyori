ALTER TABLE "auth"."user" ADD COLUMN "username" text;--> statement-breakpoint
ALTER TABLE "auth"."user" ADD COLUMN "display_username" text;--> statement-breakpoint
CREATE UNIQUE INDEX "game_session_members_game_session_id_user_id_unique" ON "game_session_members" USING btree ("game_session_id","user_id") WHERE "game_session_members"."user_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "auth"."user" ADD CONSTRAINT "user_username_unique" UNIQUE("username");