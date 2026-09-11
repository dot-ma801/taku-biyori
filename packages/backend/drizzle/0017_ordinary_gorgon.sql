-- ロビーとセッションの分離（design-v2 §3-7 / §3-8、issue #115）。
--
-- **既存行は保持できないため破棄する。** 移行計画 §1-3 のとおり本番はテストデータのみで、
-- データ移行スクリプトは書かない方針（design-v2 §9-10）。加えて技術的にも復元不可能である。
--
--   * game_sessions.lobby_id は 0014 で一度 DROP しており、既存のセッションが
--     どのロビーのものだったかを示す列がもう残っていない
--   * seats.lobby_entry_id は (lobby_id, user_id) から引く必要があるが、
--     その lobby_id が上記のとおり失われている
--
-- したがって NOT NULL 列を足す前に対象テーブルを空にする。
-- 開発用データは `db:seed` で復元する。

CREATE TABLE "game_session"."seats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"game_session_id" uuid NOT NULL,
	"lobby_entry_id" uuid NOT NULL,
	"character_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "seats_game_session_id_lobby_entry_id_unique" UNIQUE("game_session_id","lobby_entry_id")
);
--> statement-breakpoint
-- 生成結果では DROP TABLE ... CASCADE が先だったが、CASCADE が
-- play_memos 側の FK も落としてしまい、後続の DROP CONSTRAINT が
-- 「制約が存在しない」で落ちる。FK を先に明示的に落とす順序へ入れ替えた
ALTER TABLE "game_session"."game_session_play_memos" DROP CONSTRAINT "game_session_play_memos_member_id_game_session_members_id_fk";
--> statement-breakpoint
ALTER TABLE "game_session"."game_session_play_memos" DROP CONSTRAINT "game_session_play_memos_member_id_unique";--> statement-breakpoint
ALTER TABLE "game_session"."game_session_members" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "game_session"."game_session_members" CASCADE;--> statement-breakpoint
ALTER TABLE "game_session"."game_sessions" DROP CONSTRAINT "game_sessions_host_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "game_session"."game_sessions" ALTER COLUMN "title" DROP NOT NULL;--> statement-breakpoint
-- 以降の ADD COLUMN ... NOT NULL は既存行があると失敗する。
-- 冒頭のとおり付け替え先を復元できないため、ここで既存行を破棄する
DELETE FROM "game_session"."game_session_play_memos";--> statement-breakpoint
DELETE FROM "game_session"."game_sessions";--> statement-breakpoint
ALTER TABLE "game_session"."game_session_play_memos" ADD COLUMN "seat_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "game_session"."game_sessions" ADD COLUMN "lobby_id" uuid NOT NULL;--> statement-breakpoint
ALTER TABLE "game_session"."game_sessions" ADD COLUMN "time_label" text;--> statement-breakpoint
ALTER TABLE "game_session"."seats" ADD CONSTRAINT "seats_game_session_id_game_sessions_id_fk" FOREIGN KEY ("game_session_id") REFERENCES "game_session"."game_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_session"."seats" ADD CONSTRAINT "seats_lobby_entry_id_lobby_entries_id_fk" FOREIGN KEY ("lobby_entry_id") REFERENCES "lobby"."lobby_entries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "seats_lobby_entry_id_idx" ON "game_session"."seats" USING btree ("lobby_entry_id");--> statement-breakpoint
ALTER TABLE "game_session"."game_session_play_memos" ADD CONSTRAINT "game_session_play_memos_seat_id_seats_id_fk" FOREIGN KEY ("seat_id") REFERENCES "game_session"."seats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_session"."game_sessions" ADD CONSTRAINT "game_sessions_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobby"."lobbies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "game_sessions_lobby_id_scheduled_at_idx" ON "game_session"."game_sessions" USING btree ("lobby_id","scheduled_at");--> statement-breakpoint
ALTER TABLE "game_session"."game_session_play_memos" DROP COLUMN "member_id";--> statement-breakpoint
ALTER TABLE "game_session"."game_sessions" DROP COLUMN "host_user_id";--> statement-breakpoint
ALTER TABLE "game_session"."game_sessions" DROP COLUMN "max_players";--> statement-breakpoint
ALTER TABLE "game_session"."game_sessions" DROP COLUMN "guest_link_token";--> statement-breakpoint
ALTER TABLE "game_session"."game_sessions" DROP COLUMN "is_published";--> statement-breakpoint
ALTER TABLE "game_session"."game_session_play_memos" ADD CONSTRAINT "game_session_play_memos_seat_id_unique" UNIQUE("seat_id");