CREATE TABLE "handovers" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"version" integer NOT NULL,
	"recommended" text NOT NULL,
	"handed" text NOT NULL,
	CONSTRAINT "handovers_version_positive" CHECK ("handovers"."version" > 0)
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"version" integer NOT NULL,
	"drawer" text NOT NULL,
	"book_id" text NOT NULL,
	CONSTRAINT "purchases_version_positive" CHECK ("purchases"."version" > 0)
);
