CREATE TABLE "game_session"."game_session_member_link_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"requested_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "game_session_member_link_requests_member_user_unique" UNIQUE("member_id","requested_user_id")
);
--> statement-breakpoint
CREATE TABLE "lobby"."lobby_member_link_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"member_id" uuid NOT NULL,
	"requested_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lobby_member_link_requests_member_user_unique" UNIQUE("member_id","requested_user_id")
);
--> statement-breakpoint
ALTER TABLE "game_session"."game_session_member_link_requests" ADD CONSTRAINT "game_session_member_link_requests_member_id_game_session_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "game_session"."game_session_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "game_session"."game_session_member_link_requests" ADD CONSTRAINT "game_session_member_link_requests_requested_user_id_user_id_fk" FOREIGN KEY ("requested_user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby"."lobby_member_link_requests" ADD CONSTRAINT "lobby_member_link_requests_member_id_lobby_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "lobby"."lobby_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby"."lobby_member_link_requests" ADD CONSTRAINT "lobby_member_link_requests_requested_user_id_user_id_fk" FOREIGN KEY ("requested_user_id") REFERENCES "auth"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "game_session_member_link_requests_member_id_idx" ON "game_session"."game_session_member_link_requests" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "lobby_member_link_requests_member_id_idx" ON "lobby"."lobby_member_link_requests" USING btree ("member_id");