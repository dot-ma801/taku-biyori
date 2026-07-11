CREATE SCHEMA "lobby";
--> statement-breakpoint
CREATE TYPE "lobby"."lobby_answer" AS ENUM('ok', 'maybe', 'ng');--> statement-breakpoint
CREATE TABLE "lobby"."lobbies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"host_user_id" text NOT NULL,
	"title" text NOT NULL,
	"scenario_name" text,
	"description" text,
	"location" text,
	"max_players" integer,
	"guest_link_token" text NOT NULL,
	"is_published" boolean DEFAULT false NOT NULL,
	"open_until" date,
	"closed_at" timestamp,
	"cancelled_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lobby"."lobby_answers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"answer" "lobby"."lobby_answer" NOT NULL,
	"comment" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lobby_answers_candidate_member_unique" UNIQUE("candidate_id","member_id")
);
--> statement-breakpoint
CREATE TABLE "lobby"."lobby_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lobby_id" uuid NOT NULL,
	"date" date NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lobby"."lobby_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"lobby_id" uuid NOT NULL,
	"user_id" text,
	"guest_name" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "lobby"."lobbies" ADD CONSTRAINT "lobbies_host_user_id_user_id_fk" FOREIGN KEY ("host_user_id") REFERENCES "auth"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby"."lobby_answers" ADD CONSTRAINT "lobby_answers_candidate_id_lobby_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "lobby"."lobby_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby"."lobby_answers" ADD CONSTRAINT "lobby_answers_member_id_lobby_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "lobby"."lobby_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby"."lobby_candidates" ADD CONSTRAINT "lobby_candidates_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobby"."lobbies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby"."lobby_members" ADD CONSTRAINT "lobby_members_lobby_id_lobbies_id_fk" FOREIGN KEY ("lobby_id") REFERENCES "lobby"."lobbies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lobby"."lobby_members" ADD CONSTRAINT "lobby_members_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "lobby_answers_candidate_id_idx" ON "lobby"."lobby_answers" USING btree ("candidate_id");--> statement-breakpoint
CREATE INDEX "lobby_answers_member_id_idx" ON "lobby"."lobby_answers" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "lobby_candidates_lobby_id_idx" ON "lobby"."lobby_candidates" USING btree ("lobby_id");--> statement-breakpoint
CREATE UNIQUE INDEX "lobby_members_lobby_id_user_id_unique" ON "lobby"."lobby_members" USING btree ("lobby_id","user_id") WHERE "lobby"."lobby_members"."user_id" IS NOT NULL;