CREATE TABLE "email_failure" (
	"id" text PRIMARY KEY NOT NULL,
	"recipient" text NOT NULL,
	"subject" text NOT NULL,
	"error" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"handled_at" timestamp with time zone,
	"handled_by_id" text
);
--> statement-breakpoint
ALTER TABLE "email_failure" ADD CONSTRAINT "email_failure_handled_by_id_user_id_fk" FOREIGN KEY ("handled_by_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "email_failure_open_idx" ON "email_failure" USING btree ("handled_at","created_at");