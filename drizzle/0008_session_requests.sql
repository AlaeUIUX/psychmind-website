CREATE TYPE "public"."session_request_status" AS ENUM('new', 'contacted');--> statement-breakpoint
CREATE TABLE "session_request" (
	"id" text PRIMARY KEY NOT NULL,
	"profile_id" text NOT NULL,
	"patient_id" text,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"session_type" text NOT NULL,
	"format" text NOT NULL,
	"note" text,
	"status" "session_request_status" DEFAULT 'new' NOT NULL,
	"contacted_at" timestamp with time zone,
	"is_demo" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "provider_profile" ADD COLUMN "request_email" text;--> statement-breakpoint
ALTER TABLE "session_request" ADD CONSTRAINT "session_request_profile_id_provider_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."provider_profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_request" ADD CONSTRAINT "session_request_patient_id_user_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "session_request_profile_idx" ON "session_request" USING btree ("profile_id","created_at");--> statement-breakpoint
CREATE INDEX "session_request_patient_idx" ON "session_request" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX "session_request_email_idx" ON "session_request" USING btree ("email","profile_id");