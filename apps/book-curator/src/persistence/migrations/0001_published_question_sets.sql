CREATE TABLE "published_question_set_pointer" (
	"id" text PRIMARY KEY NOT NULL,
	"version" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "published_question_sets" (
	"version" integer PRIMARY KEY NOT NULL,
	"question_set" jsonb NOT NULL,
	CONSTRAINT "published_question_sets_version_positive" CHECK ("published_question_sets"."version" > 0)
);
