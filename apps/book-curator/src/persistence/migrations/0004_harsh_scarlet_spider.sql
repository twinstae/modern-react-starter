CREATE TABLE "question_set_drafts" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"question_set" jsonb NOT NULL,
	"created_at" text NOT NULL,
	"updated_at" text NOT NULL
);
