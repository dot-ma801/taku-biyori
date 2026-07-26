ALTER TABLE "game_session"."game_session_answers" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "game_session"."game_session_candidates" DISABLE ROW LEVEL SECURITY;--> statement-breakpoint
DROP TABLE "game_session"."game_session_answers" CASCADE;--> statement-breakpoint
DROP TABLE "game_session"."game_session_candidates" CASCADE;--> statement-breakpoint
-- 卓は日程が確定した状態でのみ存在する（design-v1.1 §8）。
-- scheduled_at が null の卓は日程調整を卓側で行っていた旧経路の開発データのみで、
-- 本番データは存在しないため NOT NULL 化の前に削除する（migration-plan 段階6c）。
DELETE FROM "game_session"."game_sessions" WHERE "scheduled_at" IS NULL;--> statement-breakpoint
ALTER TABLE "game_session"."game_sessions" ALTER COLUMN "scheduled_at" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "game_session"."game_sessions" DROP COLUMN "open_until";--> statement-breakpoint
DROP TYPE "game_session"."availability_date_answer";