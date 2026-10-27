CREATE TABLE "drawer_books" (
	"id" text PRIMARY KEY NOT NULL,
	"drawer_id" text NOT NULL,
	"position" serial NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"publisher" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drawers" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"position" serial NOT NULL,
	"questions" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "published_versions" (
	"version" integer PRIMARY KEY NOT NULL,
	"snapshot" jsonb NOT NULL,
	CONSTRAINT "published_versions_version_positive" CHECK ("published_versions"."version" > 0)
);
--> statement-breakpoint
ALTER TABLE "drawer_books" ADD CONSTRAINT "drawer_books_drawer_id_drawers_id_fk" FOREIGN KEY ("drawer_id") REFERENCES "public"."drawers"("id") ON DELETE cascade ON UPDATE no action;