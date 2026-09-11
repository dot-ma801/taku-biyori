-- 日程調整（SchedulePoll）への移行（design-v2 §3-4 / §3-5 / §3-6、issue #114）。
--
-- drizzle-kit の生成結果は DROP TABLE + CREATE TABLE だったが、候補日と回答を
-- 失わずに移行できるため RENAME 主体に書き換えている。
-- 既存の候補日はロビー直下にぶら下がっていたので、候補日を持つロビーごとに
-- 日程調整を1件ずつ作り、その配下へ付け替える。

-- enum 名の改名（lobby.lobby_answer → lobby.schedule_answer）。
-- 列の型参照は PostgreSQL 側で追随するため、列の張り替えは不要
ALTER TYPE "lobby"."lobby_answer" RENAME TO "schedule_answer";--> statement-breakpoint

CREATE TABLE "lobby"."schedule_polls" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lobby_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT clock_timestamp() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lobby"."schedule_polls" ADD CONSTRAINT "schedule_polls_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobby"."lobbies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "schedule_polls_lobby_id_created_at_idx" ON "lobby"."schedule_polls" USING btree ("lobby_id","created_at" DESC NULLS LAST);--> statement-breakpoint

-- 候補日を持つロビーへ日程調整を1件ずつ作る。
-- 候補日が無いロビー（直接卓立ての経路）は0行のままにする（design-v2 §5-3）
INSERT INTO "lobby"."schedule_polls" ("lobby_id")
SELECT DISTINCT "lobby_id" FROM "lobby"."lobby_candidates";--> statement-breakpoint

-- lobby_candidates → candidate_dates（lobby_id → poll_id、date_note → time_label）
ALTER TABLE "lobby"."lobby_candidates" RENAME TO "candidate_dates";--> statement-breakpoint
ALTER TABLE "lobby"."candidate_dates" RENAME COLUMN "date_note" TO "time_label";--> statement-breakpoint
ALTER TABLE "lobby"."candidate_dates" ADD COLUMN "poll_id" uuid;--> statement-breakpoint
UPDATE "lobby"."candidate_dates" AS c
SET "poll_id" = p."id"
FROM "lobby"."schedule_polls" AS p
WHERE p."lobby_id" = c."lobby_id";--> statement-breakpoint
ALTER TABLE "lobby"."candidate_dates" ALTER COLUMN "poll_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "lobby"."candidate_dates" DROP CONSTRAINT "lobby_candidates_lobby_id_lobbies_id_fk";--> statement-breakpoint
ALTER TABLE "lobby"."candidate_dates" DROP CONSTRAINT "lobby_candidates_lobby_id_date_unique";--> statement-breakpoint
DROP INDEX "lobby"."lobby_candidates_lobby_id_idx";--> statement-breakpoint
ALTER TABLE "lobby"."candidate_dates" DROP COLUMN "lobby_id";--> statement-breakpoint
ALTER TABLE "lobby"."candidate_dates" ADD CONSTRAINT "candidate_dates_poll_id_date_unique" UNIQUE("poll_id","date");--> statement-breakpoint
ALTER TABLE "lobby"."candidate_dates" ADD CONSTRAINT "candidate_dates_poll_id_schedule_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "lobby"."schedule_polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidate_dates_poll_id_idx" ON "lobby"."candidate_dates" USING btree ("poll_id");--> statement-breakpoint

-- lobby_answers → schedule_answers（candidate_id → candidate_date_id、member_id → lobby_entry_id）
ALTER TABLE "lobby"."lobby_answers" RENAME TO "schedule_answers";--> statement-breakpoint
ALTER TABLE "lobby"."schedule_answers" RENAME COLUMN "candidate_id" TO "candidate_date_id";--> statement-breakpoint
ALTER TABLE "lobby"."schedule_answers" RENAME COLUMN "member_id" TO "lobby_entry_id";--> statement-breakpoint
ALTER TABLE "lobby"."schedule_answers" RENAME CONSTRAINT "lobby_answers_candidate_id_lobby_candidates_id_fk" TO "schedule_answers_candidate_date_id_candidate_dates_id_fk";--> statement-breakpoint
ALTER TABLE "lobby"."schedule_answers" RENAME CONSTRAINT "lobby_answers_member_id_lobby_entries_id_fk" TO "schedule_answers_lobby_entry_id_lobby_entries_id_fk";--> statement-breakpoint
ALTER TABLE "lobby"."schedule_answers" RENAME CONSTRAINT "lobby_answers_candidate_member_unique" TO "schedule_answers_candidate_date_entry_unique";--> statement-breakpoint
ALTER INDEX "lobby"."lobby_answers_candidate_id_idx" RENAME TO "schedule_answers_candidate_date_id_idx";--> statement-breakpoint
ALTER INDEX "lobby"."lobby_answers_member_id_idx" RENAME TO "schedule_answers_lobby_entry_id_idx";
