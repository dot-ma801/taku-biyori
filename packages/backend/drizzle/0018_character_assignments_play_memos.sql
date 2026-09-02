-- Issue #116: CharacterAssignment を Seat から分離し、プレイメモを seat_id 契約へ統一する
CREATE TABLE "game_session"."character_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "seat_id" uuid NOT NULL UNIQUE,
  "character_name" text NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "character_assignments_seat_id_seats_id_fk" FOREIGN KEY ("seat_id") REFERENCES "game_session"."seats"("id") ON DELETE cascade
);
INSERT INTO "game_session"."character_assignments" ("seat_id", "character_name")
  SELECT "id", "character_name" FROM "game_session"."seats" WHERE "character_name" IS NOT NULL;
ALTER TABLE "game_session"."seats" DROP COLUMN "character_name";
ALTER TABLE "game_session"."game_session_play_memos" RENAME TO "play_memos";
