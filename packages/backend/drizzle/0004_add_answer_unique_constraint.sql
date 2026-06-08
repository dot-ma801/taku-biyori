ALTER TABLE "game_session_answers" ADD CONSTRAINT "game_session_answers_candidate_member_unique" UNIQUE("candidate_id","member_id");
