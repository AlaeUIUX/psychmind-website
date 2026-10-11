CREATE TYPE "public"."account_recovery_status" AS ENUM('open', 'completed', 'declined');--> statement-breakpoint
CREATE TABLE "account_recovery_request" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text,
	"account_email" text NOT NULL,
	"contact_email" text NOT NULL,
	"full_name" text NOT NULL,
	"claimed_role" text NOT NULL,
	"license_number" text,
	"details" text,
	"signed_in" boolean DEFAULT false NOT NULL,
	"id_storage_key" text,
	"id_file_name" text,
	"id_mime_type" text,
	"status" "account_recovery_status" DEFAULT 'open' NOT NULL,
	"resolved_by_id" text,
	"resolved_at" timestamp with time zone,
	"resolution_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account_recovery_request" ADD CONSTRAINT "account_recovery_request_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "account_recovery_request" ADD CONSTRAINT "account_recovery_request_resolved_by_id_user_id_fk" FOREIGN KEY ("resolved_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_recovery_status_idx" ON "account_recovery_request" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "account_recovery_email_idx" ON "account_recovery_request" USING btree ("account_email");