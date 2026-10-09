CREATE TABLE "analytics_daily" (
	"day" date NOT NULL,
	"metric" text NOT NULL,
	"profile_id" text DEFAULT '' NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "analytics_daily_day_metric_profile_id_pk" PRIMARY KEY("day","metric","profile_id")
);
--> statement-breakpoint
CREATE TABLE "analytics_term" (
	"day" date NOT NULL,
	"profile_id" text DEFAULT '' NOT NULL,
	"term" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "analytics_term_day_profile_id_term_pk" PRIMARY KEY("day","profile_id","term")
);
--> statement-breakpoint
CREATE TABLE "analytics_visitor" (
	"day" date NOT NULL,
	"hash" text NOT NULL,
	CONSTRAINT "analytics_visitor_day_hash_pk" PRIMARY KEY("day","hash")
);
--> statement-breakpoint
CREATE INDEX "analytics_daily_profile_idx" ON "analytics_daily" USING btree ("profile_id","day");