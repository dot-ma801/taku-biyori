-- Issue #116: CharacterAssignment を Seat から分離し、プレイメモを seat_id 契約へ統一する
CREATE TABLE "game_session"."character_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seat_id" uuid NOT NULL,
	"character_name" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "character_assignments_seat_id_unique" UNIQUE("seat_id")
);
--> statement-breakpoint
ALTER TABLE "game_session"."character_assignments" ADD CONSTRAINT "character_assignments_seat_id_seats_id_fk" FOREIGN KEY ("seat_id") REFERENCES "game_session"."seats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- 既存のキャラクター名を新テーブルへ移してからカラムを落とす
INSERT INTO "game_session"."character_assignments" ("seat_id", "character_name")
	SELECT "id", "character_name" FROM "game_session"."seats" WHERE "character_name" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "game_session"."seats" DROP COLUMN "character_name";--> statement-breakpoint
ALTER TABLE "game_session"."game_session_play_memos" RENAME TO "play_memos";--> statement-breakpoint
-- RENAME TO は制約名を引き継がないので、スキーマ側の名前に手で揃える
ALTER TABLE "game_session"."play_memos" RENAME CONSTRAINT "game_session_play_memos_seat_id_unique" TO "play_memos_seat_id_unique";--> statement-breakpoint
ALTER TABLE "game_session"."play_memos" RENAME CONSTRAINT "game_session_play_memos_seat_id_seats_id_fk" TO "play_memos_seat_id_seats_id_fk";
