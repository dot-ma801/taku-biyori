ALTER TABLE "lobby"."lobby_members" RENAME TO "lobby_entries";--> statement-breakpoint
ALTER TABLE "lobby"."lobbies" ADD COLUMN "published_at" timestamp;--> statement-breakpoint
-- boolean の is_published を nullable timestamp へ置き換える（design-v2 §3-2）。
-- 公開した正確な時点は既存行には残っていないため、公開済みの行は created_at で代用する。
UPDATE "lobby"."lobbies" SET "published_at" = "created_at" WHERE "is_published";--> statement-breakpoint
ALTER TABLE "lobby"."lobbies" DROP COLUMN "is_published";--> statement-breakpoint
ALTER TABLE "lobby"."lobbies" RENAME COLUMN "cancelled_at" TO "disbanded_at";--> statement-breakpoint
ALTER TABLE "lobby"."lobby_answers" DROP CONSTRAINT "lobby_answers_member_id_lobby_members_id_fk";
--> statement-breakpoint
ALTER TABLE "lobby"."lobby_entries" DROP CONSTRAINT "lobby_members_lobby_id_lobbies_id_fk";
--> statement-breakpoint
ALTER TABLE "lobby"."lobby_entries" DROP CONSTRAINT "lobby_members_user_id_user_id_fk";
--> statement-breakpoint
DROP INDEX "lobby"."lobby_members_lobby_id_user_id_unique";--> statement-breakpoint
ALTER TABLE "lobby"."lobbies" ADD COLUMN "reception_closed_at" timestamp;--> statement-breakpoint
ALTER TABLE "lobby"."lobby_entries" ADD COLUMN "left_at" timestamp;--> statement-breakpoint
ALTER TABLE "lobby"."lobby_answers" ADD CONSTRAINT "lobby_answers_member_id_lobby_entries_id_fk" FOREIGN KEY ("member_id") REFERENCES "lobby"."lobby_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby"."lobby_entries" ADD CONSTRAINT "lobby_entries_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobby"."lobbies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby"."lobby_entries" ADD CONSTRAINT "lobby_entries_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "lobby_entries_lobby_id_user_id_unique" ON "lobby"."lobby_entries" USING btree ("lobby_id","user_id") WHERE "lobby"."lobby_entries"."user_id" IS NOT NULL;