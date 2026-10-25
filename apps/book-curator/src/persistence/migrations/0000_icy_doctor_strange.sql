CREATE TABLE "books" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"author" text NOT NULL,
	"relevance" jsonb NOT NULL,
	"keywords" jsonb NOT NULL,
	"reason" text NOT NULL,
	"question" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "drawer_stock" (
	"drawer" text NOT NULL,
	"book_id" text NOT NULL,
	"quantity" integer NOT NULL,
	CONSTRAINT "drawer_stock_drawer_book_id_pk" PRIMARY KEY("drawer","book_id"),
	CONSTRAINT "drawer_stock_quantity_non_negative" CHECK ("drawer_stock"."quantity" >= 0)
);
