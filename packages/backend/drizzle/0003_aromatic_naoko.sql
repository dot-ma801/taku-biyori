CREATE TYPE "public"."availability_date_answer" AS ENUM('ok', 'maybe', 'ng');--> statement-breakpoint
ALTER TABLE "game_session_answers" ALTER COLUMN "answer" SET DATA TYPE "public"."availability_date_answer" USING "answer"::"public"."availability_date_answer";--> statement-breakpoint
CREATE INDEX "game_session_answers_candidate_id_idx" ON "game_session_answers" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "game_session_answers_member_id_idx" ON "game_session_answers" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "game_session_candidates_game_session_id_idx" ON "game_session_candidates" USING btree ("game_session_id");