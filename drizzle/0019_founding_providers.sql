CREATE TABLE "founding_link" (
	"id" text PRIMARY KEY DEFAULT 'main' NOT NULL,
	"code" text NOT NULL,
	"cap" integer DEFAULT 51 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_profile" ADD COLUMN "founding_at" timestamp with time zone;