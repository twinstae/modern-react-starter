CREATE TABLE "funnel_events" (
	"id" serial PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"kiosk_name" text NOT NULL,
	"version" integer NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	CONSTRAINT "funnel_events_version_positive" CHECK ("funnel_events"."version" > 0)
);
